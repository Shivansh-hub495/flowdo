import { supabase } from '@/integrations/supabase/client';

/**
 * Remove duplicate tasks that have the same title and were created within a short time window
 * This helps clean up any duplicates that might have been created due to race conditions
 */
export const removeDuplicateTasks = async (userId: string): Promise<void> => {
  try {
    console.log('Checking for duplicate tasks...');
    
    // Get all tasks for the user
    const { data: tasks, error: fetchError } = await supabase
      .from('tasks')
      .select('id, title, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (fetchError) {
      throw fetchError;
    }

    if (!tasks || tasks.length === 0) {
      return;
    }

    // Group tasks by title
    const tasksByTitle = new Map<string, typeof tasks>();
    
    tasks.forEach(task => {
      const title = task.title.trim().toLowerCase();
      if (!tasksByTitle.has(title)) {
        tasksByTitle.set(title, []);
      }
      tasksByTitle.get(title)!.push(task);
    });

    // Find duplicates and mark older ones for deletion
    const tasksToDelete: string[] = [];
    
    tasksByTitle.forEach((taskGroup, title) => {
      if (taskGroup.length > 1) {
        console.log(`Found ${taskGroup.length} duplicates for "${title}"`);
        
        // Sort by creation time (newest first)
        taskGroup.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        // Check if they were created within 1 minute of each other (likely duplicates)
        const newestTask = taskGroup[0];
        const newestTime = new Date(newestTask.created_at).getTime();
        
        for (let i = 1; i < taskGroup.length; i++) {
          const taskTime = new Date(taskGroup[i].created_at).getTime();
          const timeDiff = newestTime - taskTime;
          
          // If created within 1 minute, consider it a duplicate
          if (timeDiff < 60000) { // 60 seconds
            tasksToDelete.push(taskGroup[i].id);
          }
        }
      }
    });

    // Delete duplicate tasks
    if (tasksToDelete.length > 0) {
      console.log(`Deleting ${tasksToDelete.length} duplicate tasks:`, tasksToDelete);
      
      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('user_id', userId)
        .in('id', tasksToDelete);

      if (deleteError) {
        throw deleteError;
      }

      console.log('Duplicate tasks cleaned up successfully');
    } else {
      console.log('No duplicate tasks found');
    }
  } catch (error) {
    console.error('Error removing duplicate tasks:', error);
  }
};

/**
 * Check and clean up duplicates if needed (once per day)
 */
export const checkAndCleanupDuplicates = async (userId: string): Promise<void> => {
  try {
    const lastCleanupKey = `lastDuplicateCleanup_${userId}`;
    const lastCleanup = localStorage.getItem(lastCleanupKey);
    const currentDate = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format

    // Only cleanup once per day
    if (lastCleanup !== currentDate) {
      console.log('Performing daily duplicate cleanup...');
      await removeDuplicateTasks(userId);
      localStorage.setItem(lastCleanupKey, currentDate);
    }
  } catch (error) {
    console.error('Error in automatic duplicate cleanup:', error);
  }
};
