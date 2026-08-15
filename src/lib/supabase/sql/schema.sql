-- ==============================================================================
-- AI CAREER GUIDE: SUPABASE POSTGRESQL PRODUCTION SCHEMA & RLS POLICIES
-- ==============================================================================

-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. User Profiles Table (Mirrors auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  plan text default 'free' check (plan in ('free', 'pro', 'master', 'agency')),
  stripe_customer_id text,
  stripe_subscription_id text,
  usage jsonb default '{"atsChecks": 0, "resumesCreated": 0, "coverLettersCreated": 0}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Profiles
alter table public.profiles enable row level security;

create policy "Users can view their own profile."
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile."
  on public.profiles for update
  using (auth.uid() = id);

-- Trigger to auto-create profile on auth.users insert
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, plan)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    coalesce(new.raw_user_meta_data->>'plan', 'free')
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Resumes Table
create table if not exists public.resumes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null default 'My Professional CV',
  template_id text default 'modern',
  content jsonb not null default '{}'::jsonb,
  plain_text text,
  ats_score integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.resumes enable row level security;

create policy "Users can manage their own resumes."
  on public.resumes for all
  using (auth.uid() = user_id);

-- 4. Job Applications (Pipeline Tracker)
create table if not exists public.job_applications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  company text not null,
  role text not null,
  location text,
  source text default 'manual',
  source_url text,
  status text not null default 'saved' check (status in ('saved', 'applied', 'interviewing', 'offered', 'rejected', 'archived')),
  job_description text,
  listing_fingerprint text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.job_applications enable row level security;

create policy "Users can manage their own job applications."
  on public.job_applications for all
  using (auth.uid() = user_id);

-- 5. Cover Letters Table
create table if not exists public.cover_letters (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  resume_id uuid references public.resumes on delete set null,
  resume_name text,
  company text not null,
  role text not null,
  hiring_manager text,
  tone text default 'professional',
  length text default 'standard',
  content text not null,
  email_version text,
  subject_line text,
  key_themes jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.cover_letters enable row level security;

create policy "Users can manage their own cover letters."
  on public.cover_letters for all
  using (auth.uid() = user_id);

-- 6. ATS Reports Table
create table if not exists public.ats_reports (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  resume_id uuid references public.resumes on delete set null,
  resume_name text,
  job_description text,
  cv_content text,
  ats_score integer not null,
  keyword_coverage numeric,
  missing_keywords jsonb default '[]'::jsonb,
  quick_wins jsonb default '[]'::jsonb,
  recommendations jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.ats_reports enable row level security;

create policy "Users can manage their own ATS reports."
  on public.ats_reports for all
  using (auth.uid() = user_id);

-- 7. Storage Bucket Creation (For CV Uploads & PDFs)
insert into storage.buckets (id, name, public)
values ('cv_uploads', 'cv_uploads', true)
on conflict (id) do nothing;

create policy "Public Access to CV Uploads"
  on storage.objects for select
  using (bucket_id = 'cv_uploads');

create policy "Users can upload their own files"
  on storage.objects for insert
  with check (bucket_id = 'cv_uploads' and auth.uid()::text = (storage.foldername(name))[1]);
