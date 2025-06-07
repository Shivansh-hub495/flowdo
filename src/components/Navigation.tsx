
import React from 'react';
import { Brain, Grid3X3, Timer, BarChart3, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeView, onViewChange }) => {
  const navItems = [
    { id: 'today', label: 'Today', icon: Calendar },
    { id: 'matrix', label: 'Matrix', icon: Grid3X3 },
    { id: 'notes', label: 'Notes', icon: Brain },
    { id: 'pomodoro', label: 'Focus', icon: Timer },
    { id: 'stats', label: 'Stats', icon: BarChart3 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t">
      <div className="flex justify-around items-center py-3 px-4 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                "flex flex-col items-center space-y-1 p-2 rounded-lg transition-all duration-200",
                isActive 
                  ? "text-primary glow" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon size={20} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;
