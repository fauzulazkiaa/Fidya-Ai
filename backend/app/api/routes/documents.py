"""BYOD document upload — private namespace ingestion (US-020, FR-6)."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status

from app.api.deps import get_current_user
from app.core.logging import get_logger
from app.models.schemas import DocumentUploadResponse
from app.services.chunker import RawDocument, chunk_documents
from app.services.llm import embed_texts
from app.services.qdrant_service import get_vector_store, user_namespace

router = APIRouter(prefix="/documents", tags=["documents"])
log = get_logger(__name__, "routes.documents")

ALLOWED_TYPES = {"application/pdf", "text/plain", "text/markdown"}
ALLOWED_SUFFIXES = (".pdf", ".txt", ".md")
MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB — guard against memory DoS
MAX_PDF_PAGES = 300  # page-bomb guard: hostile PDFs with huge page trees
MAX_TEXT_CHARS = 400_000  # cap extractable text fed into the chunker


def _extract_text(data: bytes, filename: str) -> str:
    if filename.endswith(".pdf"):
        from io import BytesIO

        try:
            from pypdf import PdfReader  # optional dependency
        except ImportError as exc:
            raise RuntimeError("PDF support requires: pip install pypdf") from exc
        try:
            reader = PdfReader(BytesIO(data))
        except Exception as exc:  # noqa: BLE001 — malformed PDF payloads
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                "Could not parse this PDF file",
            ) from exc
        pages = reader.pages[:MAX_PDF_PAGES]
        text = "\n\n".join((page.extract_text() or "") for page in pages)
        return text[:MAX_TEXT_CHARS]
    return data.decode("utf-8", errors="replace")[:MAX_TEXT_CHARS]


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile,
    user: dict = Depends(get_current_user),
):
    """Ingest PDF/TXT/MD into the caller's isolated namespace.

    Validation is suffix-based (client content-type headers are spoofable)
    with a hard 10 MB size cap so a hostile upload can never exhaust the
    server's memory."""
    filename = file.filename or "document.txt"
    if not filename.lower().endswith(ALLOWED_SUFFIXES):
        raise HTTPException(
            status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            "Only PDF, TXT and MD files are supported",
        )

    # Read in bounded chunks — reject oversized files before buffering all.
    data = bytearray()
    while chunk := await file.read(1024 * 1024):
        data.extend(chunk)
        if len(data) > MAX_UPLOAD_BYTES:
            raise HTTPException(
                status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                "File exceeds the 10 MB upload limit",
            )

    try:
        text = _extract_text(bytes(data), filename.lower())
    except RuntimeError as exc:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, str(exc))
    if not text.strip():
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "No extractable text found in this file",
        )

    namespace = user_namespace(user["user_id"])

    document_id = f"doc_{uuid.uuid4().hex[:10]}"
    doc = RawDocument(
        source_title=filename,
        source_url="#",
        author="You",
        text=text,
    )
    chunks = chunk_documents([doc])
    vectors = await embed_texts([c["text"] for c in chunks])
    count = await get_vector_store().upsert_chunks(chunks, vectors, namespace)

    # Persist metadata so the documents table reflects reality (US-020).
    try:
        from app.db.supabase_client import get_store

        get_store().table("documents").insert(
            {
                "document_id": document_id,
                "user_id": user["user_id"],
                "filename": filename,
                "namespace": namespace,
                "chunks": count,
            }
        ).execute()
    except Exception as exc:  # noqa: BLE001 — indexing already succeeded
        log.warning("Document metadata persist failed: %s", exc)

    log.info("Indexed %d chunks from %s into %s", count, filename, namespace)
    return DocumentUploadResponse(
        document_id=document_id,
        filename=filename,
        chunks_indexed=count,
        namespace=namespace,
    )
