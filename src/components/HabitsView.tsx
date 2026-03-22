import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Check,
  X,
  Edit,
  Trash2,
  Target,
  Flame,
  Calendar,
  TrendingUp,
  CheckCircle2,
  Circle,
  ArrowRight,
  ChevronLeft
} from 'lucide-react';
import { useHabits, type Habit, type HabitWithStats } from '@/hooks/useHabits';
import { useIsMobile } from '@/hooks/use-mobile';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Weekly Progress Bar Component
const WeeklyProgressBar: React.FC<{
  habitId: string;
  getWeeklyProgress: (id: string) => Promise<boolean[]>;
  refreshKey?: number;
}> = ({
  habitId,
  getWeeklyProgress,
  refreshKey = 0
}) => {
  const [weeklyData, setWeeklyData] = React.useState<boolean[]>([]);

  React.useEffect(() => {
    const loadWeeklyData = async () => {
      const data = await getWeeklyProgress(habitId);
      setWeeklyData(data);
    };
    loadWeeklyData();
  }, [habitId, getWeeklyProgress, refreshKey]);

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="flex gap-1 mt-3 pt-3 border-t border-slate-700/50">
      {weeklyData.map((completed, index) => (
        <div
          key={index}
          className={`flex-1 h-8 rounded-md flex items-center justify-center text-xs font-medium transition-all duration-300 border border-white/20 ${
            completed
              ? 'bg-green-500/80 text-white shadow-lg shadow-green-500/30'
              : 'bg-red-500/20 text-red-300/70 shadow-sm'
          }`}
        >
          {dayLabels[index]}
        </div>
      ))}
    </div>
  );
};

// Detailed Habit View Component
const HabitDetailView: React.FC<{
  habit: HabitWithStats;
  onBack: () => void;
  onToggleCompletion: (habit: HabitWithStats) => void;
  getWeeklyProgress: (id: string) => Promise<boolean[]>;
  getMonthlyProgress: (id: string) => Promise<{ date: number; completed: boolean; dateString: string }[]>;
  getMonthlyJournal: (id: string) => Promise<string>;
  updateMonthlyJournal: (id: string, content: string) => Promise<void>;
  refreshKey: number;
}> = ({ habit, onBack, onToggleCompletion, getWeeklyProgress, getMonthlyProgress, getMonthlyJournal, updateMonthlyJournal, refreshKey }) => {
  const [monthlyData, setMonthlyData] = React.useState<{ date: number; completed: boolean; dateString: string }[]>([]);
  const [journalContent, setJournalContent] = React.useState<string>('');
  const [isJournalLoading, setIsJournalLoading] = React.useState(false);
  const [autoSaveTimeout, setAutoSaveTimeout] = React.useState<NodeJS.Timeout | null>(null);
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const isMobile = useIsMobile();

  React.useEffect(() => {
    const loadMonthlyData = async () => {
      const data = await getMonthlyProgress(habit.id);
      setMonthlyData(data);
    };

    const loadJournal = async () => {
      const content = await getMonthlyJournal(habit.id);
      setJournalContent(content);
    };

    loadMonthlyData();
    loadJournal();
  }, [habit.id, getMonthlyProgress, getMonthlyJournal, refreshKey]);

  const handleJournalSave = async () => {
    setIsJournalLoading(true);
    setSaveStatus('saving');
    try {
      await updateMonthlyJournal(habit.id, journalContent);
      console.log('Journal saved successfully');
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error saving journal:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsJournalLoading(false);
    }
  };

  const handleJournalChange = (value: string) => {
    setJournalContent(value);
    setSaveStatus('idle');

    // Clear existing timeout
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    // Set new timeout for auto-save after 2 seconds of inactivity
    const timeout = setTimeout(async () => {
      if (value.trim() !== '') {
        setSaveStatus('saving');
        try {
          await updateMonthlyJournal(habit.id, value);
          console.log('Journal auto-saved');
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (error) {
          console.error('Error auto-saving journal:', error);
          setSaveStatus('error');
          setTimeout(() => setSaveStatus('idle'), 3000);
        }
      }
    }, 2000);

    setAutoSaveTimeout(timeout);
  };

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [autoSaveTimeout]);

  const getCurrentMonthName = () => {
    const now = new Date();
    return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };



  return (
    <div className={`${isMobile ? 'p-4 space-y-4' : 'p-6 space-y-6'} bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen`}>
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-slate-400 hover:text-white"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div className="flex items-center gap-3">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: habit.color }}
          />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            {habit.title}
          </h1>
        </div>
      </div>

      {/* Description */}
      {habit.description && (
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50">
          <CardContent className="p-6">
            <p className="text-slate-300">{habit.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50">
        <CardContent className="p-6">
          <div className={`${isMobile ? 'flex flex-col space-y-4' : 'flex items-center justify-between'}`}>
            <div className={isMobile ? 'text-center' : ''}>
              <h3 className="text-lg font-semibold text-white mb-1">Today's Progress</h3>
              <p className="text-slate-400 text-sm">
                {habit.completed_today ? 'Completed for today!' : 'Mark as complete when done'}
              </p>
            </div>
            <Button
              onClick={() => onToggleCompletion(habit)}
              className={`${
                habit.completed_today
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              } ${isMobile ? 'w-full' : ''}`}
            >
              {habit.completed_today ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Completed
                </>
              ) : (
                <>
                  <Circle className="mr-2 h-4 w-4" />
                  Mark Complete
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Grid */}
      <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-1 md:grid-cols-4 gap-6'}`}>
        <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20">
          <CardContent className={`${isMobile ? 'p-4' : 'p-6'} text-center`}>
            <Flame className="text-orange-400 mx-auto mb-2" size={isMobile ? 20 : 24} />
            <div className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-orange-400`}>{habit.current_streak}</div>
            <div className="text-sm text-slate-400">Current Streak</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
          <CardContent className={`${isMobile ? 'p-4' : 'p-6'} text-center`}>
            <TrendingUp className="text-green-400 mx-auto mb-2" size={isMobile ? 20 : 24} />
            <div className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-green-400`}>{habit.completion_rate}%</div>
            <div className="text-sm text-slate-400">Completion Rate</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
          <CardContent className={`${isMobile ? 'p-4' : 'p-6'} text-center`}>
            <Target className="text-blue-400 mx-auto mb-2" size={isMobile ? 20 : 24} />
            <div className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-blue-400`}>{habit.total_completions}</div>
            <div className="text-sm text-slate-400">Total Completions</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-violet-500/10 border border-purple-500/20">
          <CardContent className={`${isMobile ? 'p-4' : 'p-6'} text-center`}>
            <Calendar className="text-purple-400 mx-auto mb-2" size={isMobile ? 20 : 24} />
            <div className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-purple-400`}>
              {habit.target_frequency}x
            </div>
            <div className="text-sm text-slate-400">{habit.frequency_type}</div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Calendar View */}
      <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">{getCurrentMonthName()}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`grid grid-cols-7 ${isMobile ? 'gap-1' : 'gap-3'}`}>
            {monthlyData.map((dayData) => (
              <div
                key={dayData.date}
                className={`${
                  isMobile ? 'w-8 h-8 text-xs' : 'w-12 h-12 text-sm'
                } rounded-lg transition-all duration-300 flex items-center justify-center font-medium border-2 ${
                  dayData.completed
                    ? 'bg-green-500/80 border-green-400 text-white shadow-lg shadow-green-500/30'
                    : 'bg-slate-700/30 border-slate-600/50 text-slate-300 hover:border-slate-500/70'
                }`}
                title={`${getCurrentMonthName().split(' ')[0]} ${dayData.date}, ${getCurrentMonthName().split(' ')[1]} - ${dayData.completed ? 'Completed' : 'Not completed'}`}
              >
                {dayData.date}
              </div>
            ))}
          </div>
          <div className={`flex items-center ${isMobile ? 'flex-col space-y-2' : 'gap-4'} mt-6 text-sm text-slate-400`}>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500/80 border-2 border-green-400 rounded-lg"></div>
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-slate-700/30 border-2 border-slate-600/50 rounded-lg"></div>
              <span>Not completed</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Journal */}
      <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50">
        <CardHeader>
          <CardTitle className={`text-white ${isMobile ? 'flex flex-col space-y-2' : 'flex items-center justify-between'}`}>
            <span>Monthly Journal - {getCurrentMonthName()}</span>
            <div className={`${isMobile ? 'self-start' : ''}`}>
              {saveStatus === 'saving' && (
                <span className="text-sm text-yellow-400">Saving...</span>
              )}
              {saveStatus === 'saved' && (
                <span className="text-sm text-green-400">Saved ✓</span>
              )}
              {saveStatus === 'error' && (
                <span className="text-sm text-red-400">Error saving</span>
              )}
            </div>
          </CardTitle>
          <p className="text-slate-400 text-sm">
            Reflect on your progress, challenges, and insights for this month. Auto-saves as you type.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={journalContent}
            onChange={(e) => handleJournalChange(e.target.value)}
            placeholder="Write about your habit journey this month..."
            className="min-h-[120px] bg-slate-900/50 border-slate-600/50 text-white placeholder:text-slate-500 resize-none"
            rows={6}
          />
          <div className={`${isMobile ? 'flex flex-col space-y-2' : 'flex justify-between items-center'}`}>
            <div className="text-sm text-slate-500">
              {journalContent.length} characters
            </div>
            <Button
              onClick={handleJournalSave}
              disabled={isJournalLoading || saveStatus === 'saving'}
              className={`bg-blue-600 hover:bg-blue-700 text-white ${isMobile ? 'w-full' : ''}`}
            >
              {isJournalLoading || saveStatus === 'saving' ? 'Saving...' : 'Save Now'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const HabitsView: React.FC = () => {
  const { habits, loading, createHabit, updateHabit, deleteHabit, logHabitCompletion, removeHabitLog, getWeeklyProgress, getMonthlyProgress, getMonthlyJournal, updateMonthlyJournal } = useHabits();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [selectedHabit, setSelectedHabit] = useState<HabitWithStats | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const isMobile = useIsMobile();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    color: '#8B5CF6',
    target_frequency: 1,
    frequency_type: 'daily' as 'daily' | 'weekly' | 'monthly'
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      color: '#8B5CF6',
      target_frequency: 1,
      frequency_type: 'daily'
    });
  };

  const handleCreateHabit = async () => {
    if (!formData.title.trim()) return;
    
    await createHabit(formData);
    setShowCreateDialog(false);
    resetForm();
  };

  const handleUpdateHabit = async () => {
    if (!editingHabit || !formData.title.trim()) return;
    
    await updateHabit(editingHabit.id, formData);
    setEditingHabit(null);
    resetForm();
  };

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setFormData({
      title: habit.title,
      description: habit.description || '',
      color: habit.color || '#8B5CF6',
      target_frequency: habit.target_frequency || 1,
      frequency_type: habit.frequency_type || 'daily'
    });
  };

  const handleToggleCompletion = async (habit: any) => {
    if (habit.completed_today) {
      await removeHabitLog(habit.id);
    } else {
      await logHabitCompletion(habit.id);
    }
    // Trigger refresh of weekly progress bars
    setRefreshKey(prev => prev + 1);
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return 'text-orange-400';
    if (streak >= 7) return 'text-yellow-400';
    if (streak >= 3) return 'text-green-400';
    return 'text-slate-400';
  };

  const getCompletionRateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-400';
    if (rate >= 60) return 'text-yellow-400';
    if (rate >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading habits...</p>
        </div>
      </div>
    );
  }

  // Show detailed view if a habit is selected
  if (selectedHabit) {
    return (
      <HabitDetailView
        habit={selectedHabit}
        onBack={() => setSelectedHabit(null)}
        onToggleCompletion={handleToggleCompletion}
        getWeeklyProgress={getWeeklyProgress}
        getMonthlyProgress={getMonthlyProgress}
        getMonthlyJournal={getMonthlyJournal}
        updateMonthlyJournal={updateMonthlyJournal}
        refreshKey={refreshKey}
      />
    );
  }

  return (
    <div className={`${isMobile ? 'p-4 space-y-4' : 'p-6 space-y-6'} bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen`}>
      {/* Header */}
      <div className={`${isMobile ? 'flex flex-col space-y-3' : 'flex items-center justify-between'}`}>
        <div className={isMobile ? 'text-center' : ''}>
          <h1 className={`font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent ${
            isMobile ? 'text-2xl' : 'text-3xl'
          }`}>
            Habit Tracker
          </h1>
          <p className={`text-slate-400 mt-1 ${isMobile ? 'text-sm' : ''}`}>Build lasting habits, one day at a time</p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button
              className={`bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white ${
                isMobile ? 'w-full h-12 text-base' : ''
              }`}
              onClick={() => {
                resetForm();
                setShowCreateDialog(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Habit
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Create New Habit</DialogTitle>
              <DialogDescription className="text-slate-400">
                Add a new habit to track your daily progress.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Title</label>
                <Input
                  placeholder="e.g., Drink 8 glasses of water"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Description</label>
                <Textarea
                  placeholder="Optional description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">Frequency</label>
                  <Select 
                    value={formData.frequency_type} 
                    onValueChange={(value: 'daily' | 'weekly' | 'monthly') => 
                      setFormData({ ...formData, frequency_type: value })
                    }
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">Target</label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.target_frequency}
                    onChange={(e) => setFormData({ ...formData, target_frequency: parseInt(e.target.value) || 1 })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Color</label>
                <div className="flex gap-2">
                  {['#8B5CF6', '#EF4444', '#10B981', '#F59E0B', '#3B82F6', '#EC4899'].map((color) => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full border-2 ${
                        formData.color === color ? 'border-white' : 'border-slate-600'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({ ...formData, color })}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateHabit} disabled={!formData.title.trim()}>
                Create Habit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-1 md:grid-cols-4 gap-6'}`}>
        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
          <CardContent className={`${isMobile ? 'p-4' : 'p-6'} text-center`}>
            <Target className="text-blue-400 mx-auto mb-2" size={isMobile ? 20 : 24} />
            <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-blue-400`}>{habits.length}</div>
            <div className="text-sm text-slate-400">Active Habits</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
          <CardContent className={`${isMobile ? 'p-4' : 'p-6'} text-center`}>
            <CheckCircle2 className="text-green-400 mx-auto mb-2" size={isMobile ? 20 : 24} />
            <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-green-400`}>
              {habits.filter(h => h.completed_today).length}
            </div>
            <div className="text-sm text-slate-400">Completed Today</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20">
          <CardContent className={`${isMobile ? 'p-4' : 'p-6'} text-center`}>
            <Flame className="text-orange-400 mx-auto mb-2" size={isMobile ? 20 : 24} />
            <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-orange-400`}>
              {Math.max(...habits.map(h => h.current_streak), 0)}
            </div>
            <div className="text-sm text-slate-400">Best Streak</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-violet-500/10 border border-purple-500/20">
          <CardContent className={`${isMobile ? 'p-4' : 'p-6'} text-center`}>
            <TrendingUp className="text-purple-400 mx-auto mb-2" size={isMobile ? 20 : 24} />
            <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-purple-400`}>
              {habits.length > 0 ? Math.round(habits.reduce((acc, h) => acc + h.completion_rate, 0) / habits.length) : 0}%
            </div>
            <div className="text-sm text-slate-400">Avg. Completion</div>
          </CardContent>
        </Card>
      </div>

      {/* Habits List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {habits.map((habit) => (
          <Card
            key={habit.id}
            className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 cursor-pointer group"
            onClick={() => setSelectedHabit(habit)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: habit.color }}
                    />
                    {habit.title}
                  </CardTitle>
                  {habit.description && (
                    <p className="text-sm text-slate-400 mt-1 line-clamp-2">{habit.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedHabit(habit)}
                    className="text-slate-400 hover:text-white"
                    aria-label="Open details"
                    title="Open details"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditHabit(habit)}
                    className="text-slate-400 hover:text-white"
                    aria-label="Edit"
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteHabit(habit.id)}
                    className="text-slate-400 hover:text-red-400"
                    aria-label="Delete"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-3">
                {/* Completion Button */}
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleCompletion(habit);
                  }}
                  className={`w-full ${
                    habit.completed_today
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                  }`}
                >
                  {habit.completed_today ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Completed Today
                    </>
                  ) : (
                    <>
                      <Circle className="mr-2 h-4 w-4" />
                      Mark Complete
                    </>
                  )}
                </Button>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className={`text-lg font-bold ${getStreakColor(habit.current_streak)}`}>
                      {habit.current_streak}
                    </div>
                    <div className="text-xs text-slate-500">Streak</div>
                  </div>
                  <div>
                    <div className={`text-lg font-bold ${getCompletionRateColor(habit.completion_rate)}`}>
                      {habit.completion_rate}%
                    </div>
                    <div className="text-xs text-slate-500">Rate</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-slate-300">
                      {habit.total_completions}
                    </div>
                    <div className="text-xs text-slate-500">Total</div>
                  </div>
                </div>

                {/* Frequency Badge */}
                <div className="flex justify-center">
                  <Badge variant="secondary" className="text-xs">
                    {habit.target_frequency}x {habit.frequency_type}
                  </Badge>
                </div>

                {/* Weekly Progress Bar */}
                <WeeklyProgressBar habitId={habit.id} getWeeklyProgress={getWeeklyProgress} refreshKey={refreshKey} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {habits.length === 0 && (
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50">
          <CardContent className="p-12 text-center">
            <Target className="text-slate-500 mx-auto mb-4" size={48} />
            <h3 className="text-xl font-semibold text-white mb-2">No habits yet</h3>
            <p className="text-slate-400 mb-6">
              Start building better habits by creating your first one.
            </p>
            <Button 
              onClick={() => setShowCreateDialog(true)}
              className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Habit
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingHabit} onOpenChange={() => setEditingHabit(null)}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Habit</DialogTitle>
            <DialogDescription className="text-slate-400">
              Update your habit details.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Title</label>
              <Input
                placeholder="e.g., Drink 8 glasses of water"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Description</label>
              <Textarea
                placeholder="Optional description..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Frequency</label>
                <Select 
                  value={formData.frequency_type} 
                  onValueChange={(value: 'daily' | 'weekly' | 'monthly') => 
                    setFormData({ ...formData, frequency_type: value })
                  }
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Target</label>
                <Input
                  type="number"
                  min="1"
                  value={formData.target_frequency}
                  onChange={(e) => setFormData({ ...formData, target_frequency: parseInt(e.target.value) || 1 })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Color</label>
              <div className="flex gap-2">
                {['#8B5CF6', '#EF4444', '#10B981', '#F59E0B', '#3B82F6', '#EC4899'].map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full border-2 ${
                      formData.color === color ? 'border-white' : 'border-slate-600'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, color })}
                  />
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingHabit(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateHabit} disabled={!formData.title.trim()}>
              Update Habit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HabitsView;
