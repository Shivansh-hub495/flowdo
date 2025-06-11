import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Loader2, Calendar, Clock, Tag, AlertCircle, Star, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { useTasks, CreateTaskData } from '@/hooks/useTasks';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  quadrant: z.enum(['urgent-important', 'important', 'urgent', 'neither'], {
    required_error: 'Please select a quadrant',
  }),
  priority: z.enum(['low', 'medium', 'high', 'critical'], {
    required_error: 'Please select a priority',
  }),
  dueDate: z.string().optional(),
  estimatedTime: z.string().optional(),
  tags: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface AddTaskDialogProps {
  children?: React.ReactNode;
  defaultQuadrant?: 'urgent-important' | 'important' | 'urgent' | 'neither';
  onTaskCreated?: () => void;
}

const AddTaskDialog: React.FC<AddTaskDialogProps> = ({ 
  children, 
  defaultQuadrant,
  onTaskCreated 
}) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { createTask } = useTasks();

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      quadrant: defaultQuadrant || 'important',
      priority: 'medium',
      dueDate: '',
      estimatedTime: '',
      tags: '',
    },
  });

  const onSubmit = async (data: TaskFormData) => {
    setIsLoading(true);
    try {
      const taskData: CreateTaskData = {
        title: data.title,
        description: data.description || undefined,
        quadrant: data.quadrant,
        priority: data.priority,
        dueDate: data.dueDate || undefined,
        estimatedTime: data.estimatedTime || undefined,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : undefined,
      };

      const newTask = await createTask(taskData);
      
      if (newTask) {
        form.reset();
        setOpen(false);
        onTaskCreated?.();
      }
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getQuadrantLabel = (quadrant: string) => {
    switch (quadrant) {
      case 'urgent-important':
        return 'Urgent & Important (Do First)';
      case 'important':
        return 'Important (Schedule)';
      case 'urgent':
        return 'Urgent (Delegate)';
      case 'neither':
        return 'Neither (Eliminate)';
      default:
        return quadrant;
    }
  };

  const getQuadrantDescription = (quadrant: string) => {
    switch (quadrant) {
      case 'urgent-important':
        return 'Critical tasks that need immediate attention';
      case 'important':
        return 'Important tasks that can be planned and scheduled';
      case 'urgent':
        return 'Tasks that are urgent but not necessarily important';
      case 'neither':
        return 'Tasks that are neither urgent nor important';
      default:
        return '';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <AlertCircle className="h-4 w-4" />;
      case 'high': return <Zap className="h-4 w-4" />;
      case 'medium': return <Star className="h-4 w-4" />;
      case 'low': return <Clock className="h-4 w-4" />;
      default: return null;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm" variant="outline" className="border-slate-600 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white">
            <Plus size={14} className="mr-1" />
            Add Task
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto glass border-white/10">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
            ✨ Add New Task
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-base">
            Create a new task with detailed information and assign it to the appropriate quadrant in your Eisenhower Matrix.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Task Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Task Title
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter a clear, actionable task title..."
                      {...field}
                      disabled={isLoading}
                      className="bg-slate-800/50 border-slate-600 h-12 text-base"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add more details, context, or notes about this task..."
                      {...field}
                      disabled={isLoading}
                      className="bg-slate-800/50 border-slate-600 min-h-[100px] text-base"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Priority and Due Date Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Priority Level
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger className="bg-slate-800/50 border-slate-600 h-12">
                          <SelectValue placeholder="Select priority">
                            {field.value && (
                              <div className={`flex items-center gap-2 ${getPriorityColor(field.value)}`}>
                                {getPriorityIcon(field.value)}
                                <span className="font-medium capitalize">{field.value}</span>
                              </div>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="glass border-white/10">
                        <SelectItem value="low" className="py-3">
                          <div className="flex items-center gap-2 text-green-500">
                            <Clock className="h-4 w-4" />
                            <span className="font-medium">Low Priority</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="medium" className="py-3">
                          <div className="flex items-center gap-2 text-yellow-500">
                            <Star className="h-4 w-4" />
                            <span className="font-medium">Medium Priority</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="high" className="py-3">
                          <div className="flex items-center gap-2 text-orange-500">
                            <Zap className="h-4 w-4" />
                            <span className="font-medium">High Priority</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="critical" className="py-3">
                          <div className="flex items-center gap-2 text-red-500">
                            <AlertCircle className="h-4 w-4" />
                            <span className="font-medium">Critical Priority</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Due Date (Optional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        disabled={isLoading}
                        className="bg-slate-800/50 border-slate-600 h-12"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Estimated Time and Tags Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="estimatedTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Estimated Time
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., 2 hours, 30 mins"
                        {...field}
                        disabled={isLoading}
                        className="bg-slate-800/50 border-slate-600 h-12"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Tags (Optional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="work, urgent, meeting (comma separated)"
                        {...field}
                        disabled={isLoading}
                        className="bg-slate-800/50 border-slate-600 h-12"
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">Separate tags with commas</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Eisenhower Matrix Quadrant */}
            <FormField
              control={form.control}
              name="quadrant"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">🎯 Eisenhower Matrix Quadrant</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger className="bg-slate-800/50 border-slate-600 h-14">
                        <SelectValue placeholder="Select a quadrant">
                          {field.value && (
                            <div className="flex flex-col items-start">
                              <span className="font-medium">
                                {getQuadrantLabel(field.value).split(' (')[0]}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {getQuadrantLabel(field.value).split(' (')[1]?.replace(')', '')}
                              </span>
                            </div>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="glass border-white/10">
                      <SelectItem value="urgent-important" className="py-4">
                        <div className="flex flex-col items-start gap-1">
                          <span className="font-medium text-red-400 text-base">🔥 Urgent & Important</span>
                          <span className="text-sm text-muted-foreground">Do First - Critical tasks that need immediate attention</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="important" className="py-4">
                        <div className="flex flex-col items-start gap-1">
                          <span className="font-medium text-blue-400 text-base">📅 Important</span>
                          <span className="text-sm text-muted-foreground">Schedule - Plan these important tasks</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="urgent" className="py-4">
                        <div className="flex flex-col items-start gap-1">
                          <span className="font-medium text-yellow-400 text-base">⚡ Urgent</span>
                          <span className="text-sm text-muted-foreground">Delegate - Urgent but not necessarily important</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="neither" className="py-4">
                        <div className="flex flex-col items-start gap-1">
                          <span className="font-medium text-gray-400 text-base">🗑️ Neither</span>
                          <span className="text-sm text-muted-foreground">Eliminate - Low priority tasks</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {form.watch('quadrant') && (
                    <div className="mt-2 p-3 rounded-lg bg-slate-800/30 border border-slate-700/50">
                      <p className="text-sm text-muted-foreground">
                        💡 {getQuadrantDescription(form.watch('quadrant'))}
                      </p>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 pt-4 border-t border-slate-700/50">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
                className="border-slate-600 hover:bg-slate-700/50 h-9 px-4"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 h-9 px-4 font-medium"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Task
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTaskDialog;
