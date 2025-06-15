
import React, { useState, createContext, useContext } from 'react';
import SidebarNavigation from '@/components/Navigation';
import TodayView from '@/components/TodayView';
import EisenhowerMatrix from '@/components/EisenhowerMatrix';
import TargetsView from '@/components/TargetsView';
import NotesView from '@/components/NotesView';
import PomodoroTimer from '@/components/PomodoroTimer';
import HabitsView from '@/components/HabitsView';
import StatsView from '@/components/StatsView';
import AchievementsView from '@/components/AchievementsView';
import ChatView from '@/components/ChatView';
import { SidebarProvider, SidebarInset, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { useSwipeGesture } from '@/hooks/use-mobile';
import { Menu } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description?: string;
  quadrant?: 'urgent-important' | 'important' | 'urgent' | 'neither';
}

// Context to track targets page state
interface TargetsContextType {
  currentSlide: number;
  setCurrentSlide: (slide: number) => void;
}

const TargetsContext = createContext<TargetsContextType | null>(null);

export const useTargetsContext = () => {
  const context = useContext(TargetsContext);
  return context;
};

// Main content component that uses sidebar context for swipe functionality
const MainContent = ({
  activeView,
  setActiveView,
  selectedTask,
  setSelectedTask,
  showPomodoro,
  handleStartPomodoro,
  handlePomodoroComplete,
  handleBackFromPomodoro
}) => {
  const { isMobile, setOpenMobile } = useSidebar();
  const [currentTargetsSlide, setCurrentTargetsSlide] = useState(0);

  // Setup swipe gestures for mobile sidebar (only on mobile and specific conditions)
  useSwipeGesture({
    onSwipeRight: () => {
      if (isMobile) {
        setOpenMobile(true);
      }
    },
    onSwipeLeft: () => {
      if (isMobile) {
        setOpenMobile(false);
      }
    },
    threshold: 50,
    edgeThreshold: 30,
    shouldEnableSwipe: () => {
      // Only enable navbar swipe when:
      // 1. Not on targets page, OR
      // 2. On targets page but viewing "tomorrow" section (slide 0)
      return activeView !== 'targets' || currentTargetsSlide === 0;
    }
  });

  if (showPomodoro) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
        <PomodoroTimer
          selectedTask={selectedTask}
          onComplete={handlePomodoroComplete}
          onBack={handleBackFromPomodoro}
        />
      </div>
    );
  }

  const renderActiveView = () => {
    switch (activeView) {
      case 'today':
        return <TodayView onStartPomodoro={handleStartPomodoro} />;
      case 'matrix':
        return <EisenhowerMatrix onStartPomodoro={handleStartPomodoro} />;
      case 'targets':
        return (
          <TargetsContext.Provider value={{ currentSlide: currentTargetsSlide, setCurrentSlide: setCurrentTargetsSlide }}>
            <TargetsView />
          </TargetsContext.Provider>
        );
      case 'notes':
        return <NotesView />;
      case 'pomodoro':
        return (
          <PomodoroTimer
            selectedTask={null}
            onComplete={() => {}}
            onBack={() => setActiveView('today')}
          />
        );
      case 'habits':
        return <HabitsView />;
      case 'stats':
        return <StatsView />;
      case 'achievements':
        return <AchievementsView onViewChange={setActiveView} />;
      case 'chat':
        return <ChatView />;
      default:
        return <TodayView onStartPomodoro={handleStartPomodoro} />;
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      <SidebarNavigation activeView={activeView} onViewChange={setActiveView} />
      <SidebarInset className="flex-1">
        {/* Hide header for chat and achievements pages */}
        {activeView !== 'chat' && activeView !== 'achievements' && (
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-white/10 px-4">
            <SidebarTrigger className="md:hidden" />
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">
                {activeView === 'today' && 'Today'}
                {activeView === 'matrix' && 'Eisenhower Matrix'}
                {activeView === 'targets' && 'Future Targets'}
                {activeView === 'notes' && 'Mind Flow'}
                {activeView === 'pomodoro' && 'Focus Session'}
                {activeView === 'habits' && 'Habit Tracker'}
                {activeView === 'stats' && 'Progress Stats'}
              </h1>
            </div>
          </header>
        )}
        <main className="flex-1">
          {renderActiveView()}
        </main>
      </SidebarInset>
    </div>
  );
};

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

  return (
    <SidebarProvider>
      <MainContent
        activeView={activeView}
        setActiveView={setActiveView}
        selectedTask={selectedTask}
        setSelectedTask={setSelectedTask}
        showPomodoro={showPomodoro}
        handleStartPomodoro={handleStartPomodoro}
        handlePomodoroComplete={handlePomodoroComplete}
        handleBackFromPomodoro={handleBackFromPomodoro}
      />
    </SidebarProvider>
  );
};

export default Index;
