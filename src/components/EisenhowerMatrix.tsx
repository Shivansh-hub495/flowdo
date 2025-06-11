
import React, { useState } from 'react';
import { Plus, Play, Edit, Trash2, AlertCircle, Star, Zap, Clock, Tag, Calendar, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { cn } from '@/lib/utils';
import { useTasks, Task } from '@/hooks/useTasks';
import { useToast } from '@/hooks/use-toast';
import AddTaskDialog from '@/components/AddTaskDialog';
import EditTaskDialog from '@/components/EditTaskDialog';

interface EisenhowerMatrixProps {
  onStartPomodoro: (task: Task) => void;
}

const EisenhowerMatrix: React.FC<EisenhowerMatrixProps> = ({ onStartPomodoro }) => {
  const { tasks, loading, deleteTask, getTasksByQuadrant, toggleTaskCompletion, fetchTasks } = useTasks();
  const { toast } = useToast();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleTaskCreated = async () => {
    // Force refresh the tasks data
    await fetchTasks();
  };

  const quadrants = [
    {
      id: 'urgent-important',
      title: 'DO NOW',
      subtitle: 'Urgent & Important',
      color: 'bg-red-500/20 border-red-500/50',
      textColor: 'text-red-400',
    },
    {
      id: 'important',
      title: 'SCHEDULE',
      subtitle: 'Important, Not Urgent',
      color: 'bg-purple-500/20 border-purple-500/50',
      textColor: 'text-purple-400',
    },
    {
      id: 'urgent',
      title: 'DELEGATE',
      subtitle: 'Urgent, Not Important',
      color: 'bg-orange-500/20 border-orange-500/50',
      textColor: 'text-orange-400',
    },
    {
      id: 'neither',
      title: 'DELETE',
      subtitle: 'Neither Urgent nor Important',
      color: 'bg-gray-500/20 border-gray-500/50',
      textColor: 'text-gray-400',
    },
  ];

  const handleDeleteTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const success = await deleteTask(taskId);
      if (success) {
        toast({
          title: "Task deleted",
          description: `"${task.title}" has been deleted`,
        });
      }
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setEditDialogOpen(true);
  };

  const handleTaskUpdated = () => {
    toast({
      title: "Task updated",
      description: "Task has been updated successfully",
    });
  };

  const handleToggleTaskComplete = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const updatedTask = await toggleTaskCompletion(taskId);
      if (updatedTask) {
        toast({
          title: updatedTask.completed ? "Task completed!" : "Task reopened",
          description: `"${updatedTask.title}" ${updatedTask.completed ? 'marked as complete' : 'has been reopened'}`,
        });
      }
    }
  };

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case 'critical': return <AlertCircle className="h-3 w-3 text-red-500" />;
      case 'high': return <Zap className="h-3 w-3 text-orange-500" />;
      case 'medium': return <Star className="h-3 w-3 text-yellow-500" />;
      case 'low': return <Clock className="h-3 w-3 text-green-500" />;
      default: return null;
    }
  };

  const TaskCard: React.FC<{ task: Task }> = ({ task }) => {
    return (
      <div className="glass p-4 rounded-lg border hover:glow transition-all duration-200 group">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-start gap-3 flex-1">
            {/* Completion Checkbox */}
            <button
              className={`mt-0.5 transition-all duration-200 ${
                task.completed
                  ? 'text-green-400 hover:text-green-300'
                  : 'text-slate-400 hover:text-white'
              }`}
              onClick={() => handleToggleTaskComplete(task.id)}
            >
              {task.completed ? (
                <CheckCircle size={16} className="text-green-400" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-current hover:border-violet-400 transition-colors" />
              )}
            </button>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className={`font-medium text-sm leading-tight transition-all duration-200 ${
                  task.completed
                    ? 'line-through text-slate-500'
                    : 'text-white'
                }`}>{task.title}</h4>
                {task.priority && (
                  <div
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                      task.priority === 'critical'
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : task.priority === 'high'
                          ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                          : task.priority === 'medium'
                            ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                            : 'bg-green-500/10 text-green-400 border border-green-500/20'
                    }`}
                  >
                    {getPriorityIcon(task.priority)}
                    <span className="capitalize">{task.priority}</span>
                  </div>
                )}
              </div>
              {task.description && (
                <p className={`text-xs mb-2 transition-all duration-200 ${
                  task.completed
                    ? 'line-through text-slate-500'
                    : 'text-muted-foreground'
                }`}>{task.description}</p>
              )}

              {/* Tags */}
              {task.tags && task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {task.tags.map((tag, index) => (
                    <div
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-700/30 text-slate-300 border border-slate-600/30 hover:bg-slate-700/50 transition-all duration-200"
                    >
                      <Tag className="h-2 w-2" />
                      {tag}
                    </div>
                  ))}
                </div>
              )}

              {/* Metadata */}
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock size={10} className="mr-1" />
                    {new Date(task.created_at).toLocaleDateString()}
                  </div>
                  {task.estimated_time && (
                    <div className="flex items-center">
                      <Clock size={10} className="mr-1" />
                      {task.estimated_time}
                    </div>
                  )}
                </div>
                {task.due_date && (
                  <div className={`flex items-center ${
                    new Date(task.due_date) < new Date() ? 'text-red-400' : 'text-muted-foreground'
                  }`}>
                    <Calendar size={10} className="mr-1" />
                    Due: {new Date(task.due_date).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 hover:bg-violet-500/20"
              onClick={() => onStartPomodoro(task)}
            >
              <Play size={12} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 hover:bg-blue-500/20"
              onClick={() => handleEditTask(task)}
            >
              <Edit size={12} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 hover:bg-red-500/20"
              onClick={() => handleDeleteTask(task.id)}
            >
              <Trash2 size={12} />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">Eisenhower Matrix</h1>
          <p className="text-muted-foreground">Do what matters. Dump the rest.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[calc(100vh-300px)]">
          {quadrants.map((quadrant) => {
            const quadrantTasks = getTasksByQuadrant(quadrant.id as Task['quadrant']);
            
            return (
              <Card key={quadrant.id} className={cn("flex flex-col", quadrant.color)}>
                <CardHeader className="pb-3">
                  <CardTitle className={cn("text-sm font-bold", quadrant.textColor)}>
                    {quadrant.title}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">{quadrant.subtitle}</p>
                </CardHeader>
                <CardContent className="flex-1 space-y-3">
                  {loading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                      <p className="text-xs text-muted-foreground mt-2">Loading...</p>
                    </div>
                  ) : (
                    quadrantTasks.map((task) => (
                      <TaskCard key={task.id} task={task} />
                    ))
                  )}
                  <AddTaskDialog
                    defaultQuadrant={quadrant.id as Task['quadrant']}
                    onTaskCreated={handleTaskCreated}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full border-2 border-dashed border-muted-foreground/30 h-12"
                    >
                      <Plus size={16} className="mr-2" />
                      Add Task
                    </Button>
                  </AddTaskDialog>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Edit Task Dialog */}
        <EditTaskDialog
          task={editingTask}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onTaskUpdated={handleTaskUpdated}
        />
      </div>
    </div>
  );
};

export default EisenhowerMatrix;
