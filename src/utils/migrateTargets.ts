import { supabase } from '@/integrations/supabase/client';
import { hasAlreadyMigratedToday, checkForRecentDuplicates, emergencyDuplicateCleanup } from './migrationSafeguards';

/**
 * Check if a target has expired based on its type and target_date
 */
const isTargetExpired = (targetType: string, targetDate: string): boolean => {
  const today = new Date();
  const target = new Date(targetDate);

  // Set both dates to start of day for accurate comparison
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  switch (targetType) {
    case 'week':
      // Week targets expire after the target date (end of week)
      return today > target;
    case 'month':
      // Month targets expire after the target date (end of month)
      return today > target;
    case 'year':
      // Year targets expire after the target date (end of year)
      return today > target;
    default:
      return false; // Don't auto-delete tomorrow targets or unknown types
  }
};

/**
 * Delete expired targets for week, month, and year types
 */
export const deleteExpiredTargets = async (userId: string) => {
  try {
    console.log('Checking for expired targets...');

    // Get all non-tomorrow targets
    const { data: targets, error: fetchError } = await supabase
      .from('targets')
      .select('*')
      .eq('user_id', userId)
      .in('target_type', ['week', 'month', 'year']);

    if (fetchError) {
      throw fetchError;
    }

    if (!targets || targets.length === 0) {
      console.log('No week/month/year targets found');
      return { success: true, deletedCount: 0 };
    }

    // Filter expired targets
    const expiredTargets = targets.filter(target =>
      isTargetExpired(target.target_type, target.target_date)
    );

    if (expiredTargets.length === 0) {
      console.log('No expired targets found');
      return { success: true, deletedCount: 0 };
    }

    console.log(`Found ${expiredTargets.length} expired targets:`,
      expiredTargets.map(t => `${t.title} (${t.target_type}, due: ${t.target_date})`));

    // Delete expired targets
    const targetIds = expiredTargets.map(target => target.id);
    const { error: deleteError } = await supabase
      .from('targets')
      .delete()
      .eq('user_id', userId)
      .in('id', targetIds);

    if (deleteError) {
      throw deleteError;
    }

    console.log(`Successfully deleted ${expiredTargets.length} expired targets`);

    return {
      success: true,
      deletedCount: expiredTargets.length,
      deletedTargets: expiredTargets.map(t => ({
        title: t.title,
        type: t.target_type,
        targetDate: t.target_date
      }))
    };
  } catch (error) {
    console.error('Error deleting expired targets:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Check if migration is needed and perform it automatically
 * This should be called on app startup
 */
export const checkAndMigrateTargets = async (userId: string) => {
  try {
    const lastMigrationKey = `lastTargetMigration_${userId}`;
    const lastMigration = localStorage.getItem(lastMigrationKey);
    const currentDate = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format

    console.log('🔍 Checking automatic migration/cleanup:', {
      userId: userId.substring(0, 8) + '...',
      lastMigration,
      currentDate,
      shouldRun: lastMigration !== currentDate
    });

    // Only migrate once per day
    if (lastMigration !== currentDate) {
      console.log('🚀 Performing daily target migration and cleanup check for date:', currentDate);

      // Add a small delay to prevent race conditions if called multiple times
      const migrationLockKey = `migrationLock_${userId}`;
      const existingLock = localStorage.getItem(migrationLockKey);

      if (existingLock && Date.now() - parseInt(existingLock) < 10000) { // Increased to 10 seconds
        console.log('Migration already in progress, skipping...');
        return { success: true, migratedCount: 0, createdTasks: [], deletedCount: 0 };
      }

      // Set migration lock with current timestamp
      localStorage.setItem(migrationLockKey, Date.now().toString());

      // Also set a session-based lock to prevent cross-tab issues
      const sessionLockKey = `sessionMigrationLock_${userId}_${currentDate}`;
      if (sessionStorage.getItem(sessionLockKey)) {
        console.log('Migration already completed in this session today, skipping...');
        localStorage.removeItem(migrationLockKey);
        return { success: true, migratedCount: 0, createdTasks: [], deletedCount: 0 };
      }

      try {
        // Additional database-level check
        const alreadyMigrated = await hasAlreadyMigratedToday(userId);
        if (alreadyMigrated) {
          console.log('Migration already completed today based on database records');
          localStorage.setItem(lastMigrationKey, currentDate);
          sessionStorage.setItem(sessionLockKey, 'completed');
          localStorage.removeItem(migrationLockKey);
          return { success: true, migratedCount: 0, createdTasks: [], deletedCount: 0 };
        }

        // First, delete expired targets
        const deleteResult = await deleteExpiredTargets(userId);

        // Then, migrate tomorrow targets
        const migrateResult = await manuallyMigrateTargets(userId);

        if (migrateResult.success) {
          localStorage.setItem(lastMigrationKey, currentDate);
          sessionStorage.setItem(sessionLockKey, 'completed'); // Mark as completed in session
          localStorage.removeItem(migrationLockKey); // Remove lock on success

          // Run emergency cleanup after migration to catch any edge case duplicates
          setTimeout(() => emergencyDuplicateCleanup(userId), 2000);

          return {
            success: true,
            migratedCount: migrateResult.migratedCount,
            createdTasks: migrateResult.createdTasks,
            deletedCount: deleteResult.success ? deleteResult.deletedCount : 0,
            deletedTargets: deleteResult.success ? deleteResult.deletedTargets : undefined
          };
        }
      } finally {
        // Always remove lock after attempt
        localStorage.removeItem(migrationLockKey);
      }
    }

    return { success: true, migratedCount: 0, createdTasks: [], deletedCount: 0 };
  } catch (error) {
    console.error('Error in automatic migration check:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Manually delete expired targets (for testing or manual cleanup)
 * This function can be called to immediately delete expired targets
 */
export const manuallyDeleteExpiredTargets = async (userId: string) => {
  return await deleteExpiredTargets(userId);
};

/**
 * Force migration and cleanup regardless of daily check
 * This bypasses the localStorage check and runs immediately
 */
export const forceTargetMigrationAndCleanup = async (userId: string) => {
  try {
    console.log('🔧 Forcing target migration and cleanup for user:', userId.substring(0, 8) + '...');

    // First, delete expired targets
    const deleteResult = await deleteExpiredTargets(userId);
    console.log('🗑️ Delete result:', deleteResult);

    // Then, migrate tomorrow targets
    const migrateResult = await manuallyMigrateTargets(userId);
    console.log('📋 Migration result:', migrateResult);

    return {
      success: true,
      migratedCount: migrateResult.migratedCount,
      createdTasks: migrateResult.createdTasks,
      deletedCount: deleteResult.success ? deleteResult.deletedCount : 0,
      deletedTargets: deleteResult.success ? deleteResult.deletedTargets : undefined
    };
  } catch (error) {
    console.error('❌ Error in forced migration and cleanup:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Global functions for manual operations from browser console
 */
if (typeof window !== 'undefined') {
  // Manual cleanup only
  (window as any).cleanupExpiredTargets = async () => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.error('No authenticated user found');
        return;
      }

      console.log('🔍 Starting manual cleanup for user:', user.email);
      const result = await deleteExpiredTargets(user.id);

      if (result.success) {
        console.log(`✅ Cleanup complete! Deleted ${result.deletedCount} expired targets.`);
        if (result.deletedTargets && result.deletedTargets.length > 0) {
          console.log('Deleted targets:', result.deletedTargets);
        }
      } else {
        console.error('❌ Cleanup failed:', result.error);
      }

      return result;
    } catch (error) {
      console.error('❌ Error during manual cleanup:', error);
    }
  };

  // Force full migration and cleanup (bypasses daily check)
  (window as any).forceTargetCleanup = async () => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.error('No authenticated user found');
        return;
      }

      console.log('🔧 Forcing full migration and cleanup for user:', user.email);
      const result = await forceTargetMigrationAndCleanup(user.id);

      if (result.success) {
        console.log(`✅ Force cleanup complete!`);
        console.log(`   - Migrated: ${result.migratedCount} targets`);
        console.log(`   - Deleted: ${result.deletedCount} expired targets`);
      } else {
        console.error('❌ Force cleanup failed:', result.error);
      }

      return result;
    } catch (error) {
      console.error('❌ Error during force cleanup:', error);
    }
  };

  // Clear localStorage to force next automatic check
  (window as any).resetTargetMigration = () => {
    const keys = Object.keys(localStorage).filter(key =>
      key.includes('targetMigration') || key.includes('migrationLock')
    );
    keys.forEach(key => localStorage.removeItem(key));
    console.log('🔄 Reset migration localStorage keys:', keys);
  };
}

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
