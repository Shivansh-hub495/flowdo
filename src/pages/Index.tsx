import React, { useState, createContext, useContext } from 'react';
import { useParams } from 'react-router-dom';
import SidebarNavigation from '@/components/Navigation';
import TodayView from '@/components/TodayView';
import EisenhowerMatrix from '@/components/EisenhowerMatrix';
import TargetsView from '@/components/TargetsView';
import CalendarView from '@/components/CalendarView';
import NotesView from '@/components/NotesView';
import PomodoroTimer from '@/components/PomodoroTimer';
import HabitsView from '@/components/HabitsView';
import ChecklistView from '@/components/ChecklistView';
import StatsView from '@/components/StatsView';
import AchievementsView from '@/components/AchievementsView';
import ChatView from '@/components/ChatView';
import CleanupExpiredTargets from '@/components/CleanupExpiredTargets';
import NoteEditor from '@/components/NoteEditor';
import { SidebarProvider, SidebarInset, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { useSwipeGesture } from '@/hooks/use-mobile';
import { Menu } from 'lucide-react';
import { CalendarProvider } from '@/contexts/CalendarContext';

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
  const { id } = useParams<{ id: string }>();
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
    // Check if we're on a note editor route
    if (window.location.pathname.startsWith('/notes/')) {
      if (window.location.pathname === '/notes/new') {
        return <NoteEditor isNew={true} />;
      } else if (id) {
        return <NoteEditor />;
      }
    }

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
      case 'calendar':
        return <CalendarView />;
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
      case 'checklist':
        return <ChecklistView />;
      case 'stats':
        return <StatsView />;
      case 'achievements':
        return <AchievementsView onViewChange={setActiveView} />;
      case 'chat':
        return <ChatView />;
      case 'cleanup':
        return <CleanupExpiredTargets />;
      default:
        return <TodayView onStartPomodoro={handleStartPomodoro} />;
    }
  };

  // Determine if we should show the header (hide for note editor)
  const showHeader = !window.location.pathname.startsWith('/notes/') || 
                     window.location.pathname === '/notes' ||
                     window.location.pathname === '/notes/';

  return (
    <div className="min-h-screen flex w-full bg-background">
      <SidebarNavigation activeView={activeView} onViewChange={setActiveView} />
      <SidebarInset className="flex-1">
        {/* Hide header for chat, achievements, and note editor pages */}
        {showHeader && activeView !== 'chat' && activeView !== 'achievements' && (
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-white/10 px-4">
            <SidebarTrigger className="md:hidden" />
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">
                {activeView === 'today' && 'Today'}
                {activeView === 'matrix' && 'Eisenhower Matrix'}
                {activeView === 'targets' && 'Future Targets'}
                {activeView === 'calendar' && 'Calendar'}
                {activeView === 'notes' && 'Mind Flow'}
                {activeView === 'pomodoro' && 'Focus Session'}
                {activeView === 'habits' && 'Habit Tracker'}
                {activeView === 'checklist' && 'Checklists'}
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
    <CalendarProvider>
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
    </CalendarProvider>
  );
};

export default Index;