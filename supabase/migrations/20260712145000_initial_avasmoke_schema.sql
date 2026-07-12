-- AvaSmoke.Ai initial schema. Apply through the Supabase migration workflow.
create extension if not exists pgcrypto;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create type public.profile_role as enum ('platform_admin', 'shop_owner', 'shop_manager');
create type public.profile_status as enum ('active', 'pending', 'suspended');
create type public.shop_status as enum ('pending', 'active', 'suspended', 'rejected');
create type public.application_status as enum ('new', 'reviewing', 'approved', 'rejected');
create type public.verification_status as enum ('unverified', 'admin_verified');
create type public.stock_status as enum ('in_stock', 'low_stock', 'out_of_stock', 'hidden');
create type public.qr_type as enum ('store', 'counter', 'display', 'product', 'promotional');
create type public.conversation_role as enum ('customer', 'assistant', 'system');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role public.profile_role not null default 'shop_owner',
  status public.profile_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.shops (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  email text,
  phone text,
  address_line_1 text not null,
  address_line_2 text,
  city text not null,
  state text not null,
  postal_code text not null,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  allowed_radius_miles numeric(6,2) not null default 1 check (allowed_radius_miles > 0 and allowed_radius_miles <= 50),
  business_hours jsonb not null default '{}'::jsonb,
  status public.shop_status not null default 'pending',
  owner_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.shop_staff (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role public.profile_role not null check (role in ('shop_owner', 'shop_manager')),
  created_at timestamptz not null default now(),
  unique (shop_id, profile_id)
);

create table public.shop_applications (
  id uuid primary key default gen_random_uuid(),
  business_name text not null check (char_length(business_name) between 2 and 160),
  applicant_name text not null check (char_length(applicant_name) between 2 and 160),
  email text not null check (char_length(email) <= 254),
  phone text not null check (char_length(phone) between 7 and 30),
  address text not null check (char_length(address) between 8 and 300),
  number_of_locations integer not null default 1 check (number_of_locations between 1 and 1000),
  website_or_social text,
  message text check (char_length(message) <= 2000),
  status public.application_status not null default 'new',
  admin_notes text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  normalized_name text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.brands(id) on delete set null,
  product_name text not null,
  flavor_name text,
  normalized_search_text text not null,
  category text not null,
  nicotine_percentage numeric(6,3) check (nicotine_percentage is null or nicotine_percentage between 0 and 100),
  nicotine_mg numeric(8,2) check (nicotine_mg is null or nicotine_mg >= 0),
  puff_count integer check (puff_count is null or puff_count > 0),
  flavor_family text,
  sweetness_level smallint check (sweetness_level is null or sweetness_level between 1 and 10),
  cooling_level smallint check (cooling_level is null or cooling_level between 1 and 10),
  hit_strength smallint check (hit_strength is null or hit_strength between 1 and 10),
  expected_duration_text text,
  battery_details text,
  rechargeable boolean not null default false,
  device_type text,
  description text,
  primary_image_url text,
  additional_images jsonb not null default '[]'::jsonb check (jsonb_typeof(additional_images) = 'array'),
  ai_extracted_data jsonb not null default '{}'::jsonb,
  verification_status public.verification_status not null default 'unverified',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.shop_inventory (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  internal_sku text,
  price numeric(10,2) check (price is null or price >= 0),
  sale_price numeric(10,2) check (sale_price is null or sale_price >= 0),
  stock_status public.stock_status not null default 'in_stock',
  quantity integer check (quantity is null or quantity >= 0),
  featured boolean not null default false,
  staff_pick boolean not null default false,
  recommendation_priority smallint not null default 0 check (recommendation_priority between -10 and 10),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop_id, product_id),
  check (sale_price is null or price is null or sale_price <= price)
);

create table public.qr_codes (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  code text not null unique default encode(gen_random_bytes(24), 'hex') check (char_length(code) >= 16),
  label text not null,
  destination_path text not null,
  qr_type public.qr_type not null default 'store',
  product_id uuid references public.products(id) on delete set null,
  active boolean not null default true,
  scan_radius_override numeric(6,2) check (scan_radius_override is null or scan_radius_override > 0),
  total_scans bigint not null default 0 check (total_scans >= 0),
  last_scanned_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((qr_type = 'product' and product_id is not null) or qr_type <> 'product')
);

create table public.customer_sessions (
  id uuid primary key default gen_random_uuid(),
  anonymous_session_id uuid not null,
  shop_id uuid not null references public.shops(id) on delete cascade,
  qr_code_id uuid not null references public.qr_codes(id) on delete cascade,
  age_confirmed boolean not null default false,
  location_permission_status text not null default 'prompt' check (location_permission_status in ('prompt', 'granted', 'denied', 'unavailable')),
  location_verified boolean not null default false,
  distance_from_store_miles numeric(8,2) check (distance_from_store_miles is null or distance_from_store_miles >= 0),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  device_type text,
  referrer text,
  created_at timestamptz not null default now()
);

create table public.customer_preferences (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.customer_sessions(id) on delete cascade,
  current_product_text text,
  current_product_image_url text,
  coming_from text check (coming_from is null or coming_from in ('cigarettes', 'hookah', 'vape', 'nicotine_pouches', 'none', 'prefer_not_to_say')),
  preferred_flavor_families jsonb not null default '[]'::jsonb,
  cooling_preference smallint check (cooling_preference is null or cooling_preference between 1 and 10),
  sweetness_preference smallint check (sweetness_preference is null or sweetness_preference between 1 and 10),
  strength_preference smallint check (strength_preference is null or strength_preference between 1 and 10),
  budget_min numeric(10,2) check (budget_min is null or budget_min >= 0),
  budget_max numeric(10,2) check (budget_max is null or budget_max >= 0),
  desired_puff_count integer check (desired_puff_count is null or desired_puff_count > 0),
  notes text,
  created_at timestamptz not null default now(),
  check (budget_min is null or budget_max is null or budget_min <= budget_max)
);

create table public.recommendations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.customer_sessions(id) on delete cascade,
  shop_id uuid not null references public.shops(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  rank smallint not null check (rank between 1 and 20),
  score numeric(8,2) not null,
  reason text not null,
  customer_clicked boolean not null default false,
  customer_liked boolean,
  requested_employee_help boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.customer_sessions(id) on delete cascade,
  shop_id uuid not null references public.shops(id) on delete cascade,
  role public.conversation_role not null,
  message text not null check (char_length(message) between 1 and 4000),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.product_requests (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.customer_sessions(id) on delete cascade,
  shop_id uuid not null references public.shops(id) on delete cascade,
  requested_brand text,
  requested_product text,
  requested_flavor text,
  request_details text,
  matching_product_found boolean not null default false,
  source text not null default 'text' check (source in ('text', 'photo', 'match_flow', 'browse')),
  created_at timestamptz not null default now()
);

create table public.product_upload_jobs (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references public.shops(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id) on delete restrict,
  image_urls jsonb not null default '[]'::jsonb,
  extraction_status text not null default 'queued' check (extraction_status in ('queued', 'processing', 'review_required', 'confirmed', 'failed')),
  extracted_data jsonb not null default '[]'::jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.customer_feedback (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.customer_sessions(id) on delete cascade,
  shop_id uuid not null references public.shops(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  helpful boolean not null,
  tags jsonb not null default '[]'::jsonb,
  comment text check (char_length(comment) <= 1000),
  created_at timestamptz not null default now()
);

create table public.analytics_events (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.customer_sessions(id) on delete cascade,
  shop_id uuid not null references public.shops(id) on delete cascade,
  qr_code_id uuid references public.qr_codes(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  event_name text not null check (event_name in (
    'scan', 'location_verified', 'location_denied', 'outside_radius', 'age_gate_exit',
    'match_started', 'match_completed', 'chat_started', 'photo_search', 'recommendation_generated',
    'product_viewed', 'compare', 'show_employee', 'feedback'
  )),
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.system_settings (
  id boolean primary key default true check (id),
  minimum_age smallint not null default 21 check (minimum_age between 18 and 25),
  default_radius_miles numeric(6,2) not null default 1,
  minimum_feedback_threshold smallint not null default 10 check (minimum_feedback_threshold >= 5),
  retain_customer_data_days integer not null default 365 check (retain_customer_data_days between 30 and 3650),
  store_precise_coordinates boolean not null default false check (store_precise_coordinates = false),
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);
insert into public.system_settings (id) values (true);

alter table public.qr_codes
  add constraint qr_codes_id_shop_unique unique (id, shop_id);
alter table public.customer_sessions
  add constraint customer_sessions_id_shop_unique unique (id, shop_id),
  add constraint customer_sessions_qr_shop_fk
    foreign key (qr_code_id, shop_id)
    references public.qr_codes(id, shop_id);
alter table public.recommendations
  add constraint recommendations_session_shop_fk
    foreign key (session_id, shop_id)
    references public.customer_sessions(id, shop_id);
alter table public.conversations
  add constraint conversations_session_shop_fk
    foreign key (session_id, shop_id)
    references public.customer_sessions(id, shop_id);
alter table public.product_requests
  add constraint product_requests_session_shop_fk
    foreign key (session_id, shop_id)
    references public.customer_sessions(id, shop_id);
alter table public.customer_feedback
  add constraint customer_feedback_session_shop_fk
    foreign key (session_id, shop_id)
    references public.customer_sessions(id, shop_id);
alter table public.analytics_events
  add constraint analytics_events_session_shop_fk
    foreign key (session_id, shop_id)
    references public.customer_sessions(id, shop_id);

create index shops_status_idx on public.shops(status);
create index shops_owner_idx on public.shops(owner_profile_id);
create index applications_status_created_idx on public.shop_applications(status, created_at desc);
create index products_brand_idx on public.products(brand_id);
create index products_search_idx on public.products using gin (to_tsvector('simple', normalized_search_text));
create index products_filter_idx on public.products(active, category, flavor_family);
create index inventory_shop_status_idx on public.shop_inventory(shop_id, stock_status);
create index inventory_product_idx on public.shop_inventory(product_id);
create index qr_shop_active_idx on public.qr_codes(shop_id, active);
create index sessions_shop_created_idx on public.customer_sessions(shop_id, created_at desc);
create index sessions_anonymous_idx on public.customer_sessions(anonymous_session_id, created_at desc);
create index recommendations_shop_created_idx on public.recommendations(shop_id, created_at desc);
create index recommendations_product_idx on public.recommendations(product_id);
create index conversations_session_created_idx on public.conversations(session_id, created_at);
create index requests_shop_created_idx on public.product_requests(shop_id, created_at desc);
create index feedback_product_created_idx on public.customer_feedback(product_id, created_at desc);
create index events_shop_name_created_idx on public.analytics_events(shop_id, event_name, created_at desc);

create or replace function private.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles for each row execute function private.set_updated_at();
create trigger shops_updated_at before update on public.shops for each row execute function private.set_updated_at();
create trigger brands_updated_at before update on public.brands for each row execute function private.set_updated_at();
create trigger products_updated_at before update on public.products for each row execute function private.set_updated_at();
create trigger inventory_updated_at before update on public.shop_inventory for each row execute function private.set_updated_at();
create trigger qr_updated_at before update on public.qr_codes for each row execute function private.set_updated_at();

create or replace function private.record_qr_scan()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.qr_codes
  set total_scans = total_scans + 1, last_scanned_at = now()
  where id = new.qr_code_id;
  return new;
end;
$$;

create trigger customer_session_qr_scan
after insert on public.customer_sessions
for each row execute function private.record_qr_scan();

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, role, status)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    'shop_owner',
    'pending'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

create or replace function private.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid())
      and role = 'platform_admin'
      and status = 'active'
  );
$$;

create or replace function private.can_access_shop(requested_shop_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_platform_admin() or exists (
    select 1
    from public.shops s
    left join public.shop_staff ss
      on ss.shop_id = s.id and ss.profile_id = (select auth.uid())
    join public.profiles p on p.id = (select auth.uid())
    where s.id = requested_shop_id
      and p.status = 'active'
      and (s.owner_profile_id = p.id or ss.profile_id = p.id)
  );
$$;

create or replace function private.application_allowed(requested_email text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (
    select 1 from public.shop_applications
    where lower(email) = lower(requested_email)
      and created_at > now() - interval '15 minutes'
  );
$$;

grant usage on schema private to anon, authenticated;
grant execute on function private.is_platform_admin() to authenticated;
grant execute on function private.can_access_shop(uuid) to authenticated;
grant execute on function private.application_allowed(text) to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.shops enable row level security;
alter table public.shop_staff enable row level security;
alter table public.shop_applications enable row level security;
alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.shop_inventory enable row level security;
alter table public.qr_codes enable row level security;
alter table public.customer_sessions enable row level security;
alter table public.customer_preferences enable row level security;
alter table public.recommendations enable row level security;
alter table public.conversations enable row level security;
alter table public.product_requests enable row level security;
alter table public.product_upload_jobs enable row level security;
alter table public.customer_feedback enable row level security;
alter table public.analytics_events enable row level security;
alter table public.system_settings enable row level security;

create policy "profiles read self" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "profiles admin all" on public.profiles for all to authenticated using ((select private.is_platform_admin())) with check ((select private.is_platform_admin()));

create policy "shops assigned read" on public.shops for select to authenticated using ((select private.can_access_shop(id)));
create policy "shops admin write" on public.shops for all to authenticated using ((select private.is_platform_admin())) with check ((select private.is_platform_admin()));

create policy "staff assigned read" on public.shop_staff for select to authenticated using ((select private.can_access_shop(shop_id)));
create policy "staff admin write" on public.shop_staff for all to authenticated using ((select private.is_platform_admin())) with check ((select private.is_platform_admin()));

create policy "applications public insert rate limited" on public.shop_applications
for insert to anon, authenticated
with check (
  status = 'new' and admin_notes is null and reviewed_by is null and reviewed_at is null
  and created_at between now() - interval '1 minute' and now() + interval '1 minute'
  and (select private.application_allowed(email))
);
create policy "applications admin all" on public.shop_applications for all to authenticated using ((select private.is_platform_admin())) with check ((select private.is_platform_admin()));

create policy "brands assigned read" on public.brands for select to authenticated using (
  (select private.is_platform_admin()) or exists (
    select 1 from public.products p
    join public.shop_inventory si on si.product_id = p.id
    where p.brand_id = brands.id and (select private.can_access_shop(si.shop_id))
  )
);
create policy "brands admin write" on public.brands for all to authenticated using ((select private.is_platform_admin())) with check ((select private.is_platform_admin()));

create policy "products assigned read" on public.products for select to authenticated using (
  (select private.is_platform_admin()) or exists (
    select 1 from public.shop_inventory si
    where si.product_id = products.id and (select private.can_access_shop(si.shop_id))
  )
);
create policy "products admin write" on public.products for all to authenticated using ((select private.is_platform_admin())) with check ((select private.is_platform_admin()));

create policy "inventory assigned all" on public.shop_inventory for all to authenticated
using ((select private.can_access_shop(shop_id)))
with check ((select private.can_access_shop(shop_id)));

create policy "qr assigned all" on public.qr_codes for all to authenticated
using ((select private.can_access_shop(shop_id)))
with check ((select private.can_access_shop(shop_id)));

create policy "sessions assigned read" on public.customer_sessions for select to authenticated using ((select private.can_access_shop(shop_id)));
create policy "preferences assigned read" on public.customer_preferences for select to authenticated using (
  exists (select 1 from public.customer_sessions s where s.id = customer_preferences.session_id and (select private.can_access_shop(s.shop_id)))
);
create policy "recommendations assigned read" on public.recommendations for select to authenticated using ((select private.can_access_shop(shop_id)));
create policy "conversations assigned read" on public.conversations for select to authenticated using ((select private.can_access_shop(shop_id)));
create policy "requests assigned read" on public.product_requests for select to authenticated using ((select private.can_access_shop(shop_id)));
create policy "upload jobs assigned all" on public.product_upload_jobs for all to authenticated
using ((select private.is_platform_admin()) or (shop_id is not null and (select private.can_access_shop(shop_id))))
with check ((select private.is_platform_admin()) or (shop_id is not null and (select private.can_access_shop(shop_id))));
create policy "feedback assigned read" on public.customer_feedback for select to authenticated using ((select private.can_access_shop(shop_id)));
create policy "events assigned read" on public.analytics_events for select to authenticated using ((select private.can_access_shop(shop_id)));
create policy "settings admin all" on public.system_settings for all to authenticated using ((select private.is_platform_admin())) with check ((select private.is_platform_admin()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-uploads', 'product-uploads', false, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('customer-searches', 'customer-searches', false, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "admins manage product uploads"
on storage.objects for all to authenticated
using (bucket_id = 'product-uploads' and (select private.is_platform_admin()))
with check (bucket_id = 'product-uploads' and (select private.is_platform_admin()));

comment on column public.customer_sessions.distance_from_store_miles is
  'Calculated distance only. Precise customer coordinates are intentionally not stored.';
comment on table public.customer_feedback is
  'Aggregated product claims must not be displayed below system_settings.minimum_feedback_threshold.';
