-- SOS Vidas — gestão segura dos documentos de transparência.
-- Execute este arquivo uma única vez no SQL Editor do Supabase.

create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.transparency_sections (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 140),
  highlight text not null default '' check (char_length(highlight) <= 60),
  description text not null default '' check (char_length(description) <= 1200),
  position integer not null default 10 check (position >= 0),
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transparency_sections_highlight_in_title
    check (highlight = '' or strpos(title, highlight) > 0)
);

create table if not exists public.transparency_documents (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.transparency_sections(id) on delete restrict,
  title text not null check (char_length(btrim(title)) between 1 and 180),
  description text not null check (char_length(btrim(description)) between 1 and 800),
  badge text not null default '' check (char_length(badge) <= 80),
  storage_path text not null unique check (
    storage_path !~ '(\\.\\.|\\\\|[?#])' and lower(storage_path) like '%.pdf'
  ),
  original_name text not null check (char_length(btrim(original_name)) between 1 and 255),
  file_size integer not null check (file_size > 0 and file_size <= 26214400),
  mime_type text not null default 'application/pdf' check (mime_type = 'application/pdf'),
  position integer not null default 10 check (position >= 0),
  published boolean not null default true,
  archived_at timestamptz,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists transparency_sections_public_order_idx
  on public.transparency_sections (published, position, title);
create index if not exists transparency_documents_public_order_idx
  on public.transparency_documents (section_id, published, archived_at, position, title);

create table if not exists public.transparency_audit_log (
  id bigint generated always as identity primary key,
  table_name text not null check (table_name in ('transparency_sections', 'transparency_documents')),
  record_id uuid not null,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  old_data jsonb,
  new_data jsonb,
  actor_id uuid references auth.users(id) on delete set null,
  occurred_at timestamptz not null default now()
);

create index if not exists transparency_audit_record_idx
  on public.transparency_audit_log (table_name, record_id, occurred_at desc);

create or replace function public.is_transparency_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_transparency_admin() from public;
grant execute on function public.is_transparency_admin() to anon, authenticated;

create or replace function public.set_transparency_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  if tg_table_name = 'transparency_documents' then
    new.updated_by := auth.uid();
  end if;
  return new;
end;
$$;

create or replace function public.audit_transparency_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_id uuid;
begin
  target_id := case when tg_op = 'DELETE' then old.id else new.id end;
  insert into public.transparency_audit_log (
    table_name,
    record_id,
    action,
    old_data,
    new_data,
    actor_id
  ) values (
    tg_table_name,
    target_id,
    tg_op,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end,
    auth.uid()
  );
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists set_transparency_sections_updated_at on public.transparency_sections;
create trigger set_transparency_sections_updated_at
before update on public.transparency_sections
for each row execute function public.set_transparency_updated_at();

drop trigger if exists set_transparency_documents_updated_at on public.transparency_documents;
create trigger set_transparency_documents_updated_at
before update on public.transparency_documents
for each row execute function public.set_transparency_updated_at();

drop trigger if exists audit_transparency_sections on public.transparency_sections;
create trigger audit_transparency_sections
after insert or update or delete on public.transparency_sections
for each row execute function public.audit_transparency_change();

drop trigger if exists audit_transparency_documents on public.transparency_documents;
create trigger audit_transparency_documents
after insert or update or delete on public.transparency_documents
for each row execute function public.audit_transparency_change();

alter table public.admin_users enable row level security;
alter table public.transparency_sections enable row level security;
alter table public.transparency_documents enable row level security;
alter table public.transparency_audit_log enable row level security;

revoke all on public.admin_users from anon, authenticated;
revoke all on public.transparency_sections from anon, authenticated;
revoke all on public.transparency_documents from anon, authenticated;
revoke all on public.transparency_audit_log from anon, authenticated;

grant select on public.admin_users to authenticated;
grant select on public.transparency_sections to anon, authenticated;
grant insert, update on public.transparency_sections to authenticated;
grant select on public.transparency_documents to anon, authenticated;
grant insert, update on public.transparency_documents to authenticated;
grant select on public.transparency_audit_log to authenticated;
grant usage, select on sequence public.transparency_audit_log_id_seq to authenticated;

drop policy if exists "Administrator can verify own access" on public.admin_users;
create policy "Administrator can verify own access"
on public.admin_users for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Public can read published sections" on public.transparency_sections;
create policy "Public can read published sections"
on public.transparency_sections for select to anon, authenticated
using (published or public.is_transparency_admin());

drop policy if exists "Administrators can insert sections" on public.transparency_sections;
create policy "Administrators can insert sections"
on public.transparency_sections for insert to authenticated
with check (public.is_transparency_admin());

drop policy if exists "Administrators can update sections" on public.transparency_sections;
create policy "Administrators can update sections"
on public.transparency_sections for update to authenticated
using (public.is_transparency_admin())
with check (public.is_transparency_admin());

drop policy if exists "Public can read published documents" on public.transparency_documents;
create policy "Public can read published documents"
on public.transparency_documents for select to anon, authenticated
using (
  public.is_transparency_admin()
  or (
    published
    and archived_at is null
    and exists (
      select 1
      from public.transparency_sections section_row
      where section_row.id = transparency_documents.section_id
        and section_row.published
    )
  )
);

drop policy if exists "Administrators can insert documents" on public.transparency_documents;
create policy "Administrators can insert documents"
on public.transparency_documents for insert to authenticated
with check (public.is_transparency_admin());

drop policy if exists "Administrators can update documents" on public.transparency_documents;
create policy "Administrators can update documents"
on public.transparency_documents for update to authenticated
using (public.is_transparency_admin())
with check (public.is_transparency_admin());

drop policy if exists "Administrators can read audit log" on public.transparency_audit_log;
create policy "Administrators can read audit log"
on public.transparency_audit_log for select to authenticated
using (public.is_transparency_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('transparencia', 'transparencia', true, 26214400, array['application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Administrators can inspect transparency files" on storage.objects;
create policy "Administrators can inspect transparency files"
on storage.objects for select to authenticated
using (bucket_id = 'transparencia' and public.is_transparency_admin());

drop policy if exists "Administrators can upload transparency PDFs" on storage.objects;
create policy "Administrators can upload transparency PDFs"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'transparencia'
  and public.is_transparency_admin()
  and lower(storage.extension(name)) = 'pdf'
);

drop policy if exists "Administrators can update transparency PDFs" on storage.objects;
create policy "Administrators can update transparency PDFs"
on storage.objects for update to authenticated
using (bucket_id = 'transparencia' and public.is_transparency_admin())
with check (
  bucket_id = 'transparencia'
  and public.is_transparency_admin()
  and lower(storage.extension(name)) = 'pdf'
);

drop policy if exists "Administrators can remove transparency PDFs" on storage.objects;
create policy "Administrators can remove transparency PDFs"
on storage.objects for delete to authenticated
using (bucket_id = 'transparencia' and public.is_transparency_admin());
