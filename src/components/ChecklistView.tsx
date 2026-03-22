import React, { useState, useEffect } from 'react';
import { Plus, Check, X, ListChecks, Clock, Sun, Moon, Dumbbell, BookOpen, Bed, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface RoutineItem {
  id: string;
  title: string;
  completed: boolean;
  estimatedTime?: string;
}

interface RoutineCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  items: RoutineItem[];
  lastResetDate?: string;
}

const ChecklistView: React.FC = () => {
  const isMobile = useIsMobile();
  const [routineCategories, setRoutineCategories] = useState<RoutineCategory[]>([
    {
      id: 'before-college',
      title: 'Before College',
      icon: <Sun className="w-5 h-5" />,
      color: 'from-orange-500/10 to-amber-500/10 border-orange-500/30',
      items: [
        { id: '1', title: 'Wake up early (6:00 AM)', completed: false, estimatedTime: '5 min' },
        { id: '2', title: 'Brush teeth and freshen up', completed: false, estimatedTime: '10 min' },
        { id: '3', title: 'Have breakfast', completed: false, estimatedTime: '20 min' },
        { id: '4', title: 'Review today\'s schedule', completed: false, estimatedTime: '5 min' },
        { id: '5', title: 'Pack college bag', completed: false, estimatedTime: '10 min' },
        { id: '6', title: 'Take vitamins/supplements', completed: false, estimatedTime: '2 min' },
      ],
    },
    {
      id: 'after-college',
      title: 'After College',
      icon: <Moon className="w-5 h-5" />,
      color: 'from-blue-500/10 to-cyan-500/10 border-blue-500/30',
      items: [
        { id: '7', title: 'Review notes and assignments', completed: false, estimatedTime: '30 min' },
        { id: '8', title: 'Complete homework/assignments', completed: false, estimatedTime: '60 min' },
        { id: '9', title: 'Plan tomorrow\'s classes', completed: false, estimatedTime: '10 min' },
        { id: '10', title: 'Organize study materials', completed: false, estimatedTime: '15 min' },
        { id: '11', title: 'Update calendar with deadlines', completed: false, estimatedTime: '5 min' },
      ],
    },
    {
      id: 'exercise',
      title: 'Exercise Routine',
      icon: <Dumbbell className="w-5 h-5" />,
      color: 'from-green-500/10 to-emerald-500/10 border-green-500/30',
      items: [
        { id: '12', title: '10 min warm-up', completed: false, estimatedTime: '10 min' },
        { id: '13', title: '20 min cardio workout', completed: false, estimatedTime: '20 min' },
        { id: '14', title: '15 min strength training', completed: false, estimatedTime: '15 min' },
        { id: '15', title: '5 min cool down stretches', completed: false, estimatedTime: '5 min' },
        { id: '16', title: 'Log workout progress', completed: false, estimatedTime: '3 min' },
      ],
    },
    {
      id: 'study',
      title: 'Study Sessions',
      icon: <BookOpen className="w-5 h-5" />,
      color: 'from-purple-500/10 to-violet-500/10 border-purple-500/30',
      items: [
        { id: '17', title: 'Review previous day\'s material', completed: false, estimatedTime: '20 min' },
        { id: '18', title: 'Focus study session (Pomodoro)', completed: false, estimatedTime: '50 min' },
        { id: '19', title: 'Practice problems/exercises', completed: false, estimatedTime: '30 min' },
        { id: '20', title: 'Create summary notes', completed: false, estimatedTime: '15 min' },
        { id: '21', title: 'Review and revise', completed: false, estimatedTime: '10 min' },
      ],
    },
    {
      id: 'evening',
      title: 'Evening Wind Down',
      icon: <Bed className="w-5 h-5" />,
      color: 'from-indigo-500/10 to-purple-500/10 border-indigo-500/30',
      items: [
        { id: '22', title: 'Have dinner', completed: false, estimatedTime: '30 min' },
        { id: '23', title: 'Reflect on the day', completed: false, estimatedTime: '10 min' },
        { id: '24', title: 'Prepare clothes for tomorrow', completed: false, estimatedTime: '5 min' },
        { id: '25', title: 'Read or relaxing activity', completed: false, estimatedTime: '30 min' },
        { id: '26', title: 'Set sleep schedule (10:30 PM)', completed: false, estimatedTime: '1 min' },
      ],
    },
  ]);

  const [lastResetDate, setLastResetDate] = useState<string>('');

  // Check if we need to reset daily routines
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const savedResetDate = localStorage.getItem('lastResetDate');
    
    if (savedResetDate !== today) {
      // Reset all completed states
      setRoutineCategories(prev => 
        prev.map(category => ({
          ...category,
          items: category.items.map(item => ({ ...item, completed: false }))
        }))
      );
      localStorage.setItem('lastResetDate', today);
      setLastResetDate(today);
    } else {
      setLastResetDate(savedResetDate || today);
    }
  }, []);

  const toggleItemComplete = (categoryId: string, itemId: string) => {
    setRoutineCategories(prev =>
      prev.map(category =>
        category.id === categoryId
          ? {
              ...category,
              items: category.items.map(item =>
                item.id === itemId ? { ...item, completed: !item.completed } : item
              ),
            }
          : category
      )
    );
  };

  const addNewItem = (categoryId: string, title: string, estimatedTime?: string) => {
    if (!title.trim()) return;

    const newItem: RoutineItem = {
      id: Date.now().toString(),
      title: title.trim(),
      completed: false,
      estimatedTime: estimatedTime?.trim() || '',
    };

    setRoutineCategories(prev =>
      prev.map(category =>
        category.id === categoryId
          ? { ...category, items: [...category.items, newItem] }
          : category
      )
    );
  };

  const deleteItem = (categoryId: string, itemId: string) => {
    setRoutineCategories(prev =>
      prev.map(category =>
        category.id === categoryId
          ? {
              ...category,
              items: category.items.filter(item => item.id !== itemId),
            }
          : category
      )
    );
  };

  const resetAllRoutines = () => {
    setRoutineCategories(prev => 
      prev.map(category => ({
        ...category,
        items: category.items.map(item => ({ ...item, completed: false }))
      }))
    );
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('lastResetDate', today);
    setLastResetDate(today);
  };

  const getCompletionStats = (category: RoutineCategory) => {
    const total = category.items.length;
    const completed = category.items.filter(item => item.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percentage };
  };

  const getTotalDailyProgress = () => {
    const totalItems = routineCategories.reduce((sum, cat) => sum + cat.items.length, 0);
    const completedItems = routineCategories.reduce((sum, cat) => 
      sum + cat.items.filter(item => item.completed).length, 0
    );
    return { total: totalItems, completed: completedItems, percentage: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0 };
  };

  const dailyStats = getTotalDailyProgress();

  return (
    <div className={cn(
      "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen",
      isMobile ? "p-3 space-y-3" : "p-6 space-y-6"
    )}>
      {/* Header */}
      <div className={cn(
        "text-center",
        isMobile ? "mb-4" : "mb-8"
      )}>
        <div className={cn(
          "inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/20 mb-4",
          isMobile ? "w-12 h-12" : "w-16 h-16"
        )}>
          <ListChecks className="text-emerald-400" size={isMobile ? 20 : 28} />
        </div>
        <h1 className={cn(
          "font-bold mb-3 bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent",
          isMobile ? "text-2xl" : "text-4xl"
        )}>
          Daily Routines
        </h1>
        <p className={cn(
          "text-muted-foreground mb-4",
          isMobile ? "text-sm" : "text-lg"
        )}>
          Track your daily habits and routines
        </p>
        
        {/* Daily Progress Overview */}
        <div className={cn(
          "mx-auto mb-6",
          isMobile ? "max-w-full px-2" : "max-w-md"
        )}>
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50">
            <CardContent className={isMobile ? "p-3" : "p-4"}>
              <div className={cn(
                "flex items-center justify-between mb-2",
                isMobile && "flex-col gap-1 text-center"
              )}>
                <h3 className={cn(
                  "font-semibold text-white",
                  isMobile ? "text-sm" : "text-sm"
                )}>Today's Progress</h3>
                <span className={cn(
                  "text-slate-400",
                  isMobile ? "text-xs" : "text-xs"
                )}>
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: isMobile ? 'short' : 'long', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
              <div className={cn(
                "flex items-center justify-between text-slate-300 mb-2",
                isMobile ? "text-xs" : "text-sm"
              )}>
                <span>{dailyStats.completed} of {dailyStats.total} completed</span>
                <span className="font-semibold">{dailyStats.percentage}%</span>
              </div>
              <Progress value={dailyStats.percentage} className="h-2 bg-slate-700" />
            </CardContent>
          </Card>
        </div>

        {/* Reset Button */}
        <Button 
          onClick={resetAllRoutines}
          variant="outline"
          size={isMobile ? "sm" : "default"}
          className={cn(
            "bg-slate-800/20 border-slate-600 text-slate-300 hover:bg-slate-700/30 hover:text-white",
            isMobile && "text-xs"
          )}
        >
          <RotateCcw className={cn("mr-2", isMobile ? "h-3 w-3" : "h-4 w-4")} />
          {isMobile ? "Reset All" : "Reset All Routines"}
        </Button>
      </div>

      {/* Routine Categories Grid */}
      <div className={cn(
        "grid",
        isMobile 
          ? "grid-cols-1 gap-3" 
          : "grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6"
      )}>
        {routineCategories.map((category) => {
          const stats = getCompletionStats(category);
          
          return (
            <RoutineCategoryCard
              key={category.id}
              category={category}
              stats={stats}
              isMobile={isMobile}
              onToggleItem={toggleItemComplete}
              onAddItem={addNewItem}
              onDeleteItem={deleteItem}
            />
          );
        })}
      </div>
    </div>
  );
};



interface RoutineCategoryCardProps {
  category: RoutineCategory;
  stats: { total: number; completed: number; percentage: number };
  isMobile: boolean;
  onToggleItem: (categoryId: string, itemId: string) => void;
  onAddItem: (categoryId: string, title: string, estimatedTime?: string) => void;
  onDeleteItem: (categoryId: string, itemId: string) => void;
}

const RoutineCategoryCard: React.FC<RoutineCategoryCardProps> = ({
  category,
  stats,
  isMobile,
  onToggleItem,
  onAddItem,
  onDeleteItem,
}) => {
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemTime, setNewItemTime] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddItem = () => {
    if (newItemTitle.trim()) {
      onAddItem(category.id, newItemTitle, newItemTime);
      setNewItemTitle('');
      setNewItemTime('');
      setShowAddForm(false);
    }
  };

  const getTotalEstimatedTime = () => {
    return category.items.reduce((total, item) => {
      if (item.estimatedTime) {
        const time = parseInt(item.estimatedTime.replace(/\D/g, '')) || 0;
        return total + time;
      }
      return total;
    }, 0);
  };

  return (
    <Card className={cn(
      'bg-gradient-to-br border transition-all duration-300 hover:shadow-lg',
      category.color,
      isMobile && "mx-1" // Add slight margin on mobile
    )}>
      <CardHeader className={isMobile ? 'pb-2' : 'pb-4'}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className={cn(
              "rounded-lg bg-white/10",
              isMobile ? "p-1.5" : "p-2"
            )}>
              <div className={cn(
                "text-white",
                isMobile ? "[&>svg]:w-4 [&>svg]:h-4" : "[&>svg]:w-5 [&>svg]:h-5"
              )}>
                {category.icon}
              </div>
            </div>
            <div className="flex-1 min-w-0"> {/* Add min-w-0 for text truncation */}
              <CardTitle className={cn(
                "text-white mb-1 truncate", // Add truncate for long titles
                isMobile ? 'text-base' : 'text-xl'
              )}>
                {category.title}
              </CardTitle>
              <div className={cn(
                "flex items-center gap-2 text-slate-400",
                isMobile ? "text-xs flex-wrap" : "text-xs gap-3"
              )}>
                <span>{stats.completed}/{stats.total} tasks</span>
                <span className="whitespace-nowrap">~{getTotalEstimatedTime()} min</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className={isMobile ? "mt-2" : "mt-3"}>
          <div className={cn(
            "flex items-center justify-between text-slate-300 mb-2",
            isMobile ? "text-xs" : "text-sm"
          )}>
            <span>{stats.completed} of {stats.total} completed</span>
            <span className="font-semibold">{stats.percentage}%</span>
          </div>
          <Progress value={stats.percentage} className={cn(
            "bg-slate-700/30",
            isMobile ? "h-1.5" : "h-2"
          )} />
        </div>
      </CardHeader>

      <CardContent className={cn(
        isMobile ? 'px-3 pb-3 space-y-2' : 'space-y-3'
      )}>
        {/* Routine Items */}
        <div className={isMobile ? "space-y-1.5" : "space-y-2"}>
          {category.items.map((item) => (
            <div
              key={item.id}
              className={cn(
                'flex items-center rounded-lg bg-slate-800/30 border border-slate-700/30 transition-all duration-200',
                isMobile ? 'gap-2 p-2' : 'gap-3 p-3',
                item.completed && 'opacity-60'
              )}
            >
              <Button
                variant="ghost"
                size={isMobile ? "sm" : "sm"}
                onClick={() => onToggleItem(category.id, item.id)}
                className={cn(
                  'rounded-md transition-colors shrink-0',
                  isMobile ? 'p-1 min-w-[28px] h-7' : 'p-1',
                  item.completed
                    ? 'text-emerald-400 hover:text-emerald-300 bg-emerald-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                )}
              >
                <Check size={isMobile ? 14 : 16} />
              </Button>

              <div className="flex-1 min-w-0"> {/* min-w-0 allows text to shrink */}
                <p className={cn(
                  'font-medium transition-colors',
                  isMobile ? 'text-xs leading-relaxed' : 'text-sm',
                  item.completed
                    ? 'text-slate-400 line-through'
                    : 'text-slate-200'
                )}>
                  {item.title}
                </p>
              </div>

              {item.estimatedTime && (
                <Badge className={cn(
                  "bg-slate-600/30 text-slate-300 shrink-0",
                  isMobile ? "text-xs px-1.5 py-0.5" : "text-xs"
                )} variant="secondary">
                  <Clock className={cn(
                    "mr-1",
                    isMobile ? "w-2.5 h-2.5" : "w-3 h-3"
                  )} />
                  {isMobile ? item.estimatedTime.replace(' min', 'm') : item.estimatedTime}
                </Badge>
              )}

              <Button
                variant="ghost"
                size={isMobile ? "sm" : "sm"}
                onClick={() => onDeleteItem(category.id, item.id)}
                className={cn(
                  "text-slate-400 hover:text-red-400 hover:bg-red-500/10 shrink-0",
                  isMobile ? "p-1 min-w-[28px] h-7" : "p-1"
                )}
              >
                <X size={isMobile ? 12 : 14} />
              </Button>
            </div>
          ))}
        </div>

        {/* Add New Item */}
        {!showAddForm ? (
          <Button
            onClick={() => setShowAddForm(true)}
            variant="ghost"
            className="w-full border-2 border-dashed border-slate-600/30 text-slate-400 hover:text-white hover:border-slate-500/50 hover:bg-slate-700/20"
          >
            <Plus size={16} className="mr-2" />
            Add Task
          </Button>
        ) : (
          <div className="space-y-2 p-3 bg-slate-700/20 rounded-lg border border-slate-600/30">
            <Input
              placeholder="Task title..."
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              className="bg-slate-700/50 border-slate-600/50 text-white placeholder:text-slate-400"
            />
            <Input
              placeholder="Estimated time (e.g., 10 min)..."
              value={newItemTime}
              onChange={(e) => setNewItemTime(e.target.value)}
              className="bg-slate-700/50 border-slate-600/50 text-white placeholder:text-slate-400"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleAddItem}
                disabled={!newItemTitle.trim()}
                size="sm"
                className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-600/30"
              >
                Add
              </Button>
              <Button
                onClick={() => {
                  setShowAddForm(false);
                  setNewItemTitle('');
                  setNewItemTime('');
                }}
                size="sm"
                variant="outline"
                className="border-slate-600 text-slate-400 hover:text-white"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChecklistView;