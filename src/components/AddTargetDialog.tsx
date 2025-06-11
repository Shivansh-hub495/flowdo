import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Loader2, Calendar, Clock, Target, Tag, AlertCircle, Star, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useTargets, CreateTargetData } from '@/hooks/useTargets';

const targetSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  quadrant: z.enum(['urgent-important', 'important', 'urgent', 'neither']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  dueDate: z.string().optional(),
  estimatedTime: z.string().optional(),
  tags: z.string().optional(),
  notes: z.string().optional(),
});

type TargetFormData = z.infer<typeof targetSchema>;

interface AddTargetDialogProps {
  children?: React.ReactNode;
  targetType: 'tomorrow' | 'week' | 'month' | 'year';
  onTargetCreated?: () => void;
}

const AddTargetDialog: React.FC<AddTargetDialogProps> = ({ 
  children, 
  targetType,
  onTargetCreated 
}) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { createTarget } = useTargets();

  const form = useForm<TargetFormData>({
    resolver: zodResolver(targetSchema),
    defaultValues: {
      title: '',
      description: '',
      quadrant: targetType === 'tomorrow' ? 'important' : undefined,
      priority: targetType === 'tomorrow' ? 'medium' : undefined,
      dueDate: '',
      estimatedTime: '',
      tags: '',
      notes: '',
    },
  });

  const getTargetDate = (type: 'tomorrow' | 'week' | 'month' | 'year'): string => {
    const date = new Date();

    switch (type) {
      case 'tomorrow':
        // Tomorrow's date
        date.setDate(date.getDate() + 1);
        break;
      case 'week':
        // End of current week (Sunday)
        const daysUntilSunday = 7 - date.getDay();
        date.setDate(date.getDate() + daysUntilSunday);
        break;
      case 'month':
        // Last day of current month
        date.setMonth(date.getMonth() + 1, 0); // Set to last day of current month
        break;
      case 'year':
        // Last day of current year (December 31st)
        date.setMonth(11, 31); // December 31st of current year
        break;
    }

    return date.toISOString().split('T')[0];
  };

  const getTargetTypeLabel = (type: 'tomorrow' | 'week' | 'month' | 'year'): string => {
    switch (type) {
      case 'tomorrow':
        return 'Tomorrow';
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      case 'year':
        return 'This Year';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'text-green-400';
      case 'medium':
        return 'text-yellow-400';
      case 'high':
        return 'text-orange-400';
      case 'critical':
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'low':
        return <Star className="h-4 w-4" />;
      case 'medium':
        return <AlertCircle className="h-4 w-4" />;
      case 'high':
        return <Zap className="h-4 w-4" />;
      case 'critical':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Star className="h-4 w-4" />;
    }
  };

  const getQuadrantLabel = (quadrant: string) => {
    switch (quadrant) {
      case 'urgent-important':
        return 'Urgent & Important (Do First)';
      case 'important':
        return 'Important, Not Urgent (Schedule)';
      case 'urgent':
        return 'Urgent, Not Important (Delegate)';
      case 'neither':
        return 'Neither Urgent nor Important (Eliminate)';
      default:
        return '';
    }
  };

  const onSubmit = async (data: TargetFormData) => {
    setIsLoading(true);
    try {
      const targetData: CreateTargetData = {
        title: data.title,
        description: data.description || undefined,
        target_type: targetType,
        target_date: getTargetDate(targetType),
        quadrant: data.quadrant,
        priority: data.priority,
        due_date: data.dueDate || undefined,
        estimated_time: data.estimatedTime || undefined,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : undefined,
        notes: data.notes || undefined,
      };

      const newTarget = await createTarget(targetData);

      if (newTarget) {
        form.reset();
        setOpen(false);
        onTargetCreated?.();
      }
    } catch (error) {
      console.error('Error creating target:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) {
        resetForm();
      }
    }}>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm" variant="outline" className="border-slate-600 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white">
            <Plus size={14} className="mr-1" />
            Add Target
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900/95 to-slate-950/95 border border-slate-700/50 backdrop-blur-xl">
        <DialogHeader className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/20">
              <Target className="text-violet-400" size={20} />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-white">
                Add {getTargetTypeLabel(targetType)} Target
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Create a new target for {getTargetTypeLabel(targetType).toLowerCase()}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300 font-medium flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Title
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter target title..."
                      {...field}
                      disabled={isLoading}
                      className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/20 h-10"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300 font-medium">Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add more details about your target..."
                      {...field}
                      disabled={isLoading}
                      className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/20 min-h-[80px] resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {targetType === 'tomorrow' && (
              <>
                {/* Priority and Due Date Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300 font-medium flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          Priority Level
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                          <FormControl>
                            <SelectTrigger className="bg-slate-800/50 border-slate-600 h-10">
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
                          <SelectContent>
                            <SelectItem value="low">
                              <div className="flex items-center gap-2 text-green-500">
                                <Star className="h-4 w-4" />
                                <span className="font-medium">Low Priority</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="medium">
                              <div className="flex items-center gap-2 text-yellow-500">
                                <AlertCircle className="h-4 w-4" />
                                <span className="font-medium">Medium Priority</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="high">
                              <div className="flex items-center gap-2 text-orange-500">
                                <Zap className="h-4 w-4" />
                                <span className="font-medium">High Priority</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="critical">
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
                        <FormLabel className="text-slate-300 font-medium flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Due Date (Optional)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            disabled={isLoading}
                            className="bg-slate-800/50 border-slate-600 h-10"
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
                        <FormLabel className="text-slate-300 font-medium flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Estimated Time
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., 2 hours, 30 mins"
                            {...field}
                            disabled={isLoading}
                            className="bg-slate-800/50 border-slate-600 h-10"
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
                        <FormLabel className="text-slate-300 font-medium flex items-center gap-2">
                          <Tag className="h-4 w-4" />
                          Tags (Optional)
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="work, urgent, meeting (comma separated)"
                            {...field}
                            disabled={isLoading}
                            className="bg-slate-800/50 border-slate-600 h-10"
                          />
                        </FormControl>
                        <p className="text-xs text-slate-500">Separate tags with commas</p>
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
                      <FormLabel className="text-slate-300 font-medium">🎯 Eisenhower Matrix Quadrant</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                        <FormControl>
                          <SelectTrigger className="bg-slate-800/50 border-slate-600 h-14">
                            <SelectValue placeholder="Select a quadrant">
                              {field.value && (
                                <div className="flex flex-col items-start">
                                  <span className="font-medium">
                                    {getQuadrantLabel(field.value).split(' (')[0]}
                                  </span>
                                  <span className="text-xs text-slate-400">
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
                              <span className="font-medium text-red-400">Urgent & Important</span>
                              <span className="text-xs text-slate-400">Do First - Crisis & Emergencies</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="important">
                            <div className="flex flex-col items-start py-2">
                              <span className="font-medium text-blue-400">Important, Not Urgent</span>
                              <span className="text-xs text-slate-400">Schedule - Goals & Planning</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="urgent">
                            <div className="flex flex-col items-start py-2">
                              <span className="font-medium text-yellow-400">Urgent, Not Important</span>
                              <span className="text-xs text-slate-400">Delegate - Interruptions & Distractions</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="neither">
                            <div className="flex flex-col items-start py-2">
                              <span className="font-medium text-gray-400">Neither Urgent nor Important</span>
                              <span className="text-xs text-slate-400">Eliminate - Time Wasters</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300 font-medium">Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Additional notes or context..."
                          {...field}
                          disabled={isLoading}
                          className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/20 min-h-[60px] resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
              <div className="flex items-center space-x-2 text-sm text-slate-400">
                <Calendar size={16} />
                <span>Target Date: {new Date(getTargetDate(targetType)).toLocaleDateString()}</span>
              </div>
            </div>

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
                    Create Target
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

export default AddTargetDialog;
