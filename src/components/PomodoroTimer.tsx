import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, ArrowLeft, Target } from 'lucide-react';
import { Task } from '@/hooks/useTasks';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';

interface PomodoroTimerProps {
  selectedTask?: Task | null;
  onBack: () => void;
  onComplete?: () => void;
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ selectedTask, onBack }) => {
  const isMobile = useIsMobile();

  // Check if this is being rendered from a task (has selectedTask) vs navigation menu
  const isTaskFocus = !!selectedTask;

  // Open Clock.html in the same page with task information
  const startFocusSession = async () => {
    const taskTitle = selectedTask?.title || '';
    const taskId = selectedTask?.id || '';
    const encodedTitle = encodeURIComponent(taskTitle);
    const encodedId = encodeURIComponent(taskId);

    // Get current session token to pass to Clock.html
    const { data: { session } } = await supabase.auth.getSession();
    const authToken = session?.access_token || '';
    const userId = session?.user?.id || '';

    window.location.href = `/Clock.html?task=${encodedTitle}&taskId=${encodedId}&token=${authToken}&userId=${userId}`;
  };

  return (
    <div className={isTaskFocus ? '' : `${isMobile ? 'p-2' : 'p-6'} flex items-center justify-center min-h-screen`}>
      <Card className={`bg-slate-900/50 border-slate-700/50 shadow-xl w-full ${isMobile ? 'max-w-xs mx-2' : 'max-w-md'}`}>
        <CardHeader className={`${isMobile ? 'pb-2 px-3' : 'pb-4'}`}>
          <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'justify-between items-center'}`}>
            <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-4'}`}>
              <div className={`${isMobile ? 'p-2' : 'p-3'} rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg`}>
                {selectedTask ? (
                  <Target className={`${isMobile ? 'w-4 h-4' : 'w-6 h-6'} text-white`} />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className={`${isMobile ? 'w-4 h-4' : 'w-6 h-6'} text-white`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                )}
              </div>
              <div>
                <CardTitle className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold tracking-tight text-white`}>
                  {selectedTask ? 'Task Focus Session' : 'Focus Session'}
                </CardTitle>
                <p className={`text-slate-400 ${isMobile ? 'text-xs' : 'text-sm'} mt-1`}>
                  {selectedTask ? `Working on: ${selectedTask.title}` : 'Boost your productivity with deep focus'}
                </p>
              </div>
            </div>

            <Button
              onClick={onBack}
              variant="ghost"
              className={`text-slate-400 hover:text-white hover:bg-slate-800 ${isMobile ? 'text-sm px-2 py-1' : ''}`}
            >
              <ArrowLeft className={`${isMobile ? 'mr-1 h-3 w-3' : 'mr-2 h-4 w-4'}`} />
              Back
            </Button>
          </div>
        </CardHeader>

        <CardContent className={`${isMobile ? 'px-3' : ''}`}>
          <div className={`${isMobile ? 'space-y-4 py-2' : 'space-y-8 py-4'}`}>
            <div className={`text-center ${isMobile ? 'space-y-2' : 'space-y-4'}`}>
              <h2 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-white`}>
                {selectedTask ? 'Ready to focus on your task?' : 'Ready to achieve more?'}
              </h2>
              <p className={`text-slate-300 ${isMobile ? 'text-sm' : ''}`}>
                {selectedTask
                  ? `Start your focus session to work on "${selectedTask.title}" with deep concentration.`
                  : 'Start your focus session to enter a state of deep work and accomplish your most important tasks.'
                }
              </p>
            </div>

            <div className="flex justify-center">
              <Button
                onClick={startFocusSession}
                className={`bg-gradient-to-br from-violet-500 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-violet-500/20 transition-all duration-300 hover:scale-105 ${
                  isMobile ? 'px-4 py-3 text-sm' : 'px-8 py-6 text-lg'
                }`}
              >
                <Play className={`${isMobile ? 'mr-1 h-4 w-4' : 'mr-2 h-5 w-5'}`} />
                Start Focus Session
              </Button>
            </div>

            <div className={`text-center text-slate-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>
              <p>Eliminate distractions and maximize your productivity</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PomodoroTimer;
