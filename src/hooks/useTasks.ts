import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { checkAndCleanupDuplicates } from '@/utils/taskCleanup';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  quadrant: 'urgent-important' | 'important' | 'urgent' | 'neither';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  due_date?: string;
  estimated_time?: string;
  tags?: string[];
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  quadrant: 'urgent-important' | 'important' | 'urgent' | 'neither';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  dueDate?: string;
  estimatedTime?: string;
  tags?: string[];
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  quadrant?: 'urgent-important' | 'important' | 'urgent' | 'neither';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  due_date?: string;
  estimated_time?: string;
  tags?: string[];
  completed?: boolean;
}

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch all tasks for the current user
  const fetchTasks = async () => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setTasks(data || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
      toast({
        title: "Error",
        description: "Failed to load tasks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Create a new task
  const createTask = async (taskData: CreateTaskData): Promise<Task | null> => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create tasks.",
        variant: "destructive",
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([
          {
            title: taskData.title,
            description: taskData.description,
            quadrant: taskData.quadrant,
            priority: taskData.priority,
            due_date: taskData.dueDate,
            estimated_time: taskData.estimatedTime,
            tags: taskData.tags,
            user_id: user.id,
            completed: false,
          }
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      const newTask = data as Task;
      setTasks(prev => [newTask, ...prev]);
      
      toast({
        title: "Success",
        description: "Task created successfully!",
      });

      return newTask;
    } catch (err) {
      console.error('Error creating task:', err);
      setError(err instanceof Error ? err.message : 'Failed to create task');
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Update an existing task
  const updateTask = async (taskId: string, updates: UpdateTaskData): Promise<Task | null> => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to update tasks.",
        variant: "destructive",
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const updatedTask = data as Task;
      setTasks(prev => prev.map(task => 
        task.id === taskId ? updatedTask : task
      ));

      return updatedTask;
    } catch (err) {
      console.error('Error updating task:', err);
      setError(err instanceof Error ? err.message : 'Failed to update task');
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Delete a task
  const deleteTask = async (taskId: string): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to delete tasks.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      setTasks(prev => prev.filter(task => task.id !== taskId));
      
      toast({
        title: "Success",
        description: "Task deleted successfully!",
      });

      return true;
    } catch (err) {
      console.error('Error deleting task:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete task');
      toast({
        title: "Error",
        description: "Failed to delete task. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Toggle task completion
  const toggleTaskCompletion = async (taskId: string): Promise<Task | null> => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return null;

    return updateTask(taskId, { completed: !task.completed });
  };

  // Get tasks by quadrant
  const getTasksByQuadrant = (quadrant: Task['quadrant']) => {
    return tasks.filter(task => task.quadrant === quadrant);
  };

  // Get today's tasks (all tasks from today, including completed ones)
  const getTodaysTasks = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return tasks.filter(task => {
      const taskDate = new Date(task.created_at);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === today.getTime();
    });
  };

  // Get completed tasks
  const getCompletedTasks = () => {
    return tasks.filter(task => task.completed);
  };

  // Delete tasks from previous days (not just 24 hours old)
  const deleteOldTasks = async () => {
    if (!user) return;

    try {
      // Get start of today in user's local timezone
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      console.log('Deleting tasks created before:', today.toISOString());

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('user_id', user.id)
        .lt('created_at', today.toISOString());

      if (error) {
        throw error;
      }

      console.log('Old tasks deleted successfully');
      // Refresh tasks after deletion
      await fetchTasks();
    } catch (err) {
      console.error('Error deleting old tasks:', err);
    }
  };

  // Check and delete old tasks once per day
  const checkAndDeleteOldTasks = async () => {
    if (!user) return;

    try {
      const lastCleanupKey = `lastTaskCleanup_${user.id}`;
      const lastCleanup = localStorage.getItem(lastCleanupKey);
      const currentDate = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format

      // Only cleanup once per day
      if (lastCleanup !== currentDate) {
        console.log('Performing daily task cleanup...');

        // Clean up duplicates first, then old tasks
        await checkAndCleanupDuplicates(user.id);
        await deleteOldTasks();

        localStorage.setItem(lastCleanupKey, currentDate);
      }
    } catch (error) {
      console.error('Error in automatic task cleanup:', error);
    }
  };

  // Load tasks when user changes and delete old tasks
  useEffect(() => {
    if (user) {
      checkAndDeleteOldTasks();
      fetchTasks();
    } else {
      fetchTasks();
    }
  }, [user]);

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    getTasksByQuadrant,
    getTodaysTasks,
    getCompletedTasks,
  };
};
