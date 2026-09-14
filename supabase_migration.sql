-- Supabase SQL Migration for PERSPECTA Framing Platform & PRISM Observability

-- 1. Articles Table
create table if not exists articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  publisher text,
  url text,
  raw_text text not null,
  created_at timestamp with time zone default now()
);

-- 2. PRISM Signals Table
create table if not exists prism_signals (
  id uuid primary key default gen_random_uuid(),
  article_id uuid references articles(id) on delete cascade,
  category text not null,
  quoted_text text not null,
  explanation text not null,
  confidence float not null,
  is_verified boolean default true,
  created_at timestamp with time zone default now()
);

-- 3. Evaluation Traces Table
create table if not exists evaluation_traces (
  id uuid primary key default gen_random_uuid(),
  article_id uuid references articles(id) on delete cascade,
  model text not null,
  latency_ms integer,
  signal_count integer,
  status text default 'completed',
  created_at timestamp with time zone default now()
);

-- Indices for rapid querying and PRISM evaluation audits
create index if not exists idx_prism_signals_article_id on prism_signals(article_id);
create index if not exists idx_prism_signals_category on prism_signals(category);
create index if not exists idx_evaluation_traces_article_id on evaluation_traces(article_id);
create index if not exists idx_articles_created_at on articles(created_at desc);
