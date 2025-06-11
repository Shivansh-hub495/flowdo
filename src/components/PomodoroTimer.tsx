import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, ArrowLeft, Target } from 'lucide-react';
import { Task } from '@/hooks/useTasks';
import { supabase } from '@/integrations/supabase/client';

interface PomodoroTimerProps {
  selectedTask?: Task | null;
  onBack: () => void;
  onComplete?: () => void;
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ selectedTask, onBack }) => {
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
    <div className="p-6 flex items-center justify-center min-h-[80vh]">
      <Card className="bg-slate-900/50 border-slate-700/50 shadow-xl max-w-md w-full">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
                {selectedTask ? (
                  <Target className="w-6 h-6 text-white" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                )}
              </div>
              <div>
                <CardTitle className="text-2xl font-bold tracking-tight text-white">
                  {selectedTask ? 'Task Focus Session' : 'Focus Session'}
                </CardTitle>
                <p className="text-slate-400 text-sm mt-1">
                  {selectedTask ? `Working on: ${selectedTask.title}` : 'Boost your productivity with deep focus'}
                </p>
              </div>
            </div>

            <Button
              onClick={onBack}
              variant="ghost"
              className="text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-8 py-4">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-white">
                {selectedTask ? 'Ready to focus on your task?' : 'Ready to achieve more?'}
              </h2>
              <p className="text-slate-300">
                {selectedTask
                  ? `Start your focus session to work on "${selectedTask.title}" with deep concentration.`
                  : 'Start your focus session to enter a state of deep work and accomplish your most important tasks.'
                }
              </p>
            </div>
            
            <div className="flex justify-center">
              <Button
                onClick={startFocusSession}
                className="bg-gradient-to-br from-violet-500 to-purple-600 text-white px-8 py-6 text-lg font-medium rounded-xl hover:shadow-lg hover:shadow-violet-500/20 transition-all duration-300 hover:scale-105"
              >
                <Play className="mr-2 h-5 w-5" />
                Start Focus Session
              </Button>
            </div>
            
            <div className="text-center text-slate-400 text-sm">
              <p>Eliminate distractions and maximize your productivity</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PomodoroTimer;
