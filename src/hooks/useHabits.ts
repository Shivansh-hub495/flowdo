import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { checkAndCleanupIfNeeded } from '@/utils/habitCleanup';
import { useToast } from '@/hooks/use-toast';

// Helper function to get local date string in YYYY-MM-DD format
const getLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export interface Habit {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  color?: string;
  target_frequency?: number;
  frequency_type?: 'daily' | 'weekly' | 'monthly';
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  completed_at?: string;
  log_date?: string;
  notes?: string;
}

export interface HabitWithStats extends Habit {
  current_streak: number;
  completed_today: boolean;
  completion_rate: number;
  total_completions: number;
}

export const useHabits = () => {
  const [habits, setHabits] = useState<HabitWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchHabits = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch habits
      const { data: habitsData, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (habitsError) throw habitsError;

      // Fetch habit logs for statistics
      const { data: logsData, error: logsError } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('user_id', user.id);

      if (logsError) throw logsError;

      // Calculate statistics for each habit
      const habitsWithStats: HabitWithStats[] = (habitsData || []).map(habit => {
        const habitLogs = logsData?.filter(log => log.habit_id === habit.id) || [];
        const today = getLocalDateString();

        // Check if completed today
        const completedToday = habitLogs.some(log => log.log_date === today);
        
        // Calculate current streak
        let currentStreak = 0;
        const sortedLogs = habitLogs
          .sort((a, b) => new Date(b.log_date || '').getTime() - new Date(a.log_date || '').getTime());
        
        let checkDate = new Date();
        if (!completedToday) {
          checkDate.setDate(checkDate.getDate() - 1);
        }
        
        for (let i = 0; i < 365; i++) {
          const dateStr = getLocalDateString(checkDate);
          const hasLog = sortedLogs.some(log => log.log_date === dateStr);
          
          if (hasLog) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
        
        // Calculate completion rate (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentLogs = habitLogs.filter(log => 
          new Date(log.log_date || '') >= thirtyDaysAgo
        );
        const completionRate = Math.round((recentLogs.length / 30) * 100);
        
        return {
          ...habit,
          current_streak: currentStreak,
          completed_today: completedToday,
          completion_rate: completionRate,
          total_completions: habitLogs.length
        };
      });

      setHabits(habitsWithStats);
    } catch (error) {
      console.error('Error fetching habits:', error);
      toast({
        title: "Error",
        description: "Failed to load habits. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createHabit = async (habitData: Omit<Habit, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('habits')
        .insert([
          {
            ...habitData,
            user_id: user.id,
            color: habitData.color || '#8B5CF6',
            target_frequency: habitData.target_frequency || 1,
            frequency_type: habitData.frequency_type || 'daily',
            is_active: true
          }
        ])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Habit created successfully!",
      });

      fetchHabits(); // Refresh the list
      return data;
    } catch (error) {
      console.error('Error creating habit:', error);
      toast({
        title: "Error",
        description: "Failed to create habit. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateHabit = async (id: string, updates: Partial<Habit>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('habits')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Habit updated successfully!",
      });

      fetchHabits(); // Refresh the list
    } catch (error) {
      console.error('Error updating habit:', error);
      toast({
        title: "Error",
        description: "Failed to update habit. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteHabit = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('habits')
        .update({ is_active: false })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Habit deleted successfully!",
      });

      fetchHabits(); // Refresh the list
    } catch (error) {
      console.error('Error deleting habit:', error);
      toast({
        title: "Error",
        description: "Failed to delete habit. Please try again.",
        variant: "destructive",
      });
    }
  };

  const logHabitCompletion = async (habitId: string, notes?: string) => {
    if (!user) return;

    try {
      const today = getLocalDateString();

      // Check if already logged today
      const { data: existingLog } = await supabase
        .from('habit_logs')
        .select('id')
        .eq('habit_id', habitId)
        .eq('user_id', user.id)
        .eq('log_date', today)
        .single();

      if (existingLog) {
        toast({
          title: "Already Completed",
          description: "You've already completed this habit today!",
        });
        return;
      }

      const { error } = await supabase
        .from('habit_logs')
        .insert([
          {
            habit_id: habitId,
            user_id: user.id,
            log_date: today,
            notes: notes || null,
            completed_at: new Date().toISOString()
          }
        ]);

      if (error) throw error;

      toast({
        title: "Great job!",
        description: "Habit completed for today!",
      });

      fetchHabits(); // Refresh to update stats
    } catch (error) {
      console.error('Error logging habit completion:', error);
      toast({
        title: "Error",
        description: "Failed to log habit completion. Please try again.",
        variant: "destructive",
      });
    }
  };

  const removeHabitLog = async (habitId: string) => {
    if (!user) return;

    try {
      const today = getLocalDateString();

      const { error } = await supabase
        .from('habit_logs')
        .delete()
        .eq('habit_id', habitId)
        .eq('user_id', user.id)
        .eq('log_date', today);

      if (error) throw error;

      toast({
        title: "Removed",
        description: "Habit completion removed for today.",
      });

      fetchHabits(); // Refresh to update stats
    } catch (error) {
      console.error('Error removing habit log:', error);
      toast({
        title: "Error",
        description: "Failed to remove habit log. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getWeeklyProgress = async (habitId: string): Promise<boolean[]> => {
    if (!user) return [];

    try {
      // Get current week starting from Sunday
      const today = new Date();
      const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

      const weekDates = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - currentDay + i); // Start from Sunday
        weekDates.push(getLocalDateString(date));
      }

      const { data: logs, error } = await supabase
        .from('habit_logs')
        .select('log_date')
        .eq('habit_id', habitId)
        .eq('user_id', user.id)
        .in('log_date', weekDates);

      if (error) throw error;

      const logDates = new Set(logs?.map(log => log.log_date) || []);
      return weekDates.map(date => logDates.has(date));
    } catch (error) {
      console.error('Error fetching weekly progress:', error);
      return [];
    }
  };

  const getMonthlyProgress = async (habitId: string): Promise<{ date: number; completed: boolean; dateString: string }[]> => {
    if (!user) return [];

    try {
      // Get current month dates using local timezone
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();



      const monthDates = [];
      for (let day = 1; day <= daysInMonth; day++) {
        // Create date in local timezone and format as YYYY-MM-DD
        const localDate = new Date(year, month, day);
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        monthDates.push({ date: day, dateString, completed: false });
      }

      const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month + 2).padStart(2, '0')}-01`;

      const { data: logs, error } = await supabase
        .from('habit_logs')
        .select('log_date')
        .eq('habit_id', habitId)
        .eq('user_id', user.id)
        .gte('log_date', startDate)
        .lt('log_date', endDate);

      if (error) throw error;

      const logDates = new Set(logs?.map(log => log.log_date) || []);

      return monthDates.map(({ date, dateString }) => ({
        date,
        dateString,
        completed: logDates.has(dateString)
      }));
    } catch (error) {
      console.error('Error fetching monthly progress:', error);
      return [];
    }
  };

  const getMonthlyJournal = async (habitId: string): Promise<string> => {
    if (!user) return '';

    try {
      // Use local timezone for consistent date handling
      const today = new Date();
      const monthYear = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;



      const { data, error } = await supabase
        .from('habit_monthly_journals')
        .select('journal_content')
        .eq('habit_id', habitId)
        .eq('user_id', user.id)
        .eq('month_year', monthYear)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching journal:', error);
        throw error;
      }

      return data?.journal_content || '';
    } catch (error) {
      console.error('Error fetching monthly journal:', error);
      return '';
    }
  };

  const updateMonthlyJournal = async (habitId: string, content: string): Promise<void> => {
    if (!user) return;

    try {
      // Use local timezone for consistent date handling
      const today = new Date();
      const monthYear = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;



      // First try to update existing record
      const { data: updateData, error: updateError } = await supabase
        .from('habit_monthly_journals')
        .update({
          journal_content: content,
          updated_at: new Date().toISOString()
        })
        .eq('habit_id', habitId)
        .eq('user_id', user.id)
        .eq('month_year', monthYear)
        .select();

      // If no rows were updated, insert a new record
      if (updateData && updateData.length === 0) {
        const { data: insertData, error: insertError } = await supabase
          .from('habit_monthly_journals')
          .insert({
            habit_id: habitId,
            user_id: user.id,
            month_year: monthYear,
            journal_content: content,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select();

        if (insertError) {
          console.error('Error inserting journal:', insertError);
          throw insertError;
        }
      } else if (updateError) {
        console.error('Error updating journal:', updateError);
        throw updateError;
      }
    } catch (error) {
      console.error('Error updating monthly journal:', error);
      throw error;
    }
  };

  useEffect(() => {
    const initializeHabits = async () => {
      if (user) {
        await checkAndCleanupIfNeeded();
        await fetchHabits();
      }
    };

    initializeHabits();
  }, [user]);

  return {
    habits,
    loading,
    createHabit,
    updateHabit,
    deleteHabit,
    logHabitCompletion,
    removeHabitLog,
    getWeeklyProgress,
    getMonthlyProgress,
    getMonthlyJournal,
    updateMonthlyJournal,
    refetch: fetchHabits
  };
};
