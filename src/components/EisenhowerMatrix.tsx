
import React, { useState } from 'react';
import { Plus, Play, Edit, Trash2, AlertCircle, Star, Zap, Clock, Tag, Calendar, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { cn } from '@/lib/utils';
import { useTasks, Task } from '@/hooks/useTasks';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import AddTaskDialog from '@/components/AddTaskDialog';
import EditTaskDialog from '@/components/EditTaskDialog';

interface EisenhowerMatrixProps {
  onStartPomodoro: (task: Task) => void;
}

const EisenhowerMatrix: React.FC<EisenhowerMatrixProps> = ({ onStartPomodoro }) => {
  const { tasks, loading, deleteTask, getTasksByQuadrant, toggleTaskCompletion, fetchTasks } = useTasks();
  const { toast } = useToast();
  const isMobile = useIsMobile();
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

  const handleTaskUpdated = async () => {
    // Force refresh the tasks data
    await fetchTasks();
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
      <div className={cn(
        "glass rounded-lg border hover:glow transition-all duration-200 group",
        "p-3 md:p-4",
        isMobile ? "matrix-task-card-mobile" : ""
      )}>
        <div className="flex justify-between items-start mb-2 md:mb-3">
          <div className="flex items-start gap-2 md:gap-3 flex-1">
            {/* Completion Checkbox */}
            <button
              className={cn(
                "mt-0.5 transition-all duration-200 touch-manipulation",
                isMobile ? "min-w-[32px] min-h-[32px] flex items-center justify-center" : "",
                task.completed
                  ? 'text-green-400 hover:text-green-300'
                  : 'text-slate-400 hover:text-white'
              )}
              onClick={() => handleToggleTaskComplete(task.id)}
            >
              {task.completed ? (
                <CheckCircle size={isMobile ? 16 : 14} className="text-green-400" />
              ) : (
                <div className={cn(
                  "rounded-full border-2 border-current hover:border-violet-400 transition-colors",
                  isMobile ? "w-4 h-4" : "w-3.5 h-3.5 md:w-4 md:h-4"
                )} />
              )}
            </button>

            <div className="flex-1 min-w-0">
              <div className={cn(
                "flex items-start gap-1 md:gap-2 mb-1",
                isMobile ? "flex-col" : "flex-col md:flex-row md:items-center"
              )}>
                <h4 className={cn(
                  "font-medium leading-tight transition-all duration-200",
                  isMobile ? "text-sm" : "text-xs md:text-sm",
                  task.completed
                    ? 'line-through text-slate-500'
                    : 'text-white'
                )}>{task.title}</h4>
                {task.priority && (
                  <div
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full font-medium transition-all duration-200",
                      isMobile ? "px-2 py-1 text-xs" : "px-1.5 md:px-2 py-0.5 md:py-1 text-xs",
                      task.priority === 'critical'
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : task.priority === 'high'
                          ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                          : task.priority === 'medium'
                            ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                            : 'bg-green-500/10 text-green-400 border border-green-500/20'
                    )}
                  >
                    {getPriorityIcon(task.priority)}
                    <span className="capitalize text-xs">{task.priority}</span>
                  </div>
                )}
              </div>
              {task.description && (
                <p className={cn(
                  "mb-1 md:mb-2 transition-all duration-200 line-clamp-2",
                  isMobile ? "text-sm leading-relaxed pr-2" : "text-xs",
                  task.completed
                    ? 'line-through text-slate-500'
                    : 'text-muted-foreground'
                )}>{task.description}</p>
              )}

              {/* Tags */}
              {task.tags && task.tags.length > 0 && (
                <div className={cn(
                  "flex flex-wrap gap-1 mb-1 md:mb-2",
                  isMobile ? "matrix-tags-mobile" : ""
                )}>
                  {task.tags.slice(0, isMobile ? 1 : 2).map((tag, index) => (
                    <div
                      key={index}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full font-medium bg-slate-700/30 text-slate-300 border border-slate-600/30 hover:bg-slate-700/50 transition-all duration-200",
                        isMobile ? "px-2 py-1 text-xs" : "px-1.5 md:px-2 py-0.5 text-xs"
                      )}
                    >
                      <Tag className={isMobile ? "h-3 w-3" : "h-2 w-2"} />
                      <span className={cn("truncate", isMobile ? "max-w-20" : "max-w-16")}>{tag}</span>
                    </div>
                  ))}
                  {task.tags.length > (isMobile ? 1 : 2) && (
                    <div className={cn(
                      "inline-flex items-center rounded-full font-medium bg-slate-700/30 text-slate-400 border border-slate-600/30",
                      isMobile ? "px-2 py-1 text-xs" : "px-1.5 py-0.5 text-xs"
                    )}>
                      +{task.tags.length - (isMobile ? 1 : 2)}
                    </div>
                  )}
                </div>
              )}

              {/* Metadata */}
              <div className={cn(
                "text-muted-foreground space-y-0.5 md:space-y-1",
                isMobile ? "text-xs matrix-metadata-mobile" : "text-xs"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock size={isMobile ? 10 : 8} className="mr-1" />
                    <span className="truncate">{new Date(task.created_at).toLocaleDateString()}</span>
                  </div>
                  {task.estimated_time && (
                    <div className="flex items-center">
                      <Clock size={isMobile ? 10 : 8} className="mr-1" />
                      <span className="truncate">{task.estimated_time}</span>
                    </div>
                  )}
                </div>
                {task.due_date && (
                  <div className={cn(
                    "flex items-center",
                    new Date(task.due_date) < new Date() ? 'text-red-400' : 'text-muted-foreground'
                  )}>
                    <Calendar size={isMobile ? 10 : 8} className="mr-1" />
                    <span className="truncate">Due: {new Date(task.due_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={cn(
            "flex transition-opacity",
            isMobile
              ? "flex-col space-y-1 opacity-100 matrix-mobile-button-group-vertical"
              : "flex-col md:flex-row space-y-1 md:space-y-0 md:space-x-1 opacity-100 md:opacity-0 group-hover:opacity-100 ml-1 md:ml-2"
          )}>
            <Button
              size="sm"
              variant="ghost"
              className={cn(
                "p-0 hover:bg-violet-500/20 touch-manipulation",
                isMobile
                  ? "h-8 w-8 min-h-[32px] min-w-[32px]"
                  : "h-6 w-6 md:h-7 md:w-7"
              )}
              onClick={() => onStartPomodoro(task)}
            >
              <Play size={isMobile ? 12 : 10} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className={cn(
                "p-0 hover:bg-blue-500/20 touch-manipulation",
                isMobile
                  ? "h-8 w-8 min-h-[32px] min-w-[32px]"
                  : "h-6 w-6 md:h-7 md:w-7"
              )}
              onClick={() => handleEditTask(task)}
            >
              <Edit size={isMobile ? 12 : 10} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className={cn(
                "p-0 hover:bg-red-500/20 touch-manipulation",
                isMobile
                  ? "h-8 w-8 min-h-[32px] min-w-[32px]"
                  : "h-6 w-6 md:h-7 md:w-7"
              )}
              onClick={() => handleDeleteTask(task.id)}
            >
              <Trash2 size={isMobile ? 12 : 10} />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={cn(
      "p-3 md:p-6",
      isMobile ? "matrix-mobile-container" : ""
    )}>
      <div className="max-w-4xl mx-auto">
        <div className={cn(
          "text-center mb-4 md:mb-6",
          isMobile ? "matrix-header-mobile" : ""
        )}>
          <h1 className={cn(
            "font-bold mb-2",
            isMobile ? "text-xl" : "text-xl md:text-2xl"
          )}>Eisenhower Matrix</h1>
          <p className={cn(
            "text-muted-foreground",
            isMobile ? "text-sm" : "text-sm md:text-base"
          )}>Do what matters. Dump the rest.</p>
        </div>

        <div className={cn(
          "grid gap-3 md:gap-4",
          isMobile
            ? "grid-cols-1 matrix-grid-mobile min-h-[calc(100vh-200px)]"
            : "grid-cols-1 md:grid-cols-2 min-h-[calc(100vh-250px)] md:min-h-[calc(100vh-300px)]"
        )}>
          {quadrants.map((quadrant) => {
            const quadrantTasks = getTasksByQuadrant(quadrant.id as Task['quadrant']);

            return (
              <Card key={quadrant.id} className={cn(
                "flex flex-col",
                quadrant.color,
                isMobile ? "matrix-quadrant-mobile" : ""
              )}>
                <CardHeader className={cn(
                  "pb-2 md:pb-3",
                  isMobile ? "matrix-quadrant-header-mobile" : ""
                )}>
                  <CardTitle className={cn(
                    "font-bold",
                    isMobile ? "text-sm" : "text-xs md:text-sm",
                    quadrant.textColor
                  )}>
                    {quadrant.title}
                  </CardTitle>
                  <p className={cn(
                    "text-muted-foreground",
                    isMobile ? "text-xs" : "text-xs"
                  )}>{quadrant.subtitle}</p>
                </CardHeader>
                <CardContent className={cn(
                  "flex-1",
                  isMobile ? "space-y-3 matrix-quadrant-content-mobile" : "space-y-2 md:space-y-3"
                )}>
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
                      className={cn(
                        "w-full border-2 border-dashed border-muted-foreground/30 touch-manipulation",
                        isMobile
                          ? "h-12 text-sm matrix-add-button-mobile"
                          : "h-10 md:h-12 text-xs md:text-sm"
                      )}
                    >
                      <Plus size={isMobile ? 16 : 14} className={isMobile ? "mr-2" : "mr-1 md:mr-2"} />
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
