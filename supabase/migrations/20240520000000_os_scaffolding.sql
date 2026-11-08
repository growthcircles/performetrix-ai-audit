-- 1. Programmes (The containers: FutureReady, Counterpoint, etc.)
create table public.programmes (
    id uuid default gen_random_uuid() primary key,
    customer_id uuid references public.customers(id) on delete cascade,
    name text not null,
    description text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Delegates (We link to your existing 'leaders' table to avoid duplication)
-- We are just adding a link table to enroll them in programmes.
create table public.enrollments (
    id uuid default gen_random_uuid() primary key,
    programme_id uuid references public.programmes(id) on delete cascade,
    leader_id uuid references public.leaders(id) on delete cascade, -- Links to your existing leaders
    enrolled_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(programme_id, leader_id)
);

-- 3. Modules (The definitions of the tools you offer)
create table public.modules (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    description text,
    module_type text not null, -- e.g., 'SELF_DIAGNOSTIC', '360_FEEDBACK', 'MICROLEARNING'
    launch_url text, -- The live link to the app
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Assignments (Giving a specific Module to a specific Delegates Enrollment)
create table public.assignments (
    id uuid default gen_random_uuid() primary key,
    enrollment_id uuid references public.enrollments(id) on delete cascade,
    module_id uuid references public.modules(id) on delete cascade,
    status text default 'PENDING', -- PENDING, IN_PROGRESS, COMPLETED
    assigned_at timestamp with time zone default timezone('utc'::text, now()) not null,
    completed_at timestamp with time zone
);

-- RLS Policies (Keep it simple for now, you can lock it down later)
alter table public.programmes enable row level security;
alter table public.enrollments enable row level security;
alter table public.modules enable row level security;
alter table public.assignments enable row level security;

create policy "Allow authenticated read" on public.programmes for select using (auth.role() = 'authenticated');
create policy "Allow authenticated insert" on public.programmes for insert with check (auth.role() = 'authenticated');

create policy "Allow authenticated read" on public.enrollments for select using (auth.role() = 'authenticated');
create policy "Allow authenticated insert" on public.enrollments for insert with check (auth.role() = 'authenticated');

create policy "Allow authenticated read" on public.modules for select using (auth.role() = 'authenticated');
create policy "Allow authenticated insert" on public.modules for insert with check (auth.role() = 'authenticated');

create policy "Allow authenticated read" on public.assignments for select using (auth.role() = 'authenticated');
create policy "Allow authenticated insert" on public.assignments for insert with check (auth.role() = 'authenticated');

-- Optional: Insert some starter Modules so the Toolbox isn't empty
insert into public.modules (name, description, module_type) values 
('FutureReady Diagnostic', 'The 4-pillar readiness self-assessment.', 'SELF_DIAGNOSTIC'),
('360 Feedback Assessment', 'Multi-rater feedback from peers and managers.', '360_FEEDBACK');