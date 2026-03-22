-- ============================================
-- FlowDo: Clean Public Schema Restore Script
-- Only public tables, functions, triggers, 
-- indexes, RLS policies, and storage bucket
-- ============================================

-- 1. FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION public.cleanup_old_habit_data() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  DELETE FROM habit_logs 
  WHERE log_date < date_trunc('month', CURRENT_DATE);
  
  DELETE FROM habit_monthly_journals 
  WHERE month_year < to_char(CURRENT_DATE, 'YYYY-MM');
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    );
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;


-- 2. TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL,
    email text NOT NULL,
    full_name text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    quadrant text,
    completed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    priority text DEFAULT 'medium'::text,
    due_date text,
    tags jsonb DEFAULT '[]'::jsonb,
    estimated_time text,
    status text DEFAULT 'todo'::text,
    notes text,
    CONSTRAINT tasks_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))),
    CONSTRAINT tasks_quadrant_check CHECK ((quadrant = ANY (ARRAY['urgent-important'::text, 'important'::text, 'urgent'::text, 'neither'::text]))),
    CONSTRAINT tasks_status_check CHECK ((status = ANY (ARRAY['todo'::text, 'in_progress'::text, 'blocked'::text, 'completed'::text])))
);

CREATE TABLE IF NOT EXISTS public.achievements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    image_url text,
    achievement_date date DEFAULT CURRENT_DATE,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.calendar_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    color text DEFAULT 'blue'::text,
    location text,
    attendees jsonb DEFAULT '[]'::jsonb,
    all_day boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT calendar_events_color_check CHECK ((color = ANY (ARRAY['blue'::text, 'green'::text, 'purple'::text, 'red'::text, 'orange'::text, 'pink'::text])))
);

CREATE TABLE IF NOT EXISTS public.habits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    color character varying(7) DEFAULT '#8B5CF6'::character varying,
    target_frequency integer DEFAULT 1,
    frequency_type character varying(20) DEFAULT 'daily'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_active boolean DEFAULT true,
    CONSTRAINT habits_frequency_type_check CHECK (((frequency_type)::text = ANY (ARRAY[('daily'::character varying)::text, ('weekly'::character varying)::text, ('monthly'::character varying)::text])))
);

CREATE TABLE IF NOT EXISTS public.habit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    habit_id uuid NOT NULL,
    user_id uuid NOT NULL,
    completed_at timestamp with time zone DEFAULT now(),
    log_date date DEFAULT CURRENT_DATE,
    notes text
);

CREATE TABLE IF NOT EXISTS public.habit_monthly_journals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    habit_id uuid,
    month_year text NOT NULL,
    journal_content text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pomodoro_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    task_id uuid,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone,
    duration_minutes integer,
    session_type text NOT NULL,
    completed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT pomodoro_sessions_session_type_check CHECK ((session_type = ANY (ARRAY['focus'::text, 'break'::text])))
);

CREATE TABLE IF NOT EXISTS public.targets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    target_type text NOT NULL,
    target_date date NOT NULL,
    completed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    quadrant text,
    priority text,
    due_date date,
    estimated_time text,
    tags jsonb,
    notes text,
    CONSTRAINT targets_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))),
    CONSTRAINT targets_quadrant_check CHECK ((quadrant = ANY (ARRAY['urgent-important'::text, 'important'::text, 'urgent'::text, 'neither'::text]))),
    CONSTRAINT targets_target_type_check CHECK ((target_type = ANY (ARRAY['tomorrow'::text, 'week'::text, 'month'::text, 'year'::text])))
);


-- 3. PRIMARY KEYS
-- ============================================

ALTER TABLE ONLY public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.tasks ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.achievements ADD CONSTRAINT achievements_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.calendar_events ADD CONSTRAINT calendar_events_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.habits ADD CONSTRAINT habits_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.habit_logs ADD CONSTRAINT habit_logs_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.habit_logs ADD CONSTRAINT habit_logs_habit_id_log_date_key UNIQUE (habit_id, log_date);
ALTER TABLE ONLY public.habit_monthly_journals ADD CONSTRAINT habit_monthly_journals_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.habit_monthly_journals ADD CONSTRAINT habit_monthly_journals_user_id_habit_id_month_year_key UNIQUE (user_id, habit_id, month_year);
ALTER TABLE ONLY public.pomodoro_sessions ADD CONSTRAINT pomodoro_sessions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.targets ADD CONSTRAINT targets_pkey PRIMARY KEY (id);


-- 4. FOREIGN KEYS
-- ============================================

ALTER TABLE ONLY public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.tasks ADD CONSTRAINT tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.achievements ADD CONSTRAINT achievements_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.calendar_events ADD CONSTRAINT calendar_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.habits ADD CONSTRAINT habits_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.habit_logs ADD CONSTRAINT habit_logs_habit_id_fkey FOREIGN KEY (habit_id) REFERENCES public.habits(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.habit_logs ADD CONSTRAINT habit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.habit_monthly_journals ADD CONSTRAINT habit_monthly_journals_habit_id_fkey FOREIGN KEY (habit_id) REFERENCES public.habits(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.habit_monthly_journals ADD CONSTRAINT habit_monthly_journals_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.pomodoro_sessions ADD CONSTRAINT pomodoro_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.pomodoro_sessions ADD CONSTRAINT pomodoro_sessions_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.targets ADD CONSTRAINT targets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


-- 5. INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_user_created ON public.pomodoro_sessions USING btree (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_targets_target_date ON public.targets USING btree (target_date);
CREATE INDEX IF NOT EXISTS idx_targets_target_type ON public.targets USING btree (target_type);
CREATE INDEX IF NOT EXISTS idx_targets_user_id ON public.targets USING btree (user_id);


-- 6. TRIGGERS
-- ============================================

-- Auto-create profile on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created 
    AFTER INSERT ON auth.users 
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER handle_updated_at_profiles 
    BEFORE UPDATE ON public.profiles 
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_tasks 
    BEFORE UPDATE ON public.tasks 
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_tasks_updated_at 
    BEFORE UPDATE ON public.tasks 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_monthly_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.targets ENABLE ROW LEVEL SECURITY;


-- 8. RLS POLICIES
-- ============================================

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));

-- Tasks
CREATE POLICY "Users can view own tasks" ON public.tasks FOR SELECT USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert own tasks" ON public.tasks FOR INSERT WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update own tasks" ON public.tasks FOR UPDATE USING ((auth.uid() = user_id));
CREATE POLICY "Users can delete own tasks" ON public.tasks FOR DELETE USING ((auth.uid() = user_id));

-- Achievements
CREATE POLICY "Users can view own achievements" ON public.achievements FOR SELECT USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert achievements" ON public.achievements FOR INSERT WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update achievements" ON public.achievements FOR UPDATE USING ((auth.uid() = user_id));
CREATE POLICY "Users can delete achievements" ON public.achievements FOR DELETE USING ((auth.uid() = user_id));

-- Calendar Events
CREATE POLICY "Users can view own calendar events" ON public.calendar_events FOR SELECT USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert own calendar events" ON public.calendar_events FOR INSERT WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update own calendar events" ON public.calendar_events FOR UPDATE USING ((auth.uid() = user_id));
CREATE POLICY "Users can delete own calendar events" ON public.calendar_events FOR DELETE USING ((auth.uid() = user_id));

-- Habits
CREATE POLICY "Users can view their own habits" ON public.habits FOR SELECT USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own habits" ON public.habits FOR INSERT WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own habits" ON public.habits FOR UPDATE USING ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own habits" ON public.habits FOR DELETE USING ((auth.uid() = user_id));

-- Habit Logs
CREATE POLICY "Users can view their own habit logs" ON public.habit_logs FOR SELECT USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own habit logs" ON public.habit_logs FOR INSERT WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own habit logs" ON public.habit_logs FOR UPDATE USING ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own habit logs" ON public.habit_logs FOR DELETE USING ((auth.uid() = user_id));

-- Habit Monthly Journals
CREATE POLICY "Users can view their own monthly journals" ON public.habit_monthly_journals FOR SELECT USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own monthly journals" ON public.habit_monthly_journals FOR INSERT WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own monthly journals" ON public.habit_monthly_journals FOR UPDATE USING ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own monthly journals" ON public.habit_monthly_journals FOR DELETE USING ((auth.uid() = user_id));

-- Pomodoro Sessions
CREATE POLICY "Users can access their own pomodoro sessions" ON public.pomodoro_sessions USING ((auth.uid() = user_id));

-- Targets
CREATE POLICY "Users can view their own targets" ON public.targets FOR SELECT USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own targets" ON public.targets FOR INSERT WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own targets" ON public.targets FOR UPDATE USING ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own targets" ON public.targets FOR DELETE USING ((auth.uid() = user_id));


-- 9. REALTIME PUBLICATION (for tasks and targets)
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.targets;
ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.tasks;


-- 10. STORAGE BUCKET for Achievement Images
-- ============================================

INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES ('achievement-images', 'achievement-images', true, false, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
CREATE POLICY "Achievement images read" ON storage.objects FOR SELECT USING ((bucket_id = 'achievement-images'::text));
CREATE POLICY "Achievement images upload" ON storage.objects FOR INSERT WITH CHECK (((bucket_id = 'achievement-images'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));
CREATE POLICY "Users can delete achievement images" ON storage.objects FOR DELETE USING (((bucket_id = 'achievement-images'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));
CREATE POLICY "Users can update achievement images" ON storage.objects FOR UPDATE USING (((bucket_id = 'achievement-images'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));
