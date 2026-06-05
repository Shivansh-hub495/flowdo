import React from 'react';
import { BarChart3, TrendingUp, Target, Clock, Calendar, Award, Activity, Zap, Trophy, Brain, Flame, Timer, CheckCircle2, Gauge, Sun, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart, ComposedChart, Line } from 'recharts';
import { usePomodoroSessions } from '@/hooks/usePomodoroSessions';
import { useStatistics } from '@/hooks/useStatistics';
import { useIsMobile } from '@/hooks/use-mobile';

const COLORS = {
  purple: '#8b5cf6',
  blue: '#3b82f6',
  green: '#22c55e',
  orange: '#f97316',
  red: '#ef4444',
  pink: '#ec4899',
  cyan: '#06b6d4',
  yellow: '#eab308',
  emerald: '#10b981',
  indigo: '#6366f1',
};

const QUADRANT_COLORS = {
  'urgent-important': '#ef4444',
  'important': '#f59e0b',
  'urgent': '#3b82f6',
  'neither': '#6b7280',
};

const StatsView: React.FC = () => {
  const { getTodaysPomodoroCount, getTodaysFocusTimeFormatted, getTodaysFocusTimeMinutes } = usePomodoroSessions();
  const {
    calculateDailyStats,
    calculateWeeklyStats,
    calculateQuadrantStats,
    calculateMatrixScore,
    calculateAchievements,
    formatTime,
    loading
  } = useStatistics();
  const isMobile = useIsMobile();

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="relative mx-auto w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-slate-700/50" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-violet-500 animate-spin" />
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/20 animate-pulse" />
          </div>
          <p className="text-slate-400 font-medium">Loading your productivity universe...</p>
        </div>
      </div>
    );
  }

  const weeklyStats = calculateWeeklyStats();
  const quadrantStats = calculateQuadrantStats();
  const matrixScore = calculateMatrixScore();
  const achievements = calculateAchievements();
  const dailyStats = calculateDailyStats();

  const chartConfig = {
    focusTime: { label: "Focus Time", color: COLORS.blue },
    pomodoros: { label: "Pomodoros", color: COLORS.purple },
    tasks: { label: "Tasks", color: COLORS.green },
    tasksCreated: { label: "Created", color: COLORS.orange },
  };

  const weeklyChartData = dailyStats.map((day, index) => {
    const daysAgo = 6 - index;
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayName = dayNames[date.getDay()];
    return {
      day: dayName,
      focusTime: Math.round(day.focusTime / 60 * 10) / 10,
      pomodoros: day.pomodoroCount,
      tasks: day.tasksCompleted,
      tasksCreated: day.tasksCreated,
      completionRate: day.tasksCreated > 0 ? Math.round((day.tasksCompleted / day.tasksCreated) * 100) : 0,
    };
  });

  const quadrantChartData = [
    { name: 'Urgent & Important', value: quadrantStats['urgent-important'], color: QUADRANT_COLORS['urgent-important'], label: 'Do Now' },
    { name: 'Important', value: quadrantStats['important'], color: QUADRANT_COLORS['important'], label: 'Schedule' },
    { name: 'Urgent', value: quadrantStats['urgent'], color: QUADRANT_COLORS['urgent'], label: 'Delegate' },
    { name: 'Neither', value: quadrantStats['neither'], color: QUADRANT_COLORS['neither'], label: 'Eliminate' },
  ];

  const totalQuadrant = quadrantChartData.reduce((s, d) => s + d.value, 0);

  const weeklyGoal = 25;
  const progressPercentage = Math.min((weeklyStats.totalFocusTime / 60 / weeklyGoal) * 100, 100);

  const completionRate = weeklyStats.totalTasksCreated > 0
    ? Math.round((weeklyStats.totalTasksCompleted / weeklyStats.totalTasksCreated) * 100)
    : 0;

  const avgSessionLength = weeklyStats.totalPomodoros > 0
    ? Math.round(weeklyStats.totalFocusTime / weeklyStats.totalPomodoros)
    : 0;

  const productivityScore = matrixScore;

  const bestDay = weeklyChartData.reduce((best, day) =>
    day.focusTime + day.tasks * 0.5 > best.focusTime + best.tasks * 0.5 ? day : best
  , weeklyChartData[0]);

  const productivityLevel = productivityScore >= 80 ? 'Peak' : productivityScore >= 60 ? 'High' : productivityScore >= 40 ? 'Moderate' : 'Low';
  const productivityColor = productivityScore >= 80 ? COLORS.green : productivityScore >= 60 ? COLORS.blue : productivityScore >= 40 ? COLORS.orange : COLORS.red;

  const efficiency = weeklyStats.totalFocusTime > 0
    ? (weeklyStats.totalTasksCompleted / (weeklyStats.totalFocusTime / 60)).toFixed(1)
    : '0';

  return (
    <div className={`${isMobile ? 'p-3 space-y-4' : 'p-6 space-y-8'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="relative mb-10 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/80 via-slate-800/60 to-slate-900/80 border border-slate-700/40 p-8">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-violet-300 via-purple-300 to-indigo-300 bg-clip-text text-transparent flex items-center gap-3">
                <BarChart3 className="text-violet-400" size={36} />
                Your Universe
              </h1>
              <p className="text-lg text-slate-400">Your productivity metrics at a glance</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-slate-500">Today</div>
                <div className="text-xl font-bold text-slate-200">{getTodaysFocusTimeFormatted()}</div>
              </div>
              <div className="w-px h-10 bg-slate-700/50" />
              <div className="text-right">
                <div className="text-sm text-slate-500">Streak</div>
                <div className="text-xl font-bold text-orange-400">{weeklyStats.streak} days</div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics - 6 cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <MetricCard
            icon={<Clock className="text-blue-400" size={22} />}
            value={getTodaysFocusTimeFormatted()}
            label="Focus Today"
            sublabel={`${getTodaysPomodoroCount()} pomodoros`}
            gradient="from-blue-500/10 to-cyan-500/10"
            border="border-blue-500/20"
            iconBg="bg-blue-500/20 border-blue-500/20"
            valueColor="text-blue-400"
          />
          <MetricCard
            icon={<TrendingUp className="text-green-400" size={22} />}
            value={formatTime(weeklyStats.totalFocusTime)}
            label="Weekly Focus"
            sublabel={weeklyStats.totalPomodoros > 0 ? `${weeklyStats.totalPomodoros} sessions` : 'No sessions'}
            gradient="from-green-500/10 to-emerald-500/10"
            border="border-green-500/20"
            iconBg="bg-green-500/20 border-green-500/20"
            valueColor="text-green-400"
          />
          <MetricCard
            icon={<Brain className="text-purple-400" size={22} />}
            value={`${weeklyStats.totalTasksCompleted}`}
            label="Tasks Done"
            sublabel={`${weeklyStats.totalTasksCreated} created`}
            gradient="from-purple-500/10 to-violet-500/10"
            border="border-purple-500/20"
            iconBg="bg-purple-500/20 border-purple-500/20"
            valueColor="text-purple-400"
          />
          <MetricCard
            icon={<Gauge className="text-orange-400" size={22} />}
            value={`${completionRate}%`}
            label="Completion Rate"
            sublabel={`${efficiency} tasks/hr`}
            gradient="from-orange-500/10 to-amber-500/10"
            border="border-orange-500/20"
            iconBg="bg-orange-500/20 border-orange-500/20"
            valueColor="text-orange-400"
          />
          <MetricCard
            icon={<Timer className="text-cyan-400" size={22} />}
            value={avgSessionLength > 0 ? `${avgSessionLength}m` : '--'}
            label="Avg Session"
            sublabel={weeklyStats.totalPomodoros > 0 ? 'per pomodoro' : 'No data'}
            gradient="from-cyan-500/10 to-teal-500/10"
            border="border-cyan-500/20"
            iconBg="bg-cyan-500/20 border-cyan-500/20"
            valueColor="text-cyan-400"
          />
          <MetricCard
            icon={<Flame className="text-red-400" size={22} />}
            value={`${weeklyStats.streak}`}
            label="Streak"
            sublabel={weeklyStats.streak === 1 ? 'day' : 'days'}
            gradient="from-red-500/10 to-rose-500/10"
            border="border-red-500/20"
            iconBg="bg-red-500/20 border-red-500/20"
            valueColor="text-red-400"
          />
        </div>

        {/* Productivity Score + Weekly Goal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Productivity Score Gauge */}
          <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50 lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center text-slate-200">
                <Star className="mr-2 text-yellow-400" size={20} />
                Productivity Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center py-4">
                <div className="relative w-36 h-36 mb-4">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(148,163,184,0.1)" strokeWidth="8" />
                    <circle
                      cx="60" cy="60" r="54" fill="none"
                      stroke={productivityColor}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${(productivityScore / 100) * 339.292} 339.292`}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold" style={{ color: productivityColor }}>{productivityScore}</span>
                    <span className="text-xs text-slate-400 mt-1">{productivityLevel}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-center">
                  <div className="text-xs text-slate-500">Focus</div>
                  <div className="text-xs text-slate-500">Tasks</div>
                  <div className="text-sm font-semibold text-blue-400">{Math.round(weeklyStats.averageDailyFocus)}m/day</div>
                  <div className="text-sm font-semibold text-green-400">{weeklyStats.totalTasksCompleted}/wk</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Goal Progress */}
          <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50 lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center text-slate-200">
                <Target className="mr-2 text-violet-400" size={20} />
                Weekly Goal Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-slate-400">Focus Time</div>
                  <div className="text-3xl font-bold text-violet-400">{Math.round(weeklyStats.totalFocusTime / 60 * 10) / 10}h</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-400">Target</div>
                  <div className="text-2xl font-semibold text-slate-300">{weeklyGoal}h</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="relative h-4 bg-slate-700/50 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 transition-all duration-500 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"
                    style={{ backgroundSize: '200% 100%' }} />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">
                    {Math.round(progressPercentage)}% complete
                  </span>
                  {progressPercentage < 100 ? (
                    <span className="text-slate-400">
                      {Math.round((weeklyGoal - weeklyStats.totalFocusTime / 60) * 10) / 10}h remaining
                    </span>
                  ) : (
                    <span className="text-green-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 size={14} /> Goal achieved!
                    </span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {weeklyChartData.map((day, i) => {
                  const isBest = day.day === bestDay.day && day.focusTime === bestDay.focusTime;
                  return (
                    <div key={i} className="text-center">
                      <div className={`text-xs mb-1 ${isBest ? 'text-yellow-400 font-bold' : 'text-slate-500'}`}>{day.day}</div>
                      <div
                        className={`rounded-md transition-all duration-300 ${
                          day.focusTime > 0
                            ? 'bg-gradient-to-t from-violet-500/40 to-blue-500/20 border border-violet-500/30'
                            : 'bg-slate-700/20 border border-slate-600/20'
                        } ${isBest ? 'ring-2 ring-yellow-400/50' : ''}`}
                        style={{ height: `${Math.max(24, day.focusTime * 8 + 4)}px` }}
                      />
                      <div className={`text-xs mt-1 ${day.focusTime > 0 ? 'text-slate-400' : 'text-slate-600'}`}>
                        {day.focusTime > 0 ? `${day.focusTime}h` : '--'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Combined Focus + Tasks Chart */}
          <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center text-slate-200">
                <Activity className="mr-2 text-blue-400" size={20} />
                Focus & Tasks Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className={`${isMobile ? 'h-[220px]' : 'h-[280px]'} w-full`}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={weeklyChartData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="focusG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: isMobile ? 10 : 12 }} />
                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: isMobile ? 10 : 12 }} width={isMobile ? 25 : 35} />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: isMobile ? 10 : 12 }} width={isMobile ? 25 : 35} />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }}
                    />
                    <Area yAxisId="left" type="monotone" dataKey="focusTime" stroke="#3b82f6" strokeWidth={2} fill="url(#focusG)" name="Focus Time" />
                    <Bar yAxisId="right" dataKey="tasks" fill="#22c55e" radius={[4, 4, 0, 0]} name="Tasks Done" barSize={isMobile ? 12 : 20} />
                    <Line yAxisId="left" type="monotone" dataKey="pomodoros" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="4 4" name="Pomodoros" dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartContainer>
              <div className="flex flex-wrap gap-4 mt-4 justify-center">
                <LegendDot color="#3b82f6" label="Focus (hours)" />
                <LegendDot color="#8b5cf6" label="Pomodoros" />
                <LegendDot color="#22c55e" label="Tasks Done" />
              </div>
            </CardContent>
          </Card>

          {/* Task Quadrant Distribution */}
          <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center text-slate-200">
                <Target className="mr-2 text-purple-400" size={20} />
                Eisenhower Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className={`${isMobile ? 'w-full' : 'flex-1'}`}>
                  <ChartContainer config={chartConfig} className={`${isMobile ? 'h-[200px]' : 'h-[240px]'} w-full`}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={quadrantChartData.filter(d => d.value > 0)}
                          cx="50%" cy="50%"
                          innerRadius={isMobile ? 35 : 55}
                          outerRadius={isMobile ? 70 : 100}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {quadrantChartData.filter(d => d.value > 0).map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip
                          content={<ChartTooltipContent />}
                          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
                <div className="w-full md:w-56 space-y-2">
                  {quadrantChartData.map((item, idx) => {
                    const pct = totalQuadrant > 0 ? Math.round((item.value / totalQuadrant) * 100) : 0;
                    const isNotEmpty = item.value > 0;
                    return (
                      <div key={idx} className={`p-2 rounded-lg ${isNotEmpty ? 'bg-slate-800/30' : 'opacity-40'} transition-all`}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-xs font-medium text-slate-300">{item.name}</span>
                          </div>
                          <span className="text-xs text-slate-400">{item.value} ({pct}%)</span>
                        </div>
                        <div className="h-1 bg-slate-700/50 rounded-full overflow-hidden">
                          {isNotEmpty && (
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: item.color }} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Task Creation vs Completion Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center text-slate-200">
                <CheckCircle2 className="mr-2 text-emerald-400" size={20} />
                Task Flow: Created vs Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className={`${isMobile ? 'h-[220px]' : 'h-[280px]'} w-full`}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyChartData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: isMobile ? 10 : 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: isMobile ? 10 : 12 }} width={isMobile ? 25 : 35} />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }}
                    />
                    <Bar dataKey="tasksCreated" fill="#f97316" radius={[4, 4, 0, 0]} name="Created" barSize={isMobile ? 10 : 16} />
                    <Bar dataKey="tasks" fill="#22c55e" radius={[4, 4, 0, 0]} name="Completed" barSize={isMobile ? 10 : 16} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
              <div className="flex flex-wrap gap-4 mt-4 justify-center">
                <LegendDot color="#f97316" label="Created" />
                <LegendDot color="#22c55e" label="Completed" />
              </div>
            </CardContent>
          </Card>

          {/* Task Completion Rate Chart */}
          <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center text-slate-200">
                <Gauge className="mr-2 text-cyan-400" size={20} />
                Daily Completion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className={`${isMobile ? 'h-[220px]' : 'h-[280px]'} w-full`}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyChartData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="rateG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: isMobile ? 10 : 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: isMobile ? 10 : 12 }} domain={[0, 100]} width={isMobile ? 25 : 35} tickFormatter={(v) => `${v}%`} />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }}
                    />
                    <Area type="monotone" dataKey="completionRate" stroke="#06b6d4" strokeWidth={2} fill="url(#rateG)" name="Completion Rate" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
              <div className="flex flex-wrap gap-4 mt-4 justify-center">
                <LegendDot color="#06b6d4" label="Completion Rate (%)" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Daily Performance */}
        <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50 mb-8">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center text-slate-200">
              <Calendar className="mr-2 text-green-400" size={20} />
              Daily Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2 md:gap-3">
              {weeklyChartData.map((day, index) => {
                const isToday = index === weeklyChartData.length - 1;
                const isBest = day.focusTime === bestDay.focusTime && day.tasks === bestDay.tasks;
                const hasActivity = day.focusTime > 0 || day.pomodoros > 0;

                return (
                  <div key={day.day} className="text-center">
                    <div className={`text-xs font-semibold mb-2 ${isToday ? 'text-violet-400' : 'text-slate-500'}`}>
                      {day.day}
                      {isToday && <div className="text-[10px] text-violet-400 font-normal">Today</div>}
                    </div>
                    <div
                      className={`rounded-xl flex flex-col items-center justify-end p-2 md:p-3 transition-all duration-300 hover:scale-105 ${
                        isBest
                          ? 'bg-gradient-to-t from-yellow-500/20 to-amber-500/10 border border-yellow-500/30 ring-1 ring-yellow-400/30'
                          : hasActivity
                            ? 'bg-gradient-to-t from-violet-500/20 to-blue-500/10 border border-violet-500/30'
                            : 'bg-slate-700/20 border border-slate-600/20'
                      }`}
                      style={{ height: `${Math.max(70, day.focusTime * 18 + 30)}px` }}
                    >
                      <div className="space-y-0.5">
                        <div className={`text-xs md:text-sm font-bold ${hasActivity ? 'text-blue-300' : 'text-slate-600'}`}>
                          {day.focusTime}h
                        </div>
                        <div className={`text-[10px] md:text-xs ${hasActivity ? 'text-purple-300' : 'text-slate-600'}`}>
                          {day.pomodoros} 🍅
                        </div>
                        <div className={`text-[10px] md:text-xs ${hasActivity ? 'text-green-300' : 'text-slate-600'}`}>
                          {day.tasks} ✓
                        </div>
                      </div>
                    </div>
                    <div className="mt-1.5 text-[10px] text-slate-600">
                      {day.completionRate > 0 ? `${day.completionRate}%` : '--'}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Best Day + Efficiency */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border border-yellow-500/20">
            <CardContent className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-yellow-500/20 border border-yellow-500/20 mb-4">
                <Star className="text-yellow-400" size={22} />
              </div>
              <div className="text-2xl font-bold text-yellow-400 mb-1">{bestDay.day}</div>
              <div className="text-sm text-slate-400 mb-2">Best Day</div>
              <div className="flex justify-center gap-4 text-xs">
                <span className="text-blue-300">{bestDay.focusTime}h focus</span>
                <span className="text-green-300">{bestDay.tasks} tasks</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-500/10 to-teal-500/10 border border-cyan-500/20">
            <CardContent className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/20 mb-4">
                <Zap className="text-cyan-400" size={22} />
              </div>
              <div className="text-2xl font-bold text-cyan-400 mb-1">{efficiency}</div>
              <div className="text-sm text-slate-400">Tasks per Hour</div>
              <div className="text-xs text-cyan-300 mt-1">Efficiency Ratio</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-pink-500/10 to-rose-500/10 border border-pink-500/20">
            <CardContent className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-pink-500/20 border border-pink-500/20 mb-4">
                <Sun className="text-pink-400" size={22} />
              </div>
              <div className="text-2xl font-bold text-pink-400 mb-1">{formatTime(weeklyStats.averageDailyFocus)}</div>
              <div className="text-sm text-slate-400">Daily Average</div>
              <div className="text-xs text-pink-300 mt-1">Focus Time</div>
            </CardContent>
          </Card>
        </div>

        {/* Achievements */}
        <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center text-slate-200">
              <Award className="mr-2 text-yellow-400" size={20} />
              Achievements
              <Badge variant="outline" className="ml-3 text-xs bg-yellow-500/10 text-yellow-300 border-yellow-500/30">
                {achievements.filter(a => a.unlocked).length}/{achievements.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`group relative p-5 rounded-xl border transition-all duration-300 hover:scale-[1.02] ${
                    achievement.unlocked
                      ? 'bg-gradient-to-br from-yellow-500/15 to-amber-500/10 border-yellow-500/40 shadow-lg shadow-yellow-500/5'
                      : 'bg-gradient-to-br from-slate-700/15 to-slate-800/15 border-slate-600/30'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`text-2xl ${achievement.unlocked ? '' : 'grayscale opacity-50'}`}>
                        {achievement.icon}
                      </div>
                      <div>
                        <h3 className={`font-semibold text-sm ${
                          achievement.unlocked ? 'text-yellow-300' : 'text-slate-400'
                        }`}>
                          {achievement.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">{achievement.description}</p>
                      </div>
                    </div>
                    <Badge
                      variant={achievement.unlocked ? 'default' : 'secondary'}
                      className={`text-[10px] px-2 py-0 ${
                        achievement.unlocked
                          ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                          : 'bg-slate-600/20 text-slate-400 border-slate-500/30'
                      }`}
                    >
                      {achievement.unlocked ? 'Unlocked' : 'Locked'}
                    </Badge>
                  </div>

                  {achievement.progress !== undefined && achievement.target !== undefined && achievement.target > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Progress</span>
                        <span className={achievement.unlocked ? 'text-yellow-300 font-medium' : 'text-slate-400'}>
                          {achievement.progress} / {achievement.target}
                        </span>
                      </div>
                      <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            achievement.unlocked
                              ? 'bg-gradient-to-r from-yellow-400 to-amber-500'
                              : 'bg-slate-600/50'
                          }`}
                          style={{ width: `${Math.min((achievement.progress / achievement.target) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {achievement.unlocked && (
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none" />
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

const MetricCard = ({
  icon, value, label, sublabel, gradient, border, iconBg, valueColor
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  sublabel: string;
  gradient: string;
  border: string;
  iconBg: string;
  valueColor: string;
}) => (
  <Card className={`group relative overflow-hidden bg-gradient-to-br ${gradient} ${border} hover:scale-[1.03] transition-all duration-300`}>
    <CardContent className="p-4 text-center relative z-10">
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${iconBg} mb-3 transition-transform duration-300 group-hover:scale-110`}>
        {icon}
      </div>
      <div className={`text-xl md:text-2xl font-bold ${valueColor} mb-0.5`}>{value}</div>
      <div className="text-xs text-slate-400 font-medium">{label}</div>
      <div className="text-[10px] text-slate-500 mt-0.5">{sublabel}</div>
    </CardContent>
    <div className={`absolute inset-0 bg-gradient-to-br ${gradient.replace('/10', '/5').replace('/20', '/10')} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
  </Card>
);

const LegendDot = ({ color, label }: { color: string; label: string }) => (
  <div className="flex items-center gap-1.5">
    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
    <span className="text-xs text-slate-500">{label}</span>
  </div>
);

export default StatsView;
