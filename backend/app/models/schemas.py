"""Pydantic request/response schemas shared across routes."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, EmailStr, Field


# ------------------------------------------------------------------------ auth
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    display_name: str = Field(default="", max_length=80)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(max_length=128)


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict[str, Any]


# ------------------------------------------------------------------ curriculum
class OnboardingPayload(BaseModel):
    # Length caps keep a hostile payload from inflating LLM prompts (cost DoS).
    target_topic: str = Field(max_length=120)
    current_level: Literal["Beginner", "Intermediate", "Advanced"]
    target_outcome: str = Field(default="", max_length=300)
    target_deadline: str = Field(max_length=10)
    hours_per_week: int = Field(ge=1, le=80)
    learning_style: str = Field(default="Project-based", max_length=40)


class GenerateCurriculumResponse(BaseModel):
    curriculum: dict[str, Any]


class SynthesizeResponse(BaseModel):
    module_id: str
    status: str
    verification_status: str
    content_markdown: str
    citations: list[dict[str, Any]]
    notes: list[str] = Field(default_factory=list)


# ---------------------------------------------------------------------- agents
class ChatTurn(BaseModel):
    role: Literal["user", "assistant"] = "user"
    content: str = Field(max_length=4000)


class InquisitorChatRequest(BaseModel):
    # Optional — omit both for free-topic Socratic dialogue on ANY subject
    # the learner wants to explore, even outside their curriculum.
    curriculum_id: str = Field(default="", max_length=64)
    module_id: str = Field(default="", max_length=64)
    # Explicit conversation id (uuid from the client). Guarantees a "New
    # chat" never merges into the previous history entry.
    session_id: str = Field(default="", max_length=64)
    message: str = Field(max_length=2000)
    # Prior conversation turns so The Inquisitor keeps its memory (US-010).
    history: list[ChatTurn] = Field(default_factory=list, max_length=50)


class InquisitorChatResponse(BaseModel):
    reply: str
    mastery: int
    hint: str


class ForgeReviewRequest(BaseModel):
    # "auto" lets The Forge detect the submission kind itself and tailor the
    # critique to whatever the learner is currently studying (see context).
    submission_type: Literal["auto", "code", "essay", "design"] = "auto"
    # No artificial minimum: even a short greeting should get a helpful
    # response instead of an opaque 422.
    content: str = Field(min_length=1, max_length=20000)
    context: str = Field(default="", max_length=200)  # e.g. active module title


class CatalystSparkRequest(BaseModel):
    concept: str = Field(max_length=200)
    context: str = Field(default="", max_length=200)


# ------------------------------------------------------------------- documents
class DocumentUploadResponse(BaseModel):
    document_id: str
    filename: str
    chunks_indexed: int
    namespace: str


# ------------------------------------------------------------------ newsletter
class NewsletterSubscribeRequest(BaseModel):
    email: EmailStr
    source: str = "footer"


# ------------------------------------------------------------------- analytics
class VelocityPoint(BaseModel):
    label: str
    hours: float


class MasteryPoint(BaseModel):
    concept: str
    score: float  # 1-5 average from The Inquisitor


class ProgressResponse(BaseModel):
    streak_days: int
    overall_completion: float
    modules_completed: int
    modules_total: int
    hours_studied: float
    citation_clicks: int
    velocity: list[VelocityPoint] = Field(default_factory=list)
    mastery: list[MasteryPoint] = Field(default_factory=list)
