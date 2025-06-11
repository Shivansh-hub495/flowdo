import { supabase } from '@/integrations/supabase/client';

/**
 * Cleanup old habit data (logs and journals) that are older than the current month
 * This function should be called at the beginning of each month
 */
export const cleanupOldHabitData = async (): Promise<void> => {
  try {
    const currentDate = new Date();
    const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const currentMonthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    
    console.log('Starting habit data cleanup for data older than:', currentMonthStart.toISOString());
    
    // Delete habit logs older than current month
    const { error: logsError } = await supabase
      .from('habit_logs')
      .delete()
      .lt('log_date', currentMonthStart.toISOString().split('T')[0]);
    
    if (logsError) {
      console.error('Error cleaning up old habit logs:', logsError);
      throw logsError;
    }
    
    // Delete monthly journals older than current month
    const { error: journalsError } = await supabase
      .from('habit_monthly_journals')
      .delete()
      .lt('month_year', currentMonthYear);
    
    if (journalsError) {
      console.error('Error cleaning up old monthly journals:', journalsError);
      throw journalsError;
    }
    
    console.log('Habit data cleanup completed successfully');
  } catch (error) {
    console.error('Failed to cleanup old habit data:', error);
    throw error;
  }
};

/**
 * Check if cleanup is needed (if we're in a new month)
 * This can be called on app startup to automatically cleanup old data
 */
export const checkAndCleanupIfNeeded = async (): Promise<void> => {
  try {
    const lastCleanupKey = 'lastHabitCleanup';
    const lastCleanup = localStorage.getItem(lastCleanupKey);
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    
    if (!lastCleanup || lastCleanup !== currentMonth) {
      console.log('New month detected, performing habit data cleanup...');
      await cleanupOldHabitData();
      localStorage.setItem(lastCleanupKey, currentMonth);
    }
  } catch (error) {
    console.error('Error in automatic cleanup check:', error);
  }
};
