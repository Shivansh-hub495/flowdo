import { supabase } from '@/integrations/supabase/client';

/**
 * Ultimate safeguard: Check if migration has already been performed today
 * by looking at database records and timestamps
 */
export const hasAlreadyMigratedToday = async (userId: string): Promise<boolean> => {
  try {
    // Get start and end of today
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Check if any tasks were created today from migration
    // (tasks created within the first hour of the day are likely from migration)
    const firstHourOfDay = new Date(startOfDay);
    firstHourOfDay.setHours(1, 0, 0, 0);

    const { data: todaysTasks, error } = await supabase
      .from('tasks')
      .select('id, title, created_at')
      .eq('user_id', userId)
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', firstHourOfDay.toISOString());

    if (error) {
      console.error('Error checking today\'s tasks:', error);
      return false; // If we can't check, allow migration to proceed
    }

    // If there are tasks created in the first hour, likely migration already happened
    const migrationLikelyOccurred = todaysTasks && todaysTasks.length > 0;
    
    if (migrationLikelyOccurred) {
      console.log('Migration likely already occurred today based on task creation times');
    }

    return migrationLikelyOccurred;
  } catch (error) {
    console.error('Error in migration safeguard check:', error);
    return false; // If error, allow migration to proceed
  }
};

/**
 * Check for potential duplicate tasks that might indicate a failed migration
 */
export const checkForRecentDuplicates = async (userId: string, taskTitles: string[]): Promise<string[]> => {
  try {
    const tenMinutesAgo = new Date();
    tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10);

    const { data: recentTasks, error } = await supabase
      .from('tasks')
      .select('title, created_at')
      .eq('user_id', userId)
      .gte('created_at', tenMinutesAgo.toISOString())
      .in('title', taskTitles);

    if (error) {
      console.error('Error checking for recent duplicates:', error);
      return [];
    }

    // Group by title and find duplicates
    const titleCounts = new Map<string, number>();
    recentTasks?.forEach(task => {
      const count = titleCounts.get(task.title) || 0;
      titleCounts.set(task.title, count + 1);
    });

    // Return titles that already exist
    return Array.from(titleCounts.keys()).filter(title => titleCounts.get(title)! > 0);
  } catch (error) {
    console.error('Error checking recent duplicates:', error);
    return [];
  }
};

/**
 * Emergency cleanup function - removes obvious duplicates created within minutes
 */
export const emergencyDuplicateCleanup = async (userId: string): Promise<void> => {
  try {
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

    // Get all tasks created in the last 5 minutes
    const { data: recentTasks, error } = await supabase
      .from('tasks')
      .select('id, title, created_at')
      .eq('user_id', userId)
      .gte('created_at', fiveMinutesAgo.toISOString())
      .order('created_at', { ascending: false });

    if (error || !recentTasks || recentTasks.length === 0) {
      return;
    }

    // Group by title
    const tasksByTitle = new Map<string, typeof recentTasks>();
    recentTasks.forEach(task => {
      const title = task.title;
      if (!tasksByTitle.has(title)) {
        tasksByTitle.set(title, []);
      }
      tasksByTitle.get(title)!.push(task);
    });

    // Find duplicates and keep only the newest
    const tasksToDelete: string[] = [];
    tasksByTitle.forEach((tasks, title) => {
      if (tasks.length > 1) {
        console.log(`Emergency cleanup: Found ${tasks.length} duplicates of "${title}"`);
        // Sort by creation time (newest first) and delete all but the first
        tasks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        tasksToDelete.push(...tasks.slice(1).map(t => t.id));
      }
    });

    if (tasksToDelete.length > 0) {
      console.log(`Emergency cleanup: Deleting ${tasksToDelete.length} duplicate tasks`);
      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('user_id', userId)
        .in('id', tasksToDelete);

      if (deleteError) {
        console.error('Error in emergency cleanup:', deleteError);
      } else {
        console.log('Emergency cleanup completed successfully');
      }
    }
  } catch (error) {
    console.error('Error in emergency duplicate cleanup:', error);
  }
};
