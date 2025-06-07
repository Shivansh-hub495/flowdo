
import React from 'react';
import { Calendar, Clock, Play, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Task {
  id: string;
  title: string;
  description?: string;
  quadrant: 'urgent-important' | 'important' | 'urgent' | 'neither';
  deadline?: string;
  completed?: boolean;
}

interface TodayViewProps {
  onStartPomodoro: (task: Task) => void;
}

const TodayView: React.FC<TodayViewProps> = ({ onStartPomodoro }) => {
  const todayTasks: Task[] = [
    {
      id: '1',
      title: 'Fix critical bug in production',
      description: 'Server issues affecting users',
      quadrant: 'urgent-important',
      deadline: '2025-06-07',
    },
    {
      id: '2',
      title: 'Review quarterly goals',
      description: 'Prepare for strategy meeting',
      quadrant: 'important',
      deadline: '2025-06-07',
    },
    {
      id: '3',
      title: 'Team standup meeting',
      description: 'Daily sync at 9 AM',
      quadrant: 'urgent',
      deadline: '2025-06-07',
      completed: true,
    },
  ];

  const stats = {
    totalTasks: todayTasks.length,
    completed: todayTasks.filter(t => t.completed).length,
    pomodoroSessions: 3,
    focusTime: '2h 15m',
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
    <div className="p-4 pb-20 min-h-screen">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2 flex items-center justify-center">
            <Calendar className="mr-2" size={24} />
            Today's Focus
          </h1>
          <p className="text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="glass">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.completed}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{stats.totalTasks}</div>
              <div className="text-xs text-muted-foreground">Total Tasks</div>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{stats.pomodoroSessions}</div>
              <div className="text-xs text-muted-foreground">Pomodoros</div>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{stats.focusTime}</div>
              <div className="text-xs text-muted-foreground">Focus Time</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="glass mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Quick Start</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button className="h-12 flex items-center justify-center space-x-2">
                <Play size={16} />
                <span>Start Focus Session</span>
              </Button>
              <Button variant="outline" className="h-12 flex items-center justify-center space-x-2">
                <Clock size={16} />
                <span>Quick Break</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Today's Tasks */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-lg">Today's Tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayTasks.map((task) => (
              <div
                key={task.id}
                className={`p-4 rounded-lg border transition-all duration-200 ${
                  task.completed 
                    ? 'bg-green-500/10 border-green-500/30' 
                    : getQuadrantColor(task.quadrant)
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {task.completed ? (
                      <CheckCircle size={16} className="text-green-400" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-current" />
                    )}
                    <h3 className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {task.title}
                    </h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {getQuadrantLabel(task.quadrant)}
                    </Badge>
                    {!task.completed && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => onStartPomodoro(task)}
                      >
                        <Play size={12} />
                      </Button>
                    )}
                  </div>
                </div>
                {task.description && (
                  <p className={`text-sm mb-2 ${task.completed ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                    {task.description}
                  </p>
                )}
                {task.deadline && (
                  <div className="text-xs text-muted-foreground">
                    Due: {new Date(task.deadline).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TodayView;
