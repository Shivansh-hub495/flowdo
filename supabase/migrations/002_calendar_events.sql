-- Create calendar_events table
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    color TEXT CHECK (color IN ('blue', 'green', 'purple', 'red', 'orange', 'pink')) DEFAULT 'blue',
    location TEXT,
    attendees JSONB DEFAULT '[]'::jsonb,
    all_day BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own calendar events" ON public.calendar_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calendar events" ON public.calendar_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar events" ON public.calendar_events
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own calendar events" ON public.calendar_events
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_calendar_events_user_id ON public.calendar_events(user_id);
CREATE INDEX idx_calendar_events_date ON public.calendar_events(date);
CREATE INDEX idx_calendar_events_user_date ON public.calendar_events(user_id, date);
