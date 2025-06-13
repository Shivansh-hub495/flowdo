
import React from 'react';
import { Calendar, Clock, Play, CheckCircle, Target, TrendingUp, AlertCircle, Star, Zap, Tag, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useTasks, Task } from '@/hooks/useTasks';
import { usePomodoroSessions } from '@/hooks/usePomodoroSessions';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { checkAndMigrateTargets } from '@/utils/migrateTargets';
import AddTaskDialog from '@/components/AddTaskDialog';
import { useIsMobile } from '@/hooks/use-mobile';

interface TodayViewProps {
  onStartPomodoro: (task: Task) => void;
}

const TodayView: React.FC<TodayViewProps> = ({ onStartPomodoro }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { tasks, loading, toggleTaskCompletion, getTodaysTasks, getCompletedTasks, deleteTask, fetchTasks } = useTasks();
  const { getTodaysPomodoroCount, getTodaysFocusTimeFormatted } = usePomodoroSessions();
  const isMobile = useIsMobile();

  const todaysTasks = getTodaysTasks();
  const completedTasks = getCompletedTasks();

  // Note: Migration is now handled in useTargets hook to avoid duplicate calls

  const stats = {
    totalTasks: tasks.length,
    completed: completedTasks.length,
    pomodoroSessions: getTodaysPomodoroCount(),
    focusTime: getTodaysFocusTimeFormatted(),
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

  const handleTaskCreated = async () => {
    // Force refresh the tasks data
    await fetchTasks();
  };



  const startFocusSession = async () => {
    // Get current session token to pass to Clock.html
    const { data: { session } } = await supabase.auth.getSession();
    const authToken = session?.access_token || '';
    const userId = session?.user?.id || '';

    // Navigate to Clock.html with authentication tokens for session recording
    window.location.href = `/Clock.html?token=${authToken}&userId=${userId}`;
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

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'critical': return 'border-red-500/50 bg-red-500/10';
      case 'high': return 'border-orange-500/50 bg-orange-500/10';
      case 'medium': return 'border-yellow-500/50 bg-yellow-500/10';
      case 'low': return 'border-green-500/50 bg-green-500/10';
      default: return 'border-slate-600/50 bg-slate-800/50';
    }
  };

  const getQuadrantColor = (quadrant: string) => {
    switch (quadrant) {
      case 'urgent-important': return 'bg-red-500/20 border-red-500/50 text-red-400';
      case 'important': return 'bg-purple-500/20 border-purple-500/50 text-purple-400';
      case 'urgent': return 'bg-orange-500/20 border-orange-500/50 text-orange-400';
      default: return 'bg-gray-500/20 border-gray-500/50 text-gray-400';
    }
  };

  const getQuadrantLabel = (quadrant: string) => {
    switch (quadrant) {
      case 'urgent-important': return 'DO NOW';
      case 'important': return 'SCHEDULE';
      case 'urgent': return 'DELEGATE';
      default: return 'DELETE';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-violet-950/10">
      <div className={`max-w-4xl mx-auto flex flex-col ${
        isMobile
          ? 'px-3 py-2 mobile-safe-area'
          : 'p-6'
      }`}>
        {/* Header */}
        <div className={`text-center flex-shrink-0 ${isMobile ? 'mb-3' : 'mb-8'}`}>
          <div className={`inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/20 ${
            isMobile ? 'w-10 h-10 mb-2' : 'w-18 h-18 mb-4'
          }`}>
            <Calendar className="text-violet-400" size={isMobile ? 16 : 20} />
          </div>
          <h1 className={`font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent ${
            isMobile ? 'text-xl mb-1' : 'text-4xl mb-2'
          }`}>
            Today's Focus
          </h1>
          <p className={`text-slate-400 ${isMobile ? 'text-sm' : 'text-lg'}`}>
            {new Date().toLocaleDateString('en-US', {
              weekday: isMobile ? 'short' : 'long',
              year: 'numeric',
              month: isMobile ? 'short' : 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        {/* Stats Overview */}
        <div className={`grid flex-shrink-0 ${
          isMobile
            ? 'grid-cols-2 gap-2 mb-3'
            : 'grid-cols-4 gap-6 mb-8'
        }`}>
          <Card className={`group relative overflow-hidden bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50 hover:border-violet-500/30 transition-all duration-300 ${
            isMobile ? 'min-h-[90px] touch-action-manipulation' : 'hover:scale-105'
          }`}>
            <CardContent className={`text-center relative z-10 ${
              isMobile ? 'p-3 py-4' : 'p-6'
            }`}>
              <div className={`inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/20 ${
                isMobile ? 'w-8 h-8 mb-2' : 'w-14 h-14 mb-3'
              }`}>
                <CheckCircle className="text-violet-400" size={isMobile ? 16 : 18} />
              </div>
              <div className={`font-bold text-violet-400 ${
                isMobile ? 'text-xl mb-1' : 'text-4xl mb-1'
              }`}>{stats.completed}</div>
              <div className={`text-slate-400 ${
                isMobile ? 'text-sm' : 'text-base'
              }`}>Completed</div>
            </CardContent>
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Card>

          <Card className={`group relative overflow-hidden bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50 hover:border-blue-500/30 transition-all duration-300 ${
            isMobile ? 'min-h-[90px] touch-action-manipulation' : 'hover:scale-105'
          }`}>
            <CardContent className={`text-center relative z-10 ${
              isMobile ? 'p-3 py-4' : 'p-6'
            }`}>
              <div className={`inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20 ${
                isMobile ? 'w-8 h-8 mb-2' : 'w-14 h-14 mb-3'
              }`}>
                <Target className="text-blue-400" size={isMobile ? 16 : 18} />
              </div>
              <div className={`font-bold text-blue-400 ${
                isMobile ? 'text-xl mb-1' : 'text-4xl mb-1'
              }`}>{stats.totalTasks}</div>
              <div className={`text-slate-400 ${
                isMobile ? 'text-sm' : 'text-base'
              }`}>Total Tasks</div>
            </CardContent>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Card>

          <Card className={`group relative overflow-hidden bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50 hover:border-green-500/30 transition-all duration-300 ${
            isMobile ? 'min-h-[90px] touch-action-manipulation' : 'hover:scale-105'
          }`}>
            <CardContent className={`text-center relative z-10 ${
              isMobile ? 'p-3 py-4' : 'p-6'
            }`}>
              <div className={`inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/20 ${
                isMobile ? 'w-8 h-8 mb-2' : 'w-14 h-14 mb-3'
              }`}>
                <TrendingUp className="text-green-400" size={isMobile ? 16 : 18} />
              </div>
              <div className={`font-bold text-green-400 ${
                isMobile ? 'text-xl mb-1' : 'text-4xl mb-1'
              }`}>{stats.pomodoroSessions}</div>
              <div className={`text-slate-400 ${
                isMobile ? 'text-sm' : 'text-base'
              }`}>Pomodoros</div>
            </CardContent>
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Card>

          <Card className={`group relative overflow-hidden bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50 hover:border-orange-500/30 transition-all duration-300 ${
            isMobile ? 'min-h-[90px] touch-action-manipulation' : 'hover:scale-105'
          }`}>
            <CardContent className={`text-center relative z-10 ${
              isMobile ? 'p-3 py-4' : 'p-6'
            }`}>
              <div className={`inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/20 ${
                isMobile ? 'w-8 h-8 mb-2' : 'w-14 h-14 mb-3'
              }`}>
                <Clock className="text-orange-400" size={isMobile ? 16 : 18} />
              </div>
              <div className={`font-bold text-orange-400 ${
                isMobile ? 'text-xl mb-1' : 'text-4xl mb-1'
              }`}>{stats.focusTime}</div>
              <div className={`text-slate-400 ${
                isMobile ? 'text-sm' : 'text-base'
              }`}>Focus Time</div>
            </CardContent>
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className={`relative overflow-hidden bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50 flex-shrink-0 ${
          isMobile ? 'mb-3' : 'mb-8'
        }`}>
          <CardHeader className={isMobile ? 'pb-2' : 'pb-4'}>
            <CardTitle className={`font-semibold text-white flex items-center ${
              isMobile ? 'text-base' : 'text-xl'
            }`}>
              <div className={`inline-flex items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/20 ${
                isMobile ? 'w-6 h-6 mr-2' : 'w-8 h-8 mr-3'
              }`}>
                <Play className="text-violet-400" size={isMobile ? 12 : 14} />
              </div>
              Quick Start
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1">
              <Button
                onClick={startFocusSession}
                className={`bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 border-0 text-white font-medium transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/25 touch-action-manipulation ${
                  isMobile
                    ? 'h-12 text-sm min-h-[44px]'
                    : 'h-14 hover:scale-105'
                }`}
              >
                <Play size={isMobile ? 12 : 14} className="mr-2" />
                <span>Start Focus Session</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Today's Tasks */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50">
          <CardHeader className={isMobile ? 'pb-2' : 'pb-4'}>
            <div className="flex items-center justify-between">
              <CardTitle className={`font-semibold text-white flex items-center ${
                isMobile ? 'text-base' : 'text-xl'
              }`}>
                <div className={`inline-flex items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20 ${
                  isMobile ? 'w-6 h-6 mr-2' : 'w-8 h-8 mr-3'
                }`}>
                  <Target className="text-blue-400" size={isMobile ? 12 : 14} />
                </div>
                Today's Tasks
              </CardTitle>
              <AddTaskDialog onTaskCreated={handleTaskCreated} />
            </div>
          </CardHeader>
          <CardContent className={`pt-0 ${isMobile ? 'space-y-2' : 'space-y-4'}`}
            style={isMobile ? {
              maxHeight: 'calc(100vh - 320px)',
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
              scrollBehavior: 'smooth'
            } : {}}>
            {loading ? (
              <div className={`text-center ${isMobile ? 'py-4' : 'py-8'}`}>
                <div>
                  <div className={`animate-spin rounded-full border-b-2 border-primary mx-auto ${
                    isMobile ? 'h-6 w-6' : 'h-8 w-8'
                  }`}></div>
                  <p className={`text-muted-foreground mt-2 ${
                    isMobile ? 'text-sm' : 'text-base'
                  }`}>Loading tasks...</p>
                </div>
              </div>
            ) : todaysTasks.length === 0 ? (
              <div className={`text-center ${isMobile ? 'py-4' : 'py-8'}`}>
                <div>
                  <Target className={`text-muted-foreground mx-auto mb-4 ${
                    isMobile ? 'h-8 w-8' : 'h-12 w-12'
                  }`} />
                  <p className={`text-muted-foreground ${
                    isMobile ? 'text-sm' : 'text-base'
                  }`}>No tasks for today</p>
                  <p className={`text-muted-foreground ${
                    isMobile ? 'text-xs' : 'text-sm'
                  }`}>Add a task to get started!</p>
                </div>
              </div>
            ) : (
              <div className={`${isMobile ? 'space-y-2 task-list-mobile' : 'space-y-4'}`}>
                {todaysTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`group relative border transition-all duration-300 cursor-pointer ${
                      isMobile
                        ? 'p-3 rounded-lg min-h-[60px] task-card-mobile mobile-text'
                        : 'p-5 rounded-xl hover:scale-[1.02]'
                    } ${
                      task.completed
                        ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30 hover:border-green-400/50'
                        : `${getPriorityColor(task.priority)} hover:shadow-lg`
                    }`}
                    onClick={() => handleToggleTaskComplete(task.id)}
                    style={isMobile ? {
                      WebkitTapHighlightColor: 'transparent',
                      touchAction: 'manipulation'
                    } : {}}
                  >
                {/* Mobile Layout */}
                <div className="md:hidden">
                  <div className="flex items-start space-x-3 mb-2">
                    <button
                      className={`mt-1 transition-all duration-200 min-w-[20px] min-h-[20px] touch-action-manipulation ${
                        task.completed
                          ? 'text-green-400 hover:text-green-300'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleTaskComplete(task.id);
                      }}
                    >
                      {task.completed ? (
                        <CheckCircle size={18} className="text-green-400" />
                      ) : (
                        <div className="w-[18px] h-[18px] rounded-full border-2 border-current hover:border-violet-400 transition-colors" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold mb-1 transition-all duration-200 leading-tight ${
                        isMobile ? 'text-sm' : 'text-base'
                      } ${
                        task.completed
                          ? 'line-through text-slate-500'
                          : 'text-white group-hover:text-violet-300'
                      }`}>
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className={`mb-1 leading-tight ${
                          isMobile ? 'text-xs' : 'text-sm'
                        } ${
                          task.completed
                            ? 'text-slate-600'
                            : 'text-slate-400 group-hover:text-slate-300'
                        }`}>
                          {task.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 mobile-button-group">
                      {!task.completed && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 hover:border-violet-400/30 text-violet-400 hover:text-violet-300 transition-all duration-200 touch-action-manipulation min-h-[32px] min-w-[32px]"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStartPomodoro(task);
                          }}
                        >
                          <Play size={12} />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-400/30 text-red-400 hover:text-red-300 transition-all duration-200 touch-action-manipulation min-h-[32px] min-w-[32px]"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTask(task.id);
                        }}
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </div>

                  {/* Tags and Badges Row */}
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {/* Priority Badge */}
                    {task.priority && (
                      <Badge
                        variant="outline"
                        className={`font-medium flex items-center gap-1 ${
                          isMobile ? 'text-xs px-2 py-0.5' : 'text-xs px-2 py-1'
                        } ${
                          task.completed
                            ? 'border-green-500/30 text-green-400'
                            : 'border-current'
                        }`}
                      >
                        {getPriorityIcon(task.priority)}
                        <span className={isMobile ? 'text-xs' : 'text-xs'}>
                          {task.priority}
                        </span>
                      </Badge>
                    )}

                    {/* Quadrant Badge */}
                    <Badge
                      variant="outline"
                      className={`font-medium ${
                        isMobile ? 'text-xs px-2 py-0.5' : 'text-xs px-2 py-1'
                      } ${
                        task.completed
                          ? 'border-green-500/30 text-green-400'
                          : 'border-current'
                      }`}
                    >
                      <span className={isMobile ? 'text-xs' : 'text-xs'}>
                        {getQuadrantLabel(task.quadrant)}
                      </span>
                    </Badge>

                    {/* Tags */}
                    {task.tags && task.tags.length > 0 && (
                      <>
                        {task.tags.slice(0, isMobile ? 2 : task.tags.length).map((tag, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className={`bg-slate-700/50 text-slate-300 border-slate-600 ${
                              isMobile ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2 py-0.5'
                            }`}
                          >
                            <Tag className={`mr-1 ${isMobile ? 'h-2 w-2' : 'h-2 w-2'}`} />
                            <span className={isMobile ? 'text-xs' : 'text-xs'}>
                              {tag}
                            </span>
                          </Badge>
                        ))}
                        {isMobile && task.tags.length > 2 && (
                          <Badge
                            variant="secondary"
                            className="text-xs px-1.5 py-0.5 bg-slate-700/50 text-slate-300 border-slate-600"
                          >
                            +{task.tags.length - 2}
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden md:block">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3 flex-1">
                      <button
                        className={`mt-1 transition-all duration-200 ${
                          task.completed
                            ? 'text-green-400 hover:text-green-300'
                            : 'text-slate-400 hover:text-white'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleTaskComplete(task.id);
                        }}
                      >
                        {task.completed ? (
                          <CheckCircle size={20} className="text-green-400" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-current hover:border-violet-400 transition-colors" />
                        )}
                      </button>
                      <div className="flex-1">
                        <h3 className={`font-semibold text-lg mb-1 transition-all duration-200 ${
                          task.completed
                            ? 'line-through text-slate-500'
                            : 'text-white group-hover:text-violet-300'
                        }`}>
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className={`text-sm mb-2 ${
                            task.completed
                              ? 'text-slate-600'
                              : 'text-slate-400 group-hover:text-slate-300'
                          }`}>
                            {task.description}
                          </p>
                        )}

                        {/* Tags */}
                        {task.tags && task.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {task.tags.map((tag, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="text-xs px-2 py-0.5 bg-slate-700/50 text-slate-300 border-slate-600"
                              >
                                <Tag className="h-2 w-2 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {/* Priority Badge */}
                      {task.priority && (
                        <Badge
                          variant="outline"
                          className={`text-xs font-medium flex items-center gap-1 ${
                            task.completed
                              ? 'border-green-500/30 text-green-400'
                              : 'border-current'
                          }`}
                        >
                          {getPriorityIcon(task.priority)}
                          {task.priority}
                        </Badge>
                      )}

                      {/* Quadrant Badge */}
                      <Badge
                        variant="outline"
                        className={`text-xs font-medium ${
                          task.completed
                            ? 'border-green-500/30 text-green-400'
                            : 'border-current'
                        }`}
                      >
                        {getQuadrantLabel(task.quadrant)}
                      </Badge>
                      {!task.completed && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-9 w-9 p-0 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 hover:border-violet-400/30 text-violet-400 hover:text-violet-300 transition-all duration-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStartPomodoro(task);
                          }}
                        >
                          <Play size={14} />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-9 w-9 p-0 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-400/30 text-red-400 hover:text-red-300 transition-all duration-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTask(task.id);
                        }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
                {/* Task metadata - Hidden on mobile to save space */}
                <div className={`hidden md:flex text-xs items-center justify-between ${
                  task.completed
                    ? 'text-slate-600'
                    : 'text-slate-500'
                }`}>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center">
                      <Clock size={12} className="mr-1" />
                      Created: {new Date(task.created_at).toLocaleDateString()}
                    </div>
                    {task.estimated_time && (
                      <div className="flex items-center">
                        <Clock size={12} className="mr-1" />
                        Est: {task.estimated_time}
                      </div>
                    )}
                  </div>
                  {task.due_date && (
                    <div className={`flex items-center ${
                      new Date(task.due_date) < new Date()
                        ? 'text-red-400'
                        : task.completed
                          ? 'text-slate-600'
                          : 'text-slate-400'
                    }`}>
                      <Calendar size={12} className="mr-1" />
                      Due: {new Date(task.due_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TodayView;
