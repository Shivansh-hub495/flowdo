
import React from 'react';
import { Brain, Grid3X3, Timer, BarChart3, Calendar, Menu, User, LogOut, Target, MessageSquare, Crosshair, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';

interface SidebarNavigationProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const SidebarNavigation: React.FC<SidebarNavigationProps> = ({ activeView, onViewChange }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { isMobile, setOpenMobile } = useSidebar();

  const navItems = [
    { id: 'today', label: 'Today', icon: Calendar, description: 'Your daily focus' },
    { id: 'matrix', label: 'Matrix', icon: Grid3X3, description: 'Eisenhower quadrants' },
    { id: 'targets', label: 'Targets', icon: Crosshair, description: 'Future planning' },
    { id: 'notes', label: 'Notes', icon: Brain, description: 'Mind flow' },
    { id: 'pomodoro', label: 'Focus', icon: Timer, description: 'Pomodoro sessions' },
    { id: 'habits', label: 'Habits', icon: Target, description: 'Habit tracking' },
    { id: 'stats', label: 'Stats', icon: BarChart3, description: 'Progress tracking' },
    { id: 'achievements', label: 'Achievements', icon: Trophy, description: 'Achievement wall' },
    { id: 'chat', label: 'Chat', icon: MessageSquare, description: 'AI Assistant' },
  ];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleNavigation = (view: string) => {
    onViewChange(view);
    // Close mobile sidebar after navigation
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar className="bg-gradient-to-b from-slate-900/95 to-slate-950/98 backdrop-blur-xl border-r border-slate-800/50 shadow-2xl">
      <SidebarHeader className="border-b border-slate-800/30 p-6 bg-gradient-to-r from-slate-900/50 to-slate-800/30">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <img src="/logo.png" alt="FlowDo" className="w-6 h-6" />
            </div>
            <div className="absolute -inset-1 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-xl blur opacity-75"></div>
          </div>
          <div className="flex flex-col">
            <h2 className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              FlowDo
            </h2>
            <p className="text-sm text-slate-400 font-medium">Productivity Hub</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-4 space-y-2 sidebar-scrollbar">
        <SidebarMenu className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  onClick={() => handleNavigation(item.id)}
                  className={cn(
                    "group relative w-full justify-start px-4 py-6 rounded-xl transition-all duration-300 ease-out",
                    "hover:scale-[1.01] hover:shadow-md",
                    isActive
                      ? "bg-gradient-to-r from-violet-500/8 to-purple-500/8 text-white border border-violet-500/15 shadow-md shadow-violet-500/5"
                      : "text-slate-300 hover:text-white hover:bg-gradient-to-r hover:from-slate-800/30 hover:to-slate-700/20 hover:border-slate-600/30 border border-transparent"
                  )}
                >
                  <div className="flex items-center space-x-4 w-full">
                    <div className={cn(
                      "flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300",
                      isActive
                        ? "bg-gradient-to-br from-violet-500/80 to-purple-600/80 shadow-lg shadow-violet-500/20"
                        : "bg-slate-800/40 group-hover:bg-slate-700/60"
                    )}>
                      <Icon size={18} className={cn(
                        "transition-all duration-300",
                        isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                      )} />
                    </div>
                    <div className="flex flex-col items-start flex-1 min-w-0">
                      <span className={cn(
                        "font-semibold text-sm transition-colors duration-300",
                        isActive ? "text-white" : "text-slate-200 group-hover:text-white"
                      )}>
                        {item.label}
                      </span>
                      <span className={cn(
                        "text-xs transition-colors duration-300 truncate",
                        isActive ? "text-slate-300" : "text-slate-500 group-hover:text-slate-400"
                      )}>
                        {item.description}
                      </span>
                    </div>
                  </div>
                  {isActive && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-violet-400 to-purple-500 rounded-full opacity-80"></div>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-slate-800/30">
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-800/20 border border-slate-700/30">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="text-xs bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                {user?.user_metadata?.full_name
                  ? getInitials(user.user_metadata.full_name)
                  : <User className="h-4 w-4" />
                }
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.user_metadata?.full_name || 'User'}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {user?.email}
              </p>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleProfileClick}
              className="flex-1 text-slate-300 hover:text-white hover:bg-slate-800/40"
            >
              <User className="h-4 w-4 mr-2" />
              Profile
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="flex-1 text-slate-300 hover:text-white hover:bg-slate-800/40"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default SidebarNavigation;
