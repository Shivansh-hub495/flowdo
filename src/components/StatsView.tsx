
import React from 'react';
import { BarChart3, TrendingUp, Target, Clock, Calendar, Award, Activity, Zap, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { usePomodoroSessions } from '@/hooks/usePomodoroSessions';
import { useStatistics } from '@/hooks/useStatistics';

const StatsView: React.FC = () => {
  const { getTodaysPomodoroCount, getTodaysFocusTimeFormatted } = usePomodoroSessions();
  const {
    calculateDailyStats,
    calculateWeeklyStats,
    calculateQuadrantStats,
    calculateMatrixScore,
    calculateAchievements,
    formatTime,
    loading
  } = useStatistics();

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading statistics...</p>
        </div>
      </div>
    );
  }

  const weeklyStats = calculateWeeklyStats();
  const quadrantStats = calculateQuadrantStats();
  const matrixScore = calculateMatrixScore();
  const achievements = calculateAchievements();
  const dailyStats = calculateDailyStats();

  // Chart configurations
  const chartConfig = {
    focusTime: {
      label: "Focus Time",
      color: "hsl(var(--chart-1))",
    },
    pomodoros: {
      label: "Pomodoros",
      color: "hsl(var(--chart-2))",
    },
    tasks: {
      label: "Tasks",
      color: "hsl(var(--chart-3))",
    },
  };

  // Prepare data for charts with correct day names
  const weeklyChartData = dailyStats.map((day, index) => {
    // Calculate which day this represents (0 = 6 days ago, 6 = today)
    const daysAgo = 6 - index;
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayName = dayNames[date.getDay()];


    return {
      day: dayName,
      focusTime: Math.round(day.focusTime / 60 * 10) / 10, // Convert to hours with 1 decimal
      pomodoros: day.pomodoroCount,
      tasks: day.tasksCompleted,
    };
  });

  const quadrantChartData = [
    { name: 'Urgent & Important', value: quadrantStats['urgent-important'], color: '#ef4444' },
    { name: 'Important', value: quadrantStats['important'], color: '#f59e0b' },
    { name: 'Urgent', value: quadrantStats['urgent'], color: '#3b82f6' },
    { name: 'Neither', value: quadrantStats['neither'], color: '#6b7280' },
  ];

  const weeklyGoal = 25; // 25 hours per week
  const progressPercentage = Math.min((weeklyStats.totalFocusTime / 60 / weeklyGoal) * 100, 100);

  return (
    <div className="p-6 space-y-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent flex items-center justify-center">
            <BarChart3 className="mr-3 text-violet-400" size={32} />
            Your Progress
          </h1>
          <p className="text-lg text-muted-foreground">Track your focus journey and productivity insights</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <Card className="group relative overflow-hidden bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 hover:border-blue-400/40 transition-all duration-300 hover:scale-105">
            <CardContent className="p-6 text-center relative z-10">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20 mb-4">
                <Clock className="text-blue-400" size={24} />
              </div>
              <div className="text-2xl font-bold text-blue-400 mb-1">{getTodaysFocusTimeFormatted()}</div>
              <div className="text-sm text-slate-400">Today's Focus</div>
            </CardContent>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Card>

          <Card className="group relative overflow-hidden bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 hover:border-green-400/40 transition-all duration-300 hover:scale-105">
            <CardContent className="p-6 text-center relative z-10">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/20 mb-4">
                <TrendingUp className="text-green-400" size={24} />
              </div>
              <div className="text-2xl font-bold text-green-400 mb-1">{formatTime(weeklyStats.totalFocusTime)}</div>
              <div className="text-sm text-slate-400">This Week</div>
            </CardContent>
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Card>

          <Card className="group relative overflow-hidden bg-gradient-to-br from-purple-500/10 to-violet-500/10 border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 hover:scale-105">
            <CardContent className="p-6 text-center relative z-10">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-violet-500/20 border border-purple-500/20 mb-4">
                <Zap className="text-purple-400" size={24} />
              </div>
              <div className="text-2xl font-bold text-purple-400 mb-1">{weeklyStats.streak}</div>
              <div className="text-sm text-slate-400">Day Streak</div>
            </CardContent>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Card>

          <Card className="group relative overflow-hidden bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20 hover:border-orange-400/40 transition-all duration-300 hover:scale-105">
            <CardContent className="p-6 text-center relative z-10">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/20 mb-4">
                <Trophy className="text-orange-400" size={24} />
              </div>
              <div className="text-2xl font-bold text-orange-400 mb-1">{matrixScore}</div>
              <div className="text-sm text-slate-400">Matrix Score</div>
            </CardContent>
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Card>
        </div>

        {/* Weekly Goal Progress */}
        <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50 mb-8">
          <CardHeader>
            <CardTitle className="text-xl flex items-center text-slate-200">
              <Target className="mr-3 text-violet-400" size={24} />
              Weekly Goal Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="text-sm text-slate-400">
                <span className="text-2xl font-bold text-violet-400">{Math.round(weeklyStats.totalFocusTime / 60 * 10) / 10}h</span> completed
              </div>
              <div className="text-sm text-slate-400">
                <span className="text-lg font-semibold text-slate-300">{weeklyGoal}h</span> goal
              </div>
            </div>
            <div className="space-y-2">
              <Progress value={progressPercentage} className="h-4 bg-slate-700/50" />
              <div className="text-center text-sm">
                {progressPercentage >= 100 ? (
                  <span className="text-green-400 font-semibold">🎉 Goal achieved! Amazing work!</span>
                ) : (
                  <span className="text-slate-400">{Math.round(progressPercentage)}% complete • {Math.round((weeklyGoal - weeklyStats.totalFocusTime / 60) * 10) / 10}h remaining</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Weekly Focus Chart */}
          <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-xl flex items-center text-slate-200">
                <Activity className="mr-3 text-blue-400" size={24} />
                Weekly Focus Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyChartData}>
                    <defs>
                      <linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                    />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#f1f5f9'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="focusTime"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fill="url(#focusGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Task Quadrant Distribution */}
          <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-xl flex items-center text-slate-200">
                <Target className="mr-3 text-purple-400" size={24} />
                Task Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={quadrantChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {quadrantChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#f1f5f9'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {quadrantChartData.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs text-slate-400">{item.name}: {item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Overview */}
        <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50 mb-8">
          <CardHeader>
            <CardTitle className="text-xl flex items-center text-slate-200">
              <Calendar className="mr-3 text-green-400" size={24} />
              Daily Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-3">
              {weeklyChartData.map((day, index) => {
                const isToday = index === weeklyChartData.length - 1;
                const hasActivity = day.focusTime > 0 || day.pomodoros > 0;

                return (
                  <div key={day.day} className="text-center">
                    <div className={`text-sm font-medium mb-3 ${isToday ? 'text-violet-400' : 'text-slate-400'}`}>
                      {day.day}
                      {isToday && <div className="text-xs text-violet-300">Today</div>}
                    </div>
                    <div
                      className={`rounded-xl flex flex-col items-center justify-end p-3 transition-all duration-300 hover:scale-105 ${
                        hasActivity
                          ? 'bg-gradient-to-t from-violet-500/20 to-blue-500/20 border border-violet-500/30'
                          : 'bg-slate-700/30 border border-slate-600/30'
                      }`}
                      style={{ height: `${Math.max(80, day.focusTime * 15 + 40)}px` }}
                    >
                      <div className="space-y-1 text-center">
                        <div className={`text-sm font-bold ${hasActivity ? 'text-violet-300' : 'text-slate-500'}`}>
                          {day.focusTime}h
                        </div>
                        <div className={`text-xs ${hasActivity ? 'text-blue-300' : 'text-slate-500'}`}>
                          {day.pomodoros}🍅
                        </div>
                        <div className={`text-xs ${hasActivity ? 'text-green-300' : 'text-slate-500'}`}>
                          {day.tasks}✓
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20">
            <CardContent className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/20 mb-4">
                <Zap className="text-emerald-400" size={20} />
              </div>
              <div className="text-2xl font-bold text-emerald-400 mb-1">{weeklyStats.totalPomodoros}</div>
              <div className="text-sm text-slate-400">Total Pomodoros</div>
              <div className="text-xs text-emerald-300 mt-1">This Week</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
            <CardContent className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/20 mb-4">
                <Target className="text-blue-400" size={20} />
              </div>
              <div className="text-2xl font-bold text-blue-400 mb-1">{weeklyStats.totalTasksCompleted}</div>
              <div className="text-sm text-slate-400">Tasks Completed</div>
              <div className="text-xs text-blue-300 mt-1">This Week</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
            <CardContent className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/20 mb-4">
                <TrendingUp className="text-amber-400" size={20} />
              </div>
              <div className="text-2xl font-bold text-amber-400 mb-1">{formatTime(weeklyStats.averageDailyFocus)}</div>
              <div className="text-sm text-slate-400">Daily Average</div>
              <div className="text-xs text-amber-300 mt-1">Focus Time</div>
            </CardContent>
          </Card>
        </div>

        {/* Achievements */}
        <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-xl flex items-center text-slate-200">
              <Award className="mr-3 text-yellow-400" size={24} />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {achievements.map((achievement, index) => (
                <div
                  key={achievement.id}
                  className={`group relative p-6 rounded-xl border transition-all duration-300 hover:scale-105 ${
                    achievement.unlocked
                      ? 'bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border-yellow-500/40 shadow-lg shadow-yellow-500/10'
                      : 'bg-gradient-to-br from-slate-700/20 to-slate-800/20 border-slate-600/30'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`text-2xl ${achievement.unlocked ? 'grayscale-0' : 'grayscale'}`}>
                        {achievement.icon}
                      </div>
                      <div>
                        <h3 className={`font-semibold text-lg ${
                          achievement.unlocked ? 'text-yellow-300' : 'text-slate-400'
                        }`}>
                          {achievement.title}
                        </h3>
                        <p className="text-sm text-slate-400 mt-1">{achievement.description}</p>
                      </div>
                    </div>
                    <Badge
                      variant={achievement.unlocked ? 'default' : 'secondary'}
                      className={achievement.unlocked
                        ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                        : 'bg-slate-600/20 text-slate-400 border-slate-500/30'
                      }
                    >
                      {achievement.unlocked ? '✓' : '⏳'}
                    </Badge>
                  </div>

                  {achievement.progress !== undefined && achievement.target !== undefined && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Progress</span>
                        <span className={achievement.unlocked ? 'text-yellow-300' : 'text-slate-400'}>
                          {achievement.progress} / {achievement.target}
                        </span>
                      </div>
                      <Progress
                        value={(achievement.progress / achievement.target) * 100}
                        className={`h-2 ${achievement.unlocked ? 'bg-yellow-500/20' : 'bg-slate-600/20'}`}
                      />
                    </div>
                  )}

                  {achievement.unlocked && (
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                  )}
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
