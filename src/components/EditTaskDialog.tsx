import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Edit, Loader2, Calendar, Clock, Tag, AlertCircle, Star, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { useTasks, UpdateTaskData, Task } from '@/hooks/useTasks';

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

interface EditTaskDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskUpdated?: () => void;
}

const EditTaskDialog: React.FC<EditTaskDialogProps> = ({ 
  task,
  open,
  onOpenChange,
  onTaskUpdated 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { updateTask } = useTasks();

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      quadrant: 'important',
      priority: 'medium',
      dueDate: '',
      estimatedTime: '',
      tags: '',
    },
  });

  // Update form values when task changes
  useEffect(() => {
    if (task) {
      form.reset({
        title: task.title || '',
        description: task.description || '',
        quadrant: task.quadrant,
        priority: task.priority || 'medium',
        dueDate: task.due_date || '',
        estimatedTime: task.estimated_time || '',
        tags: task.tags ? task.tags.join(', ') : '',
      });
    }
  }, [task, form]);

  const onSubmit = async (data: TaskFormData) => {
    if (!task) return;
    
    setIsLoading(true);
    try {
      const updateData: UpdateTaskData = {
        title: data.title,
        description: data.description || undefined,
        quadrant: data.quadrant,
        priority: data.priority,
        due_date: data.dueDate || undefined,
        estimated_time: data.estimatedTime || undefined,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : undefined,
      };

      const updatedTask = await updateTask(task.id, updateData);
      
      if (updatedTask) {
        onOpenChange(false);
        onTaskUpdated?.();
      }
    } catch (error) {
      console.error('Error updating task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getQuadrantLabel = (quadrant: string) => {
    switch (quadrant) {
      case 'urgent-important': return 'DO NOW (Urgent & Important)';
      case 'important': return 'SCHEDULE (Important, Not Urgent)';
      case 'urgent': return 'DELEGATE (Urgent, Not Important)';
      case 'neither': return 'DELETE (Neither Urgent nor Important)';
      default: return quadrant;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'high': return <Zap className="h-4 w-4 text-orange-500" />;
      case 'medium': return <Star className="h-4 w-4 text-yellow-500" />;
      case 'low': return <Clock className="h-4 w-4 text-green-500" />;
      default: return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto glass border-white/10">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            ✏️ Edit Task
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-base">
            Update your task details and reassign it to the appropriate quadrant in your Eisenhower Matrix.
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
                    <FormLabel className="text-base font-semibold">⚡ Priority Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger className="bg-slate-800/50 border-slate-600 h-12">
                          <SelectValue placeholder="Select priority">
                            {field.value && (
                              <div className="flex items-center gap-2">
                                {getPriorityIcon(field.value)}
                                <span className="capitalize">{field.value}</span>
                              </div>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-green-500" />
                            <span>Low Priority</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="medium">
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span>Medium Priority</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="high">
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-orange-500" />
                            <span>High Priority</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="critical">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-red-500" />
                            <span>Critical Priority</span>
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
                      Due Date
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
                      Tags
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="work, urgent, meeting (comma-separated)"
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
                    <SelectContent>
                      <SelectItem value="urgent-important">
                        <div className="flex flex-col items-start py-2">
                          <span className="font-medium text-red-400">DO NOW</span>
                          <span className="text-xs text-muted-foreground">Urgent & Important</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="important">
                        <div className="flex flex-col items-start py-2">
                          <span className="font-medium text-purple-400">SCHEDULE</span>
                          <span className="text-xs text-muted-foreground">Important, Not Urgent</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="urgent">
                        <div className="flex flex-col items-start py-2">
                          <span className="font-medium text-orange-400">DELEGATE</span>
                          <span className="text-xs text-muted-foreground">Urgent, Not Important</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="neither">
                        <div className="flex flex-col items-start py-2">
                          <span className="font-medium text-gray-400">DELETE</span>
                          <span className="text-xs text-muted-foreground">Neither Urgent nor Important</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 pt-4 border-t border-slate-700/50">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                className="border-slate-600 hover:bg-slate-700/50 h-9 px-4"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 h-9 px-4 font-medium"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Edit className="mr-2 h-4 w-4" />
                    Update Task
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

export default EditTaskDialog;
