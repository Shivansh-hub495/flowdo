import { supabase } from '@/integrations/supabase/client';
import { hasAlreadyMigratedToday, checkForRecentDuplicates, emergencyDuplicateCleanup } from './migrationSafeguards';

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
      console.log('Performing daily target migration check for date:', currentDate);

      // Add a small delay to prevent race conditions if called multiple times
      const migrationLockKey = `migrationLock_${userId}`;
      const existingLock = localStorage.getItem(migrationLockKey);

      if (existingLock && Date.now() - parseInt(existingLock) < 10000) { // Increased to 10 seconds
        console.log('Migration already in progress, skipping...');
        return { success: true, migratedCount: 0, createdTasks: [] };
      }

      // Set migration lock with current timestamp
      localStorage.setItem(migrationLockKey, Date.now().toString());

      // Also set a session-based lock to prevent cross-tab issues
      const sessionLockKey = `sessionMigrationLock_${userId}_${currentDate}`;
      if (sessionStorage.getItem(sessionLockKey)) {
        console.log('Migration already completed in this session today, skipping...');
        localStorage.removeItem(migrationLockKey);
        return { success: true, migratedCount: 0, createdTasks: [] };
      }

      try {
        // Additional database-level check
        const alreadyMigrated = await hasAlreadyMigratedToday(userId);
        if (alreadyMigrated) {
          console.log('Migration already completed today based on database records');
          localStorage.setItem(lastMigrationKey, currentDate);
          sessionStorage.setItem(sessionLockKey, 'completed');
          localStorage.removeItem(migrationLockKey);
          return { success: true, migratedCount: 0, createdTasks: [] };
        }

        const result = await manuallyMigrateTargets(userId);

        if (result.success) {
          localStorage.setItem(lastMigrationKey, currentDate);
          sessionStorage.setItem(sessionLockKey, 'completed'); // Mark as completed in session
          localStorage.removeItem(migrationLockKey); // Remove lock on success

          // Run emergency cleanup after migration to catch any edge case duplicates
          setTimeout(() => emergencyDuplicateCleanup(userId), 2000);

          return result;
        }
      } finally {
        // Always remove lock after attempt
        localStorage.removeItem(migrationLockKey);
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
      console.log(`Found ${tomorrowTargets.length} targets to migrate:`, tomorrowTargets.map(t => t.title));

      // Check if tasks with same titles already exist to prevent duplicates
      // Also check for tasks created in the last 5 minutes to catch recent duplicates
      const fiveMinutesAgo = new Date();
      fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

      const { data: existingTasks, error: checkError } = await supabase
        .from('tasks')
        .select('title, created_at')
        .eq('user_id', userId)
        .or(`title.in.(${tomorrowTargets.map(t => `"${t.title.replace(/"/g, '\\"')}"`).join(',')}),created_at.gte.${fiveMinutesAgo.toISOString()}`);

      if (checkError) {
        console.error('Error checking existing tasks:', checkError);
      }

      const existingTaskTitles = new Set(existingTasks?.map(t => t.title) || []);
      const targetsToMigrate = tomorrowTargets.filter(target => !existingTaskTitles.has(target.title));

      if (targetsToMigrate.length === 0) {
        console.log('All targets already migrated, cleaning up target records...');

        // Delete the targets since they're already migrated
        const targetIds = tomorrowTargets.map(target => target.id);
        const { error: deleteError } = await supabase
          .from('targets')
          .delete()
          .eq('user_id', userId)
          .in('id', targetIds);

        if (deleteError) {
          console.error('Error deleting already migrated targets:', deleteError);
        }

        return {
          success: true,
          migratedCount: 0,
          createdTasks: [],
        };
      }

      // Create tasks from tomorrow targets that don't already exist
      const tasksToCreate = targetsToMigrate.map(target => ({
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

      // Delete ALL the migrated tomorrow targets (including duplicates)
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
        migratedCount: targetsToMigrate.length,
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
