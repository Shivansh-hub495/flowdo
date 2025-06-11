
import React from 'react';
import { Calendar, Clock, Play, CheckCircle, Target, TrendingUp, AlertCircle, Star, Zap, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useTasks, Task } from '@/hooks/useTasks';
import { usePomodoroSessions } from '@/hooks/usePomodoroSessions';
import AddTaskDialog from '@/components/AddTaskDialog';

interface TodayViewProps {
  onStartPomodoro: (task: Task) => void;
}

const TodayView: React.FC<TodayViewProps> = ({ onStartPomodoro }) => {
  const { toast } = useToast();
  const { tasks, loading, toggleTaskCompletion, getTodaysTasks, getCompletedTasks } = useTasks();
  const { getTodaysPomodoroCount, getTodaysFocusTimeFormatted } = usePomodoroSessions();

  const todaysTasks = getTodaysTasks();
  const completedTasks = getCompletedTasks();

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

  const startFocusSession = () => {
    window.location.href = '/Clock.html';
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

  const getQuadrantLabel = (quadrant: string) => {
    switch (quadrant) {
      case 'urgent-important': return 'DO NOW';
      case 'important': return 'SCHEDULE';
      case 'urgent': return 'DELEGATE';
      default: return 'DELETE';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-violet-950/10 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/20 mb-4">
            <Calendar className="text-violet-400" size={28} />
          </div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            Today's Focus
          </h1>
          <p className="text-slate-400 text-lg">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <Card className="group relative overflow-hidden bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50 hover:border-violet-500/30 transition-all duration-300 hover:scale-105">
            <CardContent className="p-6 text-center relative z-10">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/20 mb-3">
                <CheckCircle className="text-violet-400" size={20} />
              </div>
              <div className="text-3xl font-bold text-violet-400 mb-1">{stats.completed}</div>
              <div className="text-sm text-slate-400">Completed</div>
            </CardContent>
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Card>

          <Card className="group relative overflow-hidden bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50 hover:border-blue-500/30 transition-all duration-300 hover:scale-105">
            <CardContent className="p-6 text-center relative z-10">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20 mb-3">
                <Target className="text-blue-400" size={20} />
              </div>
              <div className="text-3xl font-bold text-blue-400 mb-1">{stats.totalTasks}</div>
              <div className="text-sm text-slate-400">Total Tasks</div>
            </CardContent>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Card>

          <Card className="group relative overflow-hidden bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50 hover:border-green-500/30 transition-all duration-300 hover:scale-105">
            <CardContent className="p-6 text-center relative z-10">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/20 mb-3">
                <TrendingUp className="text-green-400" size={20} />
              </div>
              <div className="text-3xl font-bold text-green-400 mb-1">{stats.pomodoroSessions}</div>
              <div className="text-sm text-slate-400">Pomodoros</div>
            </CardContent>
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Card>

          <Card className="group relative overflow-hidden bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50 hover:border-orange-500/30 transition-all duration-300 hover:scale-105">
            <CardContent className="p-6 text-center relative z-10">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/20 mb-3">
                <Clock className="text-orange-400" size={20} />
              </div>
              <div className="text-3xl font-bold text-orange-400 mb-1">{stats.focusTime}</div>
              <div className="text-sm text-slate-400">Focus Time</div>
            </CardContent>
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50 mb-8">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-white flex items-center">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/20 mr-3">
                <Play className="text-violet-400" size={16} />
              </div>
              Quick Start
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 gap-4">
              <Button
                onClick={startFocusSession}
                className="h-14 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 border-0 text-white font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-violet-500/25"
              >
                <Play size={18} className="mr-2" />
                <span>Start Focus Session</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Today's Tasks */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-white flex items-center">
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20 mr-3">
                  <Target className="text-blue-400" size={16} />
                </div>
                Today's Tasks
              </CardTitle>
              <AddTaskDialog />
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading tasks...</p>
              </div>
            ) : todaysTasks.length === 0 ? (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No tasks for today</p>
                <p className="text-sm text-muted-foreground">Add a task to get started!</p>
              </div>
            ) : (
              todaysTasks.map((task) => (
              <div
                key={task.id}
                className={`group relative p-5 rounded-xl border transition-all duration-300 hover:scale-[1.02] cursor-pointer ${
                  task.completed
                    ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30 hover:border-green-400/50'
                    : `${getPriorityColor(task.priority)} hover:shadow-lg`
                }`}
                onClick={() => handleToggleTaskComplete(task.id)}
              >
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
                  </div>
                </div>
                {/* Task metadata */}
                <div className={`text-xs flex items-center justify-between ${
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
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TodayView;
