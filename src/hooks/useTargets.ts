import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { checkAndMigrateTargets } from '@/utils/migrateTargets';

export interface Target {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  target_type: 'tomorrow' | 'week' | 'month' | 'year';
  target_date: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
  quadrant?: 'urgent-important' | 'important' | 'urgent' | 'neither';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  due_date?: string;
  estimated_time?: string;
  tags?: string[];
  notes?: string;
}

export interface CreateTargetData {
  title: string;
  description?: string;
  target_type: 'tomorrow' | 'week' | 'month' | 'year';
  target_date: string;
  quadrant?: 'urgent-important' | 'important' | 'urgent' | 'neither';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  due_date?: string;
  estimated_time?: string;
  tags?: string[];
  notes?: string;
}

export interface UpdateTargetData {
  title?: string;
  description?: string;
  completed?: boolean;
  quadrant?: 'urgent-important' | 'important' | 'urgent' | 'neither';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  due_date?: string;
  estimated_time?: string;
  tags?: string[];
  notes?: string;
}

export const useTargets = () => {
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch all targets for the current user
  const fetchTargets = async () => {
    if (!user) {
      setTargets([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('targets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setTargets(data || []);
    } catch (err) {
      console.error('Error fetching targets:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch targets');
      toast({
        title: "Error",
        description: "Failed to load targets. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Create a new target
  const createTarget = async (targetData: CreateTargetData): Promise<Target | null> => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create targets.",
        variant: "destructive",
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('targets')
        .insert([
          {
            title: targetData.title,
            description: targetData.description,
            target_type: targetData.target_type,
            target_date: targetData.target_date,
            quadrant: targetData.quadrant,
            priority: targetData.priority,
            due_date: targetData.due_date,
            estimated_time: targetData.estimated_time,
            tags: targetData.tags,
            notes: targetData.notes,
            user_id: user.id,
            completed: false,
          }
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      const newTarget = data as Target;
      setTargets(prev => [newTarget, ...prev]);

      toast({
        title: "Success",
        description: "Target created successfully!",
      });

      return newTarget;
    } catch (err) {
      console.error('Error creating target:', err);
      toast({
        title: "Error",
        description: "Failed to create target. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Update a target
  const updateTarget = async (targetId: string, updateData: UpdateTargetData): Promise<Target | null> => {
    try {
      const { data, error } = await supabase
        .from('targets')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetId)
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const updatedTarget = data as Target;
      setTargets(prev => prev.map(target => 
        target.id === targetId ? updatedTarget : target
      ));

      return updatedTarget;
    } catch (err) {
      console.error('Error updating target:', err);
      toast({
        title: "Error",
        description: "Failed to update target. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Delete a target
  const deleteTarget = async (targetId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('targets')
        .delete()
        .eq('id', targetId)
        .eq('user_id', user?.id);

      if (error) {
        throw error;
      }

      setTargets(prev => prev.filter(target => target.id !== targetId));
      
      toast({
        title: "Success",
        description: "Target deleted successfully!",
      });

      return true;
    } catch (err) {
      console.error('Error deleting target:', err);
      toast({
        title: "Error",
        description: "Failed to delete target. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Toggle target completion
  const toggleTargetCompletion = async (targetId: string): Promise<Target | null> => {
    const target = targets.find(t => t.id === targetId);
    if (!target) return null;

    return updateTarget(targetId, { completed: !target.completed });
  };

  // Get targets by type
  const getTargetsByType = (type: Target['target_type']) => {
    return targets.filter(target => target.target_type === type);
  };

  // Get tomorrow's targets
  const getTomorrowTargets = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    return targets.filter(target => {
      const targetDate = new Date(target.target_date);
      targetDate.setHours(0, 0, 0, 0);
      return target.target_type === 'tomorrow' && targetDate.getTime() === tomorrow.getTime();
    });
  };

  // Migrate tomorrow targets to tasks
  const migrateTomorrowTargetsToTasks = async () => {
    if (!user) return;

    try {
      // Get user's local date
      const userLocalDate = new Date();
      const userLocalDateString = userLocalDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format

      // Get tomorrow targets that are due today or earlier (should become today's tasks)
      const { data: tomorrowTargets, error: fetchError } = await supabase
        .from('targets')
        .select('*')
        .eq('user_id', user.id)
        .eq('target_type', 'tomorrow')
        .lte('target_date', userLocalDateString);

      if (fetchError) {
        throw fetchError;
      }

      if (tomorrowTargets && tomorrowTargets.length > 0) {
        // Create tasks from tomorrow targets
        const tasksToCreate = tomorrowTargets.map(target => ({
          title: target.title,
          description: target.description,
          quadrant: target.quadrant || 'important' as const, // Use target's quadrant or default to important
          priority: target.priority,
          due_date: target.due_date,
          estimated_time: target.estimated_time,
          tags: target.tags,
          notes: target.notes,
          user_id: user.id,
          completed: false,
        }));

        const { error: insertError } = await supabase
          .from('tasks')
          .insert(tasksToCreate);

        if (insertError) {
          throw insertError;
        }

        // Delete the migrated tomorrow targets
        const targetIds = tomorrowTargets.map(target => target.id);
        const { error: deleteError } = await supabase
          .from('targets')
          .delete()
          .eq('user_id', user.id)
          .in('id', targetIds);

        if (deleteError) {
          throw deleteError;
        }

        // Refresh targets
        await fetchTargets();

        toast({
          title: "Targets Migrated",
          description: `${tomorrowTargets.length} target(s) moved to today's tasks!`,
        });
      }
    } catch (err) {
      console.error('Error migrating tomorrow targets:', err);
    }
  };

  // Load targets when user changes and migrate tomorrow targets
  useEffect(() => {
    if (user) {
      console.log('🎯 TargetsView: Running migration check for user:', user.email);
      // Perform migration check and then fetch targets
      checkAndMigrateTargets(user.id).then((result) => {
        console.log('🎯 TargetsView: Migration result:', result);
        if (result.success) {
          // Show notification for migrated targets
          if (result.migratedCount > 0) {
            toast({
              title: "Targets Migrated",
              description: `${result.migratedCount} target(s) moved to today's tasks!`,
            });
          }

          // Show notification for deleted expired targets
          if (result.deletedCount && result.deletedCount > 0) {
            toast({
              title: "Expired Targets Cleaned",
              description: `${result.deletedCount} expired target(s) automatically removed.`,
              variant: "default",
            });
          }
        }
        // Always fetch targets after migration check
        fetchTargets();
      }).catch((error) => {
        console.error('🎯 TargetsView: Migration failed:', error);
        // Still fetch targets even if migration fails
        fetchTargets();
      });
    } else {
      fetchTargets();
    }
  }, [user]);

  return {
    targets,
    loading,
    error,
    fetchTargets,
    createTarget,
    updateTarget,
    deleteTarget,
    toggleTargetCompletion,
    getTargetsByType,
    getTomorrowTargets,
    migrateTomorrowTargetsToTasks,
  };
};
