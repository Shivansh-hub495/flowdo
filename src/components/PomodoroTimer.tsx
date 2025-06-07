
import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, Square, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';

interface Task {
  id: string;
  title: string;
  description?: string;
}

interface PomodoroTimerProps {
  selectedTask: Task | null;
  onComplete: () => void;
  onBack: () => void;
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ selectedTask, onComplete, onBack }) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const workDuration = 25 * 60; // 25 minutes
  const shortBreakDuration = 5 * 60; // 5 minutes
  const longBreakDuration = 15 * 60; // 15 minutes

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeForFlip = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return {
      minutes: mins.toString().padStart(2, '0'),
      seconds: secs.toString().padStart(2, '0'),
    };
  };

  const playSound = useCallback(() => {
    if (soundEnabled) {
      // In a real app, you'd play an actual sound file
      console.log('Timer completed sound');
    }
  }, [soundEnabled]);

  const startNextSession = useCallback(() => {
    if (isBreak) {
      setTimeLeft(workDuration);
      setIsBreak(false);
    } else {
      const newPomodoroCount = pomodoroCount + 1;
      setPomodoroCount(newPomodoroCount);
      
      if (newPomodoroCount % 4 === 0) {
        setTimeLeft(longBreakDuration);
      } else {
        setTimeLeft(shortBreakDuration);
      }
      setIsBreak(true);
    }
    setIsRunning(false);
  }, [isBreak, pomodoroCount, workDuration, shortBreakDuration, longBreakDuration]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            playSound();
            startNextSession();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, playSound, startNextSession]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(workDuration);
    setIsBreak(false);
  };

  const skipSession = () => {
    playSound();
    startNextSession();
  };

  const { minutes, seconds } = formatTimeForFlip(timeLeft);
  const totalTime = isBreak 
    ? (pomodoroCount % 4 === 0 ? longBreakDuration : shortBreakDuration)
    : workDuration;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/20 flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="w-full max-w-md mb-8">
        <div className="text-center mb-4">
          <h1 className="text-xl font-bold text-primary mb-2">
            {isBreak ? '☕ Break Time' : '🎯 Focus Session'}
          </h1>
          {selectedTask && (
            <p className="text-sm text-muted-foreground">
              Working on: {selectedTask.title}
            </p>
          )}
        </div>
        
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <span>Session #{pomodoroCount + 1}</span>
          <span>{pomodoroCount} completed</span>
        </div>
      </div>

      {/* Flip Clock Display */}
      <div className="mb-8">
        <div className="flex items-center space-x-4">
          {/* Minutes */}
          <div className="flip-card w-20 h-24">
            <div className="flip-card-inner relative w-full h-full">
              <Card className="flip-card-front absolute w-full h-full glass border-2">
                <CardContent className="flex items-center justify-center h-full p-0">
                  <span className="text-4xl font-mono font-bold">{minutes}</span>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Separator */}
          <div className="text-4xl font-mono font-bold text-primary animate-pulse">:</div>
          
          {/* Seconds */}
          <div className="flip-card w-20 h-24">
            <div className="flip-card-inner relative w-full h-full">
              <Card className="flip-card-front absolute w-full h-full glass border-2">
                <CardContent className="flex items-center justify-center h-full p-0">
                  <span className="text-4xl font-mono font-bold">{seconds}</span>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-md mb-8">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>0:00</span>
          <span>{formatTime(totalTime)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center space-x-4 mb-8">
        <Button
          size="lg"
          onClick={toggleTimer}
          className="rounded-full w-16 h-16 glow"
        >
          {isRunning ? <Pause size={24} /> : <Play size={24} />}
        </Button>
        
        <Button
          size="lg"
          variant="outline"
          onClick={resetTimer}
          className="rounded-full w-12 h-12"
        >
          <Square size={18} />
        </Button>
        
        <Button
          size="lg"
          variant="outline"
          onClick={skipSession}
          className="rounded-full w-12 h-12"
        >
          <SkipForward size={18} />
        </Button>
      </div>

      {/* Settings */}
      <div className="flex items-center space-x-4 mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="flex items-center space-x-2"
        >
          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          <span className="text-sm">Sound</span>
        </Button>
      </div>

      {/* Back Button */}
      <Button variant="outline" onClick={onBack} className="mt-auto">
        Back to Matrix
      </Button>
    </div>
  );
};

export default PomodoroTimer;
