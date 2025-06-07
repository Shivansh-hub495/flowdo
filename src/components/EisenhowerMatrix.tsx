
import React, { useState } from 'react';
import { Plus, Play, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  description?: string;
  quadrant: 'urgent-important' | 'important' | 'urgent' | 'neither';
  deadline?: string;
  tags?: string[];
}

interface EisenhowerMatrixProps {
  onStartPomodoro: (task: Task) => void;
}

const EisenhowerMatrix: React.FC<EisenhowerMatrixProps> = ({ onStartPomodoro }) => {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Fix critical bug in production',
      description: 'Server issues affecting users',
      quadrant: 'urgent-important',
      deadline: '2025-06-07',
    },
    {
      id: '2',
      title: 'Plan quarterly goals',
      description: 'Strategic planning session',
      quadrant: 'important',
    },
    {
      id: '3',
      title: 'Answer emails',
      description: 'Daily email maintenance',
      quadrant: 'urgent',
    },
    {
      id: '4',
      title: 'Organize desk',
      description: 'Clean up workspace',
      quadrant: 'neither',
    },
  ]);

  const quadrants = [
    {
      id: 'urgent-important',
      title: 'DO NOW',
      subtitle: 'Urgent & Important',
      color: 'bg-red-500/20 border-red-500/50',
      textColor: 'text-red-400',
    },
    {
      id: 'important',
      title: 'SCHEDULE',
      subtitle: 'Important, Not Urgent',
      color: 'bg-purple-500/20 border-purple-500/50',
      textColor: 'text-purple-400',
    },
    {
      id: 'urgent',
      title: 'DELEGATE',
      subtitle: 'Urgent, Not Important',
      color: 'bg-orange-500/20 border-orange-500/50',
      textColor: 'text-orange-400',
    },
    {
      id: 'neither',
      title: 'DELETE',
      subtitle: 'Neither Urgent nor Important',
      color: 'bg-gray-500/20 border-gray-500/50',
      textColor: 'text-gray-400',
    },
  ];

  const getTasksByQuadrant = (quadrantId: string) => 
    tasks.filter(task => task.quadrant === quadrantId);

  const TaskCard: React.FC<{ task: Task }> = ({ task }) => (
    <div className="glass p-3 rounded-lg border hover:glow transition-all duration-200 group">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-sm leading-tight">{task.title}</h4>
        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={() => onStartPomodoro(task)}
          >
            <Play size={12} />
          </Button>
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
            <Edit size={12} />
          </Button>
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
            <Trash2 size={12} />
          </Button>
        </div>
      </div>
      {task.description && (
        <p className="text-xs text-muted-foreground mb-2">{task.description}</p>
      )}
      {task.deadline && (
        <div className="text-xs text-muted-foreground">
          Due: {new Date(task.deadline).toLocaleDateString()}
        </div>
      )}
    </div>
  );

  return (
    <div className="p-4 pb-20 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">Eisenhower Matrix</h1>
          <p className="text-muted-foreground">Do what matters. Dump the rest.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(100vh-200px)]">
          {quadrants.map((quadrant) => {
            const quadrantTasks = getTasksByQuadrant(quadrant.id);
            
            return (
              <Card key={quadrant.id} className={cn("flex flex-col", quadrant.color)}>
                <CardHeader className="pb-3">
                  <CardTitle className={cn("text-sm font-bold", quadrant.textColor)}>
                    {quadrant.title}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">{quadrant.subtitle}</p>
                </CardHeader>
                <CardContent className="flex-1 space-y-3">
                  {quadrantTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full border-2 border-dashed border-muted-foreground/30 h-12"
                  >
                    <Plus size={16} className="mr-2" />
                    Add Task
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EisenhowerMatrix;
