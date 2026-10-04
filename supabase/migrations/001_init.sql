-- Records: run once in the Supabase SQL editor.
-- Creates the tables, row-level security, private storage bucket, and signup seed.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_check check (char_length(btrim(display_name)) between 1 and 80)
);

create table public.entities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  entity_type text not null,
  pan text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint entities_type_check check (entity_type in ('individual', 'company')),
  constraint entities_name_check check (char_length(btrim(name)) between 1 and 120),
  constraint entities_pan_check check (pan is null or pan ~ '^[A-Z]{5}[0-9]{4}[A-Z]$'),
  constraint entities_description_check check (description is null or char_length(description) <= 500)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_name_check check (char_length(btrim(name)) between 1 and 80),
  constraint categories_description_check check (description is null or char_length(description) <= 500)
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  constraint tags_name_check check (char_length(btrim(name)) between 1 and 40)
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  entity_id uuid not null references public.entities (id) on delete restrict,
  category_id uuid not null references public.categories (id) on delete restrict,
  document_name text not null,
  storage_path text not null,
  original_filename text not null,
  mime_type text not null,
  file_extension text not null,
  file_size bigint not null,
  financial_year_start smallint not null,
  document_date date,
  purpose text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint documents_name_check check (char_length(btrim(document_name)) between 1 and 200),
  constraint documents_purpose_check check (purpose is null or char_length(purpose) <= 500),
  constraint documents_notes_check check (notes is null or char_length(notes) <= 5000),
  constraint documents_year_check check (financial_year_start between 1990 and 2100),
  constraint documents_size_check check (file_size > 0 and file_size <= 20971520),
  constraint documents_extension_check check (
    file_extension in ('pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xls', 'xlsx')
  ),
  constraint documents_mime_check check (
    mime_type in (
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
  ),
  constraint documents_path_check check (
    storage_path like user_id::text || '/%'
    and storage_path !~ '\.\.'
  )
);

create table public.document_tags (
  document_id uuid not null references public.documents (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (document_id, tag_id)
);

create unique index categories_user_name_idx on public.categories (user_id, lower(name));
create unique index tags_user_name_idx on public.tags (user_id, lower(name));
create index entities_user_idx on public.entities (user_id, name);
create index categories_user_idx on public.categories (user_id, sort_order);
create index tags_user_idx on public.tags (user_id, name);
create index documents_user_created_idx on public.documents (user_id, created_at desc);
create index documents_user_year_idx on public.documents (user_id, financial_year_start);
create index documents_user_entity_idx on public.documents (user_id, entity_id);
create index documents_user_category_idx on public.documents (user_id, category_id);
create index documents_user_date_idx on public.documents (user_id, document_date);
create index document_tags_tag_id_idx on public.document_tags (tag_id);

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger entities_set_updated_at
  before update on public.entities
  for each row execute function public.set_updated_at();

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

create trigger documents_set_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- New account: profile + starter categories
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
      split_part(new.email, '@', 1)
    )
  );

  insert into public.categories (user_id, name, sort_order) values
    (new.id, 'Income Tax Return', 10),
    (new.id, 'Tax Computation', 20),
    (new.id, 'TDS', 30),
    (new.id, 'Form 16', 40),
    (new.id, 'AIS / TIS', 50),
    (new.id, 'Bank Statement', 60),
    (new.id, 'Investment', 70),
    (new.id, 'Property', 80),
    (new.id, 'Capital Gains', 90),
    (new.id, 'Business Expense', 100),
    (new.id, 'Invoice', 110),
    (new.id, 'Tax Payment', 120),
    (new.id, 'GST', 130),
    (new.id, 'Government Notice', 140),
    (new.id, 'CA / Professional', 150),
    (new.id, 'Other', 160);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

revoke all on function public.handle_new_user() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Search
-- p_pattern is an ILIKE pattern built in the app, with % and _ escaped.
-- ---------------------------------------------------------------------------

create or replace function public.search_documents(
  p_pattern text default null,
  p_financial_year_start smallint default null,
  p_entity_type text default null,
  p_entity_id uuid default null,
  p_category_id uuid default null,
  p_date_from date default null,
  p_date_to date default null,
  p_tag_ids uuid[] default null
)
returns table (
  id uuid,
  document_name text,
  storage_path text,
  original_filename text,
  mime_type text,
  file_extension text,
  file_size bigint,
  financial_year_start smallint,
  document_date date,
  purpose text,
  notes text,
  created_at timestamptz,
  updated_at timestamptz,
  entity_id uuid,
  entity_name text,
  entity_type text,
  category_id uuid,
  category_name text,
  tags jsonb
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    d.id,
    d.document_name,
    d.storage_path,
    d.original_filename,
    d.mime_type,
    d.file_extension,
    d.file_size,
    d.financial_year_start,
    d.document_date,
    d.purpose,
    d.notes,
    d.created_at,
    d.updated_at,
    e.id,
    e.name,
    e.entity_type,
    c.id,
    c.name,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object('id', t.id, 'name', t.name)
          order by t.name
        )
        from public.document_tags dt
        join public.tags t on t.id = dt.tag_id
        where dt.document_id = d.id
      ),
      '[]'::jsonb
    )
  from public.documents d
  join public.entities e on e.id = d.entity_id
  join public.categories c on c.id = d.category_id
  where d.user_id = (select auth.uid())
    and (p_financial_year_start is null or d.financial_year_start = p_financial_year_start)
    and (p_entity_type is null or e.entity_type = p_entity_type)
    and (p_entity_id is null or d.entity_id = p_entity_id)
    and (p_category_id is null or d.category_id = p_category_id)
    and (p_date_from is null or d.document_date >= p_date_from)
    and (p_date_to is null or d.document_date <= p_date_to)
    and (
      p_tag_ids is null
      or cardinality(p_tag_ids) = 0
      or exists (
        select 1
        from public.document_tags dt
        where dt.document_id = d.id
          and dt.tag_id = any (p_tag_ids)
      )
    )
    and (
      p_pattern is null
      or d.document_name ilike p_pattern escape E'\\'
      or coalesce(d.purpose, '') ilike p_pattern escape E'\\'
      or coalesce(d.notes, '') ilike p_pattern escape E'\\'
      or e.name ilike p_pattern escape E'\\'
      or c.name ilike p_pattern escape E'\\'
      or (
        'FY ' || d.financial_year_start::text || '-' ||
        right((d.financial_year_start + 1)::text, 2)
      ) ilike p_pattern escape E'\\'
      or exists (
        select 1
        from public.document_tags dt
        join public.tags t on t.id = dt.tag_id
        where dt.document_id = d.id
          and t.name ilike p_pattern escape E'\\'
      )
    )
  order by d.created_at desc;
$$;

revoke all on function public.search_documents(text, smallint, text, uuid, uuid, date, date, uuid[]) from public, anon;
grant execute on function public.search_documents(text, smallint, text, uuid, uuid, date, date, uuid[]) to authenticated;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.entities enable row level security;
alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.documents enable row level security;
alter table public.document_tags enable row level security;

create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy profiles_insert_own on public.profiles
  for insert to authenticated
  with check (id = (select auth.uid()));

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy entities_own on public.entities
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy categories_own on public.categories
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy tags_own on public.tags
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy documents_own on public.documents
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy document_tags_own on public.document_tags
  for all to authenticated
  using (
    exists (
      select 1 from public.documents d
      where d.id = document_id
        and d.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.documents d
      where d.id = document_id
        and d.user_id = (select auth.uid())
    )
    and exists (
      select 1 from public.tags t
      where t.id = tag_id
        and t.user_id = (select auth.uid())
    )
  );

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.entities to authenticated;
grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update, delete on public.tags to authenticated;
grant select, insert, update, delete on public.documents to authenticated;
grant select, insert, update, delete on public.document_tags to authenticated;

-- ---------------------------------------------------------------------------
-- Private storage. Files are only reachable with a short-lived signed URL.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  20971520,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy documents_storage_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy documents_storage_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy documents_storage_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy documents_storage_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

notify pgrst, 'reload schema';
