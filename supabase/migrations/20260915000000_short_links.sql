-- Short links served from subdomains like events.rflwealth.ca/<code>.
-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.

create table public.short_links (
  id bigint generated always as identity primary key,
  -- The subdomain the link lives on, e.g. "events.rflwealth.ca".
  host text not null,
  -- Lowercase letters/digits separated by single hyphens, e.g. "physicians-toronto-oct-27-2026".
  code text not null
    check (char_length(code) between 3 and 80 and code ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  destination text not null
    check (char_length(destination) <= 2048 and destination ~ '^https?://'),
  created_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  -- The same code can exist once per subdomain.
  unique (host, code)
);

-- Speeds up "does a link to this destination already exist on this host?"
create index short_links_host_destination_idx on public.short_links (host, destination);

-- True when the signed-in user's email belongs to the company domain.
create function public.is_company_user()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(lower(auth.jwt() ->> 'email'), '') like '%@rflwealth.ca';
$$;

alter table public.short_links enable row level security;

create policy "Company users can read short links"
  on public.short_links for select
  to authenticated
  using ((select public.is_company_user()));

create policy "Company users can create short links"
  on public.short_links for insert
  to authenticated
  with check ((select public.is_company_user()) and created_by = (select auth.uid()));

-- No update/delete policies yet: printed codes shouldn't change by accident.

grant select, insert on public.short_links to authenticated;

-- Lets the redirect proxy look up exactly one link without being able to list the table.
create function public.resolve_short_link(p_host text, p_code text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select destination
  from public.short_links
  where host = lower(p_host) and code = lower(p_code);
$$;

revoke execute on function public.resolve_short_link(text, text) from public;
grant execute on function public.resolve_short_link(text, text) to anon, authenticated;
