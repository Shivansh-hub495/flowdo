import { supabase } from '@/integrations/supabase/client';

/**
 * Check if migration is needed and perform it automatically
 * This should be called on app startup
 */
export const checkAndMigrateTargets = async (userId: string) => {
  try {
    const lastMigrationKey = `lastTargetMigration_${userId}`;
    const lastMigration = localStorage.getItem(lastMigrationKey);
    const currentDate = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format

    // Only migrate once per day
    if (lastMigration !== currentDate) {
      console.log('Performing daily target migration check...');
      const result = await manuallyMigrateTargets(userId);

      if (result.success) {
        localStorage.setItem(lastMigrationKey, currentDate);
        return result;
      }
    }

    return { success: true, migratedCount: 0, createdTasks: [] };
  } catch (error) {
    console.error('Error in automatic migration check:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Manually migrate tomorrow targets to tasks
 * This function can be called to immediately migrate targets that should have been migrated
 */
export const manuallyMigrateTargets = async (userId: string) => {
  try {
    // Get user's local date
    const userLocalDate = new Date();
    const userLocalDateString = userLocalDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format
    
    console.log('Migrating targets for date:', userLocalDateString);
    
    // Get tomorrow targets that are due today or earlier (should become today's tasks)
    const { data: tomorrowTargets, error: fetchError } = await supabase
      .from('targets')
      .select('*')
      .eq('user_id', userId)
      .eq('target_type', 'tomorrow')
      .lte('target_date', userLocalDateString);

    if (fetchError) {
      throw fetchError;
    }

    console.log('Found targets to migrate:', tomorrowTargets);

    if (tomorrowTargets && tomorrowTargets.length > 0) {
      // Create tasks from tomorrow targets
      const tasksToCreate = tomorrowTargets.map(target => ({
        title: target.title,
        description: target.description,
        quadrant: target.quadrant || 'important' as const,
        priority: target.priority,
        due_date: target.due_date,
        estimated_time: target.estimated_time,
        tags: target.tags,
        notes: target.notes,
        user_id: userId,
        completed: false,
      }));

      console.log('Creating tasks:', tasksToCreate);

      const { data: createdTasks, error: insertError } = await supabase
        .from('tasks')
        .insert(tasksToCreate)
        .select();

      if (insertError) {
        throw insertError;
      }

      console.log('Created tasks:', createdTasks);

      // Delete the migrated tomorrow targets
      const targetIds = tomorrowTargets.map(target => target.id);
      const { error: deleteError } = await supabase
        .from('targets')
        .delete()
        .eq('user_id', userId)
        .in('id', targetIds);

      if (deleteError) {
        throw deleteError;
      }

      console.log('Deleted targets:', targetIds);

      return {
        success: true,
        migratedCount: tomorrowTargets.length,
        createdTasks,
      };
    }

    return {
      success: true,
      migratedCount: 0,
      createdTasks: [],
    };
  } catch (err) {
    console.error('Error migrating tomorrow targets:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
};
