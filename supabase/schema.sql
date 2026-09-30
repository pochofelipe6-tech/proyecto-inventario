-- Ejecutar una sola vez en el SQL Editor de un proyecto de Supabase nuevo.
begin;
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 1 and 120),
  email text not null,
  created_at timestamptz not null default now()
);
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, full_name, email)
  values (new.id, left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)), 120), new.email);
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
insert into public.profiles (id, full_name, email, created_at)
select id, left(coalesce(nullif(trim(raw_user_meta_data ->> 'full_name'), ''), split_part(email, '@', 1)), 120), email, created_at from auth.users where email is not null;

create table public.products (
  id uuid primary key default gen_random_uuid(),
  asset_tag text not null check (char_length(trim(asset_tag)) between 1 and 40),
  brand text not null check (char_length(trim(brand)) between 1 and 80),
  model text not null check (char_length(trim(model)) between 1 and 120),
  serial_number text not null check (char_length(trim(serial_number)) between 1 and 100),
  type text not null check (type in ('Portátil', 'Escritorio', 'Todo en uno')),
  status text not null check (status in ('Disponible', 'Asignado', 'Mantenimiento', 'De baja')),
  location text not null check (char_length(trim(location)) between 1 and 120),
  assigned_to uuid references public.profiles(id) on delete restrict,
  processor text not null default '' check (char_length(processor) <= 120),
  ram_gb integer not null check (ram_gb between 1 and 2048),
  storage_gb integer not null check (storage_gb between 1 and 100000),
  notes text not null default '' check (char_length(notes) <= 2000),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'Asignado' and assigned_to is not null) or (status <> 'Asignado' and assigned_to is null))
);
create unique index products_asset_tag_unique on public.products (lower(trim(asset_tag)));
create unique index products_serial_unique on public.products (lower(trim(serial_number)));
create index products_assigned_to_idx on public.products (assigned_to);
create function public.update_product_timestamp() returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  new.created_at = old.created_at;
  new.created_by = old.created_by;
  return new;
end;
$$;
create trigger products_updated before update on public.products for each row execute function public.update_product_timestamp();
alter table public.profiles enable row level security;
alter table public.products enable row level security;
revoke all on public.profiles, public.products from anon, authenticated;
grant select on public.profiles to authenticated;
grant select, insert, update, delete on public.products to authenticated;
create policy "Usuarios autenticados consultan perfiles" on public.profiles for select to authenticated using (true);
create policy "Usuarios autenticados consultan equipos" on public.products for select to authenticated using (true);
create policy "Usuarios autenticados crean equipos" on public.products for insert to authenticated with check (created_by = (select auth.uid()));
create policy "Usuarios autenticados actualizan equipos" on public.products for update to authenticated using (true) with check (true);
create policy "Usuarios autenticados eliminan equipos" on public.products for delete to authenticated using (true);
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.update_product_timestamp() from public, anon, authenticated;
commit;
