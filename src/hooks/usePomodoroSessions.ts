import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface PomodoroSession {
  id: string;
  user_id: string;
  task_id: string | null;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  session_type: 'focus' | 'break';
  completed: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateSessionData {
  task_id?: string | null;
  start_time: string;
  session_type: 'focus' | 'break';
}

export interface UpdateSessionData {
  end_time?: string;
  duration_minutes?: number;
  completed?: boolean;
}

export const usePomodoroSessions = () => {
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch all sessions for the current user
  const fetchSessions = async () => {
    if (!user) {
      setSessions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('pomodoro_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setSessions(data || []);
    } catch (err) {
      console.error('Error fetching pomodoro sessions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions');
      toast({
        title: "Error",
        description: "Failed to load pomodoro sessions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Create a new pomodoro session
  const createSession = async (sessionData: CreateSessionData): Promise<PomodoroSession | null> => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create sessions.",
        variant: "destructive",
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('pomodoro_sessions')
        .insert([
          {
            user_id: user.id,
            task_id: sessionData.task_id,
            start_time: sessionData.start_time,
            session_type: sessionData.session_type,
            completed: false,
          }
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      const newSession = data as PomodoroSession;
      setSessions(prev => [newSession, ...prev]);
      
      return newSession;
    } catch (err) {
      console.error('Error creating pomodoro session:', err);
      toast({
        title: "Error",
        description: "Failed to create session. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Update an existing pomodoro session
  const updateSession = async (sessionId: string, updateData: UpdateSessionData): Promise<PomodoroSession | null> => {
    try {
      const { data, error } = await supabase
        .from('pomodoro_sessions')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const updatedSession = data as PomodoroSession;
      setSessions(prev => prev.map(session => 
        session.id === sessionId ? updatedSession : session
      ));

      return updatedSession;
    } catch (err) {
      console.error('Error updating pomodoro session:', err);
      toast({
        title: "Error",
        description: "Failed to update session. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Get today's completed focus sessions count
  const getTodaysPomodoroCount = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return sessions.filter(session => {
      const sessionDate = new Date(session.created_at || session.start_time);
      return (
        session.session_type === 'focus' &&
        session.completed === true &&
        sessionDate >= today &&
        sessionDate < tomorrow
      );
    }).length;
  };

  // Get today's total focus time in minutes
  const getTodaysFocusTimeMinutes = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return sessions
      .filter(session => {
        const sessionDate = new Date(session.created_at || session.start_time);
        return (
          session.session_type === 'focus' &&
          session.completed === true &&
          session.duration_minutes &&
          sessionDate >= today &&
          sessionDate < tomorrow
        );
      })
      .reduce((total, session) => total + (session.duration_minutes || 0), 0);
  };

  // Format focus time as "Xh Ym" string
  const getTodaysFocusTimeFormatted = () => {
    const totalMinutes = getTodaysFocusTimeMinutes();
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0 && minutes === 0) {
      return '0m';
    } else if (hours === 0) {
      return `${minutes}m`;
    } else if (minutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${minutes}m`;
    }
  };

  // Complete a session (mark as completed and set end time/duration)
  const completeSession = async (sessionId: string, durationMinutes: number): Promise<PomodoroSession | null> => {
    const endTime = new Date().toISOString();
    return updateSession(sessionId, {
      end_time: endTime,
      duration_minutes: durationMinutes,
      completed: true,
    });
  };

  // Load sessions when user changes
  useEffect(() => {
    fetchSessions();
  }, [user]);

  return {
    sessions,
    loading,
    error,
    fetchSessions,
    createSession,
    updateSession,
    completeSession,
    getTodaysPomodoroCount,
    getTodaysFocusTimeMinutes,
    getTodaysFocusTimeFormatted,
  };
};
