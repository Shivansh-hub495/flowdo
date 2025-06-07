
import React from 'react';
import { BarChart3, TrendingUp, Target, Clock, Calendar, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

const StatsView: React.FC = () => {
  const stats = {
    todayFocus: '2h 15m',
    weekFocus: '18h 30m',
    pomodoroStreak: 5,
    tasksCompleted: 47,
    matrixScore: 85,
    weeklyGoal: 25,
    currentWeekHours: 18.5,
  };

  const weeklyData = [
    { day: 'Mon', hours: 3.5, pomodoros: 7 },
    { day: 'Tue', hours: 2.8, pomodoros: 6 },
    { day: 'Wed', hours: 4.2, pomodoros: 8 },
    { day: 'Thu', hours: 3.1, pomodoros: 6 },
    { day: 'Fri', hours: 2.7, pomodoros: 5 },
    { day: 'Sat', hours: 1.5, pomodoros: 3 },
    { day: 'Sun', hours: 0.7, pomodoros: 1 },
  ];

  const achievements = [
    { title: 'Focus Master', description: '10 consecutive pomodoros', unlocked: true },
    { title: 'Matrix Maestro', description: 'Score 90+ for a week', unlocked: false },
    { title: 'Streak Keeper', description: '7-day focus streak', unlocked: true },
    { title: 'Deep Worker', description: '25+ hours in a week', unlocked: false },
  ];

  const progressPercentage = (stats.currentWeekHours / stats.weeklyGoal) * 100;

  return (
    <div className="p-4 pb-20 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2 flex items-center justify-center">
            <BarChart3 className="mr-2" size={24} />
            Your Progress
          </h1>
          <p className="text-muted-foreground">Track your focus journey and productivity insights</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="glass">
            <CardContent className="p-4 text-center">
              <Clock className="mx-auto mb-2 text-blue-400" size={20} />
              <div className="text-xl font-bold">{stats.todayFocus}</div>
              <div className="text-xs text-muted-foreground">Today</div>
            </CardContent>
          </Card>
          
          <Card className="glass">
            <CardContent className="p-4 text-center">
              <TrendingUp className="mx-auto mb-2 text-green-400" size={20} />
              <div className="text-xl font-bold">{stats.weekFocus}</div>
              <div className="text-xs text-muted-foreground">This Week</div>
            </CardContent>
          </Card>
          
          <Card className="glass">
            <CardContent className="p-4 text-center">
              <Target className="mx-auto mb-2 text-purple-400" size={20} />
              <div className="text-xl font-bold">{stats.pomodoroStreak}</div>
              <div className="text-xs text-muted-foreground">Day Streak</div>
            </CardContent>
          </Card>
          
          <Card className="glass">
            <CardContent className="p-4 text-center">
              <Award className="mx-auto mb-2 text-orange-400" size={20} />
              <div className="text-xl font-bold">{stats.matrixScore}</div>
              <div className="text-xs text-muted-foreground">Matrix Score</div>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Goal Progress */}
        <Card className="glass mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Target className="mr-2" size={20} />
              Weekly Goal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>{stats.currentWeekHours}h completed</span>
                <span>{stats.weeklyGoal}h goal</span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
              <div className="text-center text-sm text-muted-foreground">
                {progressPercentage >= 100 ? '🎉 Goal achieved!' : `${Math.round(progressPercentage)}% complete`}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Overview */}
        <Card className="glass mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Calendar className="mr-2" size={20} />
              Weekly Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {weeklyData.map((day, index) => (
                <div key={day.day} className="text-center">
                  <div className="text-xs font-medium mb-2 text-muted-foreground">{day.day}</div>
                  <div 
                    className="bg-primary/20 rounded-lg flex flex-col items-center justify-end p-2"
                    style={{ height: `${Math.max(40, day.hours * 20)}px` }}
                  >
                    <div className="text-xs font-bold">{day.hours}h</div>
                    <div className="text-xs text-muted-foreground">{day.pomodoros}🍅</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Award className="mr-2" size={20} />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map((achievement, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border transition-all duration-200 ${
                    achievement.unlocked
                      ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/50'
                      : 'bg-muted/20 border-muted-foreground/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`font-medium ${achievement.unlocked ? 'text-yellow-400' : 'text-muted-foreground'}`}>
                      {achievement.title}
                    </h3>
                    <Badge variant={achievement.unlocked ? 'default' : 'secondary'}>
                      {achievement.unlocked ? '✓' : '⏳'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{achievement.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StatsView;
