import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks } from '@/hooks/useTasks';
import { usePomodoroSessions } from '@/hooks/usePomodoroSessions';

// Helper function to get local date string in YYYY-MM-DD format
const getLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export interface DailyStats {
  date: string;
  focusTime: number; // in minutes
  pomodoroCount: number;
  tasksCompleted: number;
  tasksCreated: number;
}

export interface WeeklyStats {
  totalFocusTime: number;
  totalPomodoros: number;
  totalTasksCompleted: number;
  totalTasksCreated: number;
  averageDailyFocus: number;
  streak: number;
  dailyBreakdown: DailyStats[];
}

export interface QuadrantStats {
  'urgent-important': number;
  'important': number;
  'urgent': number;
  'neither': number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  progress?: number;
  target?: number;
  icon: string;
}

export const useStatistics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { tasks } = useTasks();
  const { sessions } = usePomodoroSessions();

  // Calculate daily statistics for the past 7 days
  const calculateDailyStats = (): DailyStats[] => {
    const dailyStats: DailyStats[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      // Filter sessions for this day using local date comparison
      const daySessions = sessions.filter(session => {
        const sessionDate = new Date(session.created_at || session.start_time);
        // Convert to local date string for comparison to avoid timezone issues
        const sessionLocalDate = getLocalDateString(sessionDate);
        const targetLocalDate = getLocalDateString(date);
        return sessionLocalDate === targetLocalDate;
      });

      // Filter tasks for this day
      const dayTasks = tasks.filter(task => {
        const taskDate = new Date(task.created_at);
        const taskLocalDate = getLocalDateString(taskDate);
        const targetLocalDate = getLocalDateString(date);
        return taskLocalDate === targetLocalDate;
      });

      const completedTasks = dayTasks.filter(task => task.completed);

      // Calculate focus time in minutes
      const focusTime = daySessions
        .filter(session => session.session_type === 'focus' && session.completed)
        .reduce((total, session) => total + (session.duration_minutes || 0), 0);

      const pomodoroCount = daySessions
        .filter(session => session.session_type === 'focus' && session.completed)
        .length;

      dailyStats.push({
        date: getLocalDateString(date),
        focusTime,
        pomodoroCount,
        tasksCompleted: completedTasks.length,
        tasksCreated: dayTasks.length,
      });
    }

    return dailyStats;
  };

  // Calculate weekly statistics
  const calculateWeeklyStats = (): WeeklyStats => {
    const dailyBreakdown = calculateDailyStats();
    
    const totalFocusTime = dailyBreakdown.reduce((sum, day) => sum + day.focusTime, 0);
    const totalPomodoros = dailyBreakdown.reduce((sum, day) => sum + day.pomodoroCount, 0);
    const totalTasksCompleted = dailyBreakdown.reduce((sum, day) => sum + day.tasksCompleted, 0);
    const totalTasksCreated = dailyBreakdown.reduce((sum, day) => sum + day.tasksCreated, 0);
    
    const averageDailyFocus = totalFocusTime / 7;
    
    // Calculate streak (consecutive days with focus time > 0)
    let streak = 0;
    for (let i = dailyBreakdown.length - 1; i >= 0; i--) {
      if (dailyBreakdown[i].focusTime > 0) {
        streak++;
      } else {
        break;
      }
    }
    
    return {
      totalFocusTime,
      totalPomodoros,
      totalTasksCompleted,
      totalTasksCreated,
      averageDailyFocus,
      streak,
      dailyBreakdown,
    };
  };

  // Calculate quadrant distribution
  const calculateQuadrantStats = (): QuadrantStats => {
    const completedTasks = tasks.filter(task => task.completed);
    
    return {
      'urgent-important': completedTasks.filter(task => task.quadrant === 'urgent-important').length,
      'important': completedTasks.filter(task => task.quadrant === 'important').length,
      'urgent': completedTasks.filter(task => task.quadrant === 'urgent').length,
      'neither': completedTasks.filter(task => task.quadrant === 'neither').length,
    };
  };

  // Calculate matrix score based on task completion and focus time
  const calculateMatrixScore = (): number => {
    const weeklyStats = calculateWeeklyStats();
    const quadrantStats = calculateQuadrantStats();
    
    // Score based on important tasks (urgent-important + important)
    const importantTasks = quadrantStats['urgent-important'] + quadrantStats['important'];
    const totalTasks = Object.values(quadrantStats).reduce((sum, count) => sum + count, 0);
    
    const taskScore = totalTasks > 0 ? (importantTasks / totalTasks) * 50 : 0;
    
    // Score based on focus time (target: 3 hours per day)
    const focusScore = Math.min((weeklyStats.averageDailyFocus / 180) * 50, 50);
    
    return Math.round(taskScore + focusScore);
  };

  // Calculate achievements
  const calculateAchievements = (): Achievement[] => {
    const weeklyStats = calculateWeeklyStats();
    const matrixScore = calculateMatrixScore();
    const todayStats = weeklyStats.dailyBreakdown[weeklyStats.dailyBreakdown.length - 1];
    
    return [
      {
        id: 'focus-master',
        title: 'Focus Master',
        description: 'Complete 10 pomodoros in a day',
        unlocked: todayStats.pomodoroCount >= 10,
        progress: todayStats.pomodoroCount,
        target: 10,
        icon: '🎯',
      },
      {
        id: 'matrix-maestro',
        title: 'Matrix Maestro',
        description: 'Achieve 90+ matrix score',
        unlocked: matrixScore >= 90,
        progress: matrixScore,
        target: 90,
        icon: '🏆',
      },
      {
        id: 'streak-keeper',
        title: 'Streak Keeper',
        description: 'Maintain 7-day focus streak',
        unlocked: weeklyStats.streak >= 7,
        progress: weeklyStats.streak,
        target: 7,
        icon: '🔥',
      },
      {
        id: 'deep-worker',
        title: 'Deep Worker',
        description: 'Focus for 25+ hours in a week',
        unlocked: weeklyStats.totalFocusTime >= 1500, // 25 hours in minutes
        progress: Math.round(weeklyStats.totalFocusTime / 60),
        target: 25,
        icon: '⚡',
      },
      {
        id: 'task-crusher',
        title: 'Task Crusher',
        description: 'Complete 50+ tasks in a week',
        unlocked: weeklyStats.totalTasksCompleted >= 50,
        progress: weeklyStats.totalTasksCompleted,
        target: 50,
        icon: '💪',
      },
      {
        id: 'consistency-king',
        title: 'Consistency King',
        description: 'Focus every day for a week',
        unlocked: weeklyStats.dailyBreakdown.every(day => day.focusTime > 0),
        progress: weeklyStats.dailyBreakdown.filter(day => day.focusTime > 0).length,
        target: 7,
        icon: '👑',
      },
    ];
  };

  // Format time in hours and minutes
  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
      return `${mins}m`;
    } else if (mins === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${mins}m`;
    }
  };

  useEffect(() => {
    if (user) {
      setLoading(false);
      setError(null);
    } else {
      setLoading(true);
    }
  }, [user, tasks, sessions]);

  return {
    loading,
    error,
    calculateDailyStats,
    calculateWeeklyStats,
    calculateQuadrantStats,
    calculateMatrixScore,
    calculateAchievements,
    formatTime,
  };
};
