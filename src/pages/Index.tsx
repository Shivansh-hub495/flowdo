
import React, { useState } from 'react';
import Navigation from '@/components/Navigation';
import TodayView from '@/components/TodayView';
import EisenhowerMatrix from '@/components/EisenhowerMatrix';
import NotesView from '@/components/NotesView';
import PomodoroTimer from '@/components/PomodoroTimer';
import StatsView from '@/components/StatsView';

interface Task {
  id: string;
  title: string;
  description?: string;
  quadrant?: 'urgent-important' | 'important' | 'urgent' | 'neither';
}

const Index = () => {
  const [activeView, setActiveView] = useState('today');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showPomodoro, setShowPomodoro] = useState(false);

  const handleStartPomodoro = (task: Task) => {
    setSelectedTask(task);
    setShowPomodoro(true);
  };

  const handlePomodoroComplete = () => {
    console.log('Pomodoro session completed for task:', selectedTask?.title);
    setShowPomodoro(false);
    setSelectedTask(null);
  };

  const handleBackFromPomodoro = () => {
    setShowPomodoro(false);
    setSelectedTask(null);
  };

  if (showPomodoro) {
    return (
      <PomodoroTimer
        selectedTask={selectedTask}
        onComplete={handlePomodoroComplete}
        onBack={handleBackFromPomodoro}
      />
    );
  }

  const renderActiveView = () => {
    switch (activeView) {
      case 'today':
        return <TodayView onStartPomodoro={handleStartPomodoro} />;
      case 'matrix':
        return <EisenhowerMatrix onStartPomodoro={handleStartPomodoro} />;
      case 'notes':
        return <NotesView />;
      case 'pomodoro':
        return (
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="text-center max-w-md">
              <h2 className="text-2xl font-bold mb-4">Start a Focus Session</h2>
              <p className="text-muted-foreground mb-6">
                Select a task from your Matrix or Today view to begin a focused Pomodoro session.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => setActiveView('today')}
                  className="w-full p-4 glass rounded-lg border hover:glow transition-all duration-200"
                >
                  <h3 className="font-medium mb-1">Go to Today</h3>
                  <p className="text-sm text-muted-foreground">See today's prioritized tasks</p>
                </button>
                <button
                  onClick={() => setActiveView('matrix')}
                  className="w-full p-4 glass rounded-lg border hover:glow transition-all duration-200"
                >
                  <h3 className="font-medium mb-1">Go to Matrix</h3>
                  <p className="text-sm text-muted-foreground">Choose from all your tasks</p>
                </button>
              </div>
            </div>
          </div>
        );
      case 'stats':
        return <StatsView />;
      default:
        return <TodayView onStartPomodoro={handleStartPomodoro} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {renderActiveView()}
      <Navigation activeView={activeView} onViewChange={setActiveView} />
    </div>
  );
};

export default Index;
