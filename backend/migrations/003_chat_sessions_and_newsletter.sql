-- Fidya migration 003: explicit tutor chat sessions + newsletter subscribers
-- Run in Supabase SQL Editor (Dashboard → SQL).

-- 1) Explicit sessions fix the "new chat merges into old history" bug:
--    every tutor turn carries a session_id instead of relying on a
--    30-minute time-gap heuristic.
alter table chat_messages add column if not exists session_id text;
create index if not exists idx_chat_messages_user_session
    on chat_messages(user_id, session_id);

create table if not exists chat_sessions (
    session_id   text primary key,
    user_id      text not null references users(id),
    title        text default '',
    curriculum_id text,
    module_id    text,
    pinned       boolean default false,
    created_at   timestamptz default now(),
    updated_at   timestamptz default now()
);
create index if not exists idx_chat_sessions_user
    on chat_sessions(user_id, pinned, updated_at desc);

-- 2) Footer / landing newsletter subscribers (public form, no auth).
create table if not exists newsletter_subscribers (
    email      text primary key,
    source     text default 'footer',
    created_at timestamptz default now()
);

-- RLS on new tables, consistent with the rest of the schema.
alter table chat_sessions enable row level security;
alter table newsletter_subscribers enable row level security;
-- Service-role key bypasses RLS; all access flows through the FastAPI layer.
