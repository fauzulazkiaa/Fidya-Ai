-- Fidya platform schema (run in Supabase SQL editor)
-- Users are managed by the app's own JWT auth (NG-3).

create table if not exists users (
    id            text primary key,
    email         text unique not null,
    password_hash text not null,
    display_name  text default '',
    plan          text default 'free',
    created_at    timestamptz default now()
);

create table if not exists curricula (
    curriculum_id   text primary key,
    user_id         text not null references users(id),
    target_topic    text,
    current_level   text,
    target_outcome  text,
    target_deadline date,
    hours_per_week  int,
    learning_style  text,
    modules         jsonb default '[]',
    milestones      jsonb default '[]',
    created_at      timestamptz default now()
);
create index if not exists idx_curricula_user on curricula(user_id);

create table if not exists documents (
    document_id  text primary key,
    user_id      text not null references users(id),
    filename     text,
    chunks       int,
    namespace    text,
    created_at   timestamptz default now()
);

create table if not exists chat_messages (
    id            text primary key,
    user_id       text not null references users(id),
    curriculum_id text,
    module_id     text,
    session_id    text,
    role          text check (role in ('user', 'assistant')),
    agent         text,
    content       text,
    mastery       int,
    hint          text,
    created_at    timestamptz default now()
);
create index if not exists idx_chat_messages_user_session
    on chat_messages(user_id, session_id);

-- Explicit tutor sessions (pin / delete / stable grouping across days).
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

-- Footer / landing newsletter subscribers (public form, no auth).
create table if not exists newsletter_subscribers (
    email      text primary key,
    source     text default 'footer',
    created_at timestamptz default now()
);

create table if not exists analytics_events (
    id         bigserial primary key,
    user_id    text not null references users(id),
    type       text,
    meta       text,
    created_at timestamptz default now()
);

alter table users enable row level security;
alter table curricula enable row level security;
alter table documents enable row level security;
alter table chat_messages enable row level security;
alter table analytics_events enable row level security;
alter table chat_sessions enable row level security;
alter table newsletter_subscribers enable row level security;
-- Service-role key bypasses RLS; all access flows through the FastAPI layer.
