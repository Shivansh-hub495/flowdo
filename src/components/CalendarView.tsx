import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Clock, MapPin, Users, Edit, Trash2, MoreHorizontal, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { useTasks } from '@/hooks/useTasks';
import { useTargets } from '@/hooks/useTargets';
import { useCalendar, CalendarEvent } from '@/contexts/CalendarContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// Event interface is now imported from CalendarContext

// Color classes for events
const eventColorClasses = {
  blue: 'bg-blue-500/20 border-blue-500/30 text-blue-300',
  green: 'bg-green-500/20 border-green-500/30 text-green-300',
  purple: 'bg-purple-500/20 border-purple-500/30 text-purple-300',
  red: 'bg-red-500/20 border-red-500/30 text-red-300',
  orange: 'bg-orange-500/20 border-orange-500/30 text-orange-300',
  pink: 'bg-pink-500/20 border-pink-500/30 text-pink-300',
};

// Utility functions to convert tasks and targets to calendar events
const taskToCalendarEvent = (task: any): CalendarEvent => {
  const taskDate = task.due_date || task.created_at;
  const date = new Date(taskDate).toISOString().split('T')[0];

  return {
    id: `task-${task.id}`,
    title: task.title,
    description: task.description || '',
    date,
    startTime: '09:00', // Default start time for tasks
    endTime: task.estimated_time ?
      calculateEndTime('09:00', task.estimated_time) : '10:00',
    color: getPriorityColor(task.priority),
    allDay: !task.estimated_time,
  };
};

const targetToCalendarEvent = (target: any): CalendarEvent => {
  return {
    id: `target-${target.id}`,
    title: `🎯 ${target.title}`,
    description: target.description || '',
    date: target.target_date,
    startTime: '08:00', // Default start time for targets
    endTime: '09:00',
    color: getTargetTypeColor(target.target_type),
    allDay: true,
  };
};

// Helper functions
const calculateEndTime = (startTime: string, estimatedTime: string): string => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const estimatedMinutes = parseInt(estimatedTime) || 60; // Default to 60 minutes

  const totalMinutes = hours * 60 + minutes + estimatedMinutes;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMins = totalMinutes % 60;

  return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
};

const getPriorityColor = (priority?: string): CalendarEvent['color'] => {
  switch (priority) {
    case 'critical': return 'red';
    case 'high': return 'orange';
    case 'medium': return 'blue';
    case 'low': return 'green';
    default: return 'blue';
  }
};

const getTargetTypeColor = (targetType: string): CalendarEvent['color'] => {
  switch (targetType) {
    case 'tomorrow': return 'purple';
    case 'week': return 'blue';
    case 'month': return 'green';
    case 'year': return 'pink';
    default: return 'blue';
  }
};

// Event Popup Component
interface EventPopupProps {
  event: CalendarEvent;
  position: { x: number; y: number };
  onClose: () => void;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (event: CalendarEvent) => void;
}

const EventPopup: React.FC<EventPopupProps> = ({ event, position, onClose, onEdit, onDelete }) => {
  const popupRef = useRef<HTMLDivElement>(null);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Format date and time
  const formatDateTime = (date: string, startTime: string, endTime: string) => {
    const eventDate = new Date(date);
    const dayName = eventDate.toLocaleDateString('en-US', { weekday: 'long' });
    const monthDay = eventDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

    if (event.allDay) {
      return `${dayName}, ${monthDay} • All day`;
    }

    const formatTime = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(':');
      const hour = parseInt(hours);
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour}:${minutes}${period}`;
    };

    return `${dayName}, ${monthDay} • ${formatTime(startTime)} - ${formatTime(endTime)}`;
  };

  return (
    <div
      ref={popupRef}
      className="fixed z-50 bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 min-w-[320px] max-w-[400px]"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -10px)',
      }}
    >
      {/* Header with action buttons */}
      <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${eventColorClasses[event.color]?.split(' ')[0] || 'bg-blue-500'}`} />
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            onClick={() => {
              console.log('Edit button clicked');
              onEdit(event);
            }}
          >
            <Edit size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700 text-red-500 hover:text-red-600"
            onClick={() => {
              console.log('Delete button clicked');
              onDelete(event);
            }}
          >
            <Trash2 size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            onClick={() => {
              console.log('More options clicked');
              // For now, just show an alert
              alert('More options: Duplicate, Print, Export');
            }}
          >
            <MoreHorizontal size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            onClick={() => {
              console.log('Close button clicked');
              onClose();
            }}
          >
            <X size={16} />
          </Button>
        </div>
      </div>

      {/* Event content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          {event.title}
        </h3>

        <div className="text-sm text-slate-600 dark:text-slate-400 mb-3">
          {formatDateTime(event.date, event.startTime, event.endTime)}
        </div>

        {event.description && (
          <div className="text-sm text-slate-700 dark:text-slate-300 mb-3">
            {event.description}
          </div>
        )}

        {event.location && (
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-3">
            <MapPin size={14} />
            {event.location}
          </div>
        )}

        {/* Additional info based on event type */}
        {event.type === 'task' && (
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <Clock size={14} />
            Task
          </div>
        )}

        {event.type === 'target' && (
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <Users size={14} />
            Target
          </div>
        )}
      </div>
    </div>
  );
};

const CalendarView: React.FC = () => {
  console.log('CalendarView component rendering...');

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showEventPopup, setShowEventPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [popupEvent, setPopupEvent] = useState<CalendarEvent | null>(null);

  // Hooks for tasks, targets, and calendar events
  const { tasks, getTodaysTasks } = useTasks();
  const { targets } = useTargets();
  const { events: baseEvents, addEvent, updateEvent, deleteEvent, loading: eventsLoading } = useCalendar();

  // Combine all events (base events + tasks + targets)
  const events = useMemo(() => {
    const taskEvents = tasks
      .filter(task => task.due_date || task.created_at) // Only tasks with dates
      .map(taskToCalendarEvent);

    const targetEvents = targets
      .filter(target => target.target_date) // Only targets with dates
      .map(targetToCalendarEvent);

    return [...baseEvents, ...taskEvents, ...targetEvents];
  }, [baseEvents, tasks, targets]);

  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Event popup handlers
  const handleEventClick = (event: CalendarEvent, mouseEvent: React.MouseEvent) => {
    mouseEvent.stopPropagation();

    // Calculate popup position
    const rect = (mouseEvent.target as HTMLElement).getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top;

    setPopupPosition({ x, y });
    setPopupEvent(event);
    setShowEventPopup(true);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setShowEventPopup(false);
    setEditingEvent(event);
    setShowEventDialog(true);
  };

  const handleDeleteEvent = async (event: CalendarEvent) => {
    setShowEventPopup(false);
    try {
      await deleteEvent(event.id);
      toast({
        title: "Event deleted",
        description: "The event has been successfully deleted.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the event. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Get month and year
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const today = new Date();

  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Day names
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // Get calendar days for current month
  const getCalendarDays = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 41); // 6 weeks

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      days.push(new Date(date));
    }

    return days;
  };

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return events.filter(event => event.date === dateString);
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // Check if date is today
  const isToday = (date: Date) => {
    return formatDate(date) === formatDate(today);
  };

  // Check if date is in current month
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth;
  };

  // Check if date is selected
  const isSelected = (date: Date) => {
    return selectedDate && formatDate(date) === formatDate(selectedDate);
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className={`inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/20 ${
            isMobile ? 'w-10 h-10 mb-2' : 'w-16 h-16 mb-4'
          }`}>
            <CalendarIcon className="text-violet-400" size={isMobile ? 16 : 24} />
          </div>
          <h1 className={`font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent ${
            isMobile ? 'text-xl mb-1' : 'text-3xl mb-2'
          }`}>
            Calendar
          </h1>
          <p className="text-muted-foreground">Organize your schedule and events</p>
        </div>

        {/* Calendar Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          {/* Month Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size={isMobile ? "sm" : "default"}
              onClick={goToPreviousMonth}
              className="hover:bg-violet-500/10 hover:border-violet-500/30 transition-all duration-200"
            >
              <ChevronLeft size={isMobile ? 14 : 16} />
            </Button>
            <h2 className={`font-semibold text-center ${
              isMobile ? 'text-lg min-w-[160px]' : 'text-xl min-w-[200px]'
            }`}>
              {monthNames[currentMonth]} {currentYear}
            </h2>
            <Button
              variant="outline"
              size={isMobile ? "sm" : "default"}
              onClick={goToNextMonth}
              className="hover:bg-violet-500/10 hover:border-violet-500/30 transition-all duration-200"
            >
              <ChevronRight size={isMobile ? 14 : 16} />
            </Button>
          </div>

          {/* View Controls */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="hover:bg-violet-500/10 hover:border-violet-500/30 transition-all duration-200"
            >
              Today
            </Button>
            <div className="flex border border-slate-700 rounded-lg overflow-hidden">
              {(['month', 'week', 'day'] as const).map((mode) => (
                <Button
                  key={mode}
                  variant={viewMode === mode ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode(mode)}
                  className={`rounded-none border-0 transition-all duration-200 ${
                    viewMode === mode
                      ? 'bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-300 border-violet-500/30'
                      : 'hover:bg-slate-800/50'
                  } ${isMobile ? 'px-2 text-xs' : 'px-3'}`}
                >
                  {isMobile ? mode.charAt(0).toUpperCase() : mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Button>
              ))}
            </div>
            <Button
              size="sm"
              className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-violet-500/25"
              onClick={() => {
                setEditingEvent(null);
                setShowEventDialog(true);
              }}
            >
              <Plus size={isMobile ? 14 : 16} className="mr-2" />
              {isMobile ? 'New' : 'New Event'}
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        {viewMode === 'month' && <MonthView
          currentDate={currentDate}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          events={events}
          onEventClick={handleEventClick}
        />}

        {viewMode === 'week' && <WeekView
          currentDate={currentDate}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          events={events}
          onEventClick={handleEventClick}
        />}

        {viewMode === 'day' && <DayView
          currentDate={selectedDate || currentDate}
          events={events}
          onEventClick={handleEventClick}
        />}

        {/* Event Dialog */}
        <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
          <EventDialog
            event={editingEvent}
            onSave={(eventData) => {
              if (editingEvent) {
                // Update existing event (only if it's a base event, not task/target)
                if (!editingEvent.id.startsWith('task-') && !editingEvent.id.startsWith('target-')) {
                  updateEvent(editingEvent.id, eventData);
                  toast({
                    title: "Event updated",
                    description: "Your event has been updated successfully.",
                  });
                }
              } else {
                // Create new event
                addEvent(eventData);
                toast({
                  title: "Event created",
                  description: "Your event has been created successfully.",
                });
              }
              setShowEventDialog(false);
              setEditingEvent(null);
            }}
            onDelete={(eventId) => {
              // Only delete base events, not tasks/targets
              if (!eventId.startsWith('task-') && !eventId.startsWith('target-')) {
                deleteEvent(eventId);
                toast({
                  title: "Event deleted",
                  description: "Your event has been deleted successfully.",
                });
              } else {
                toast({
                  title: "Cannot delete",
                  description: "Tasks and targets must be deleted from their respective pages.",
                  variant: "destructive",
                });
              }
              setShowEventDialog(false);
              setEditingEvent(null);
            }}
            selectedDate={selectedDate}
          />
        </Dialog>

        {/* Event Popup */}
        {showEventPopup && popupEvent && (
          <EventPopup
            event={popupEvent}
            position={popupPosition}
            onClose={() => setShowEventPopup(false)}
            onEdit={handleEditEvent}
            onDelete={handleDeleteEvent}
          />
        )}
      </div>
    </div>
  );
};

// Event Dialog Component
interface EventDialogProps {
  event: CalendarEvent | null;
  onSave: (event: Omit<CalendarEvent, 'id'>) => void;
  onDelete: (eventId: string) => void;
  selectedDate: Date | null;
}

const EventDialog: React.FC<EventDialogProps> = ({
  event,
  onSave,
  onDelete,
  selectedDate,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [color, setColor] = useState<CalendarEvent['color']>('blue');
  const [location, setLocation] = useState('');
  const [allDay, setAllDay] = useState(false);

  // Reset form when dialog opens/closes or event changes
  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description || '');
      setDate(event.date);
      setStartTime(event.startTime);
      setEndTime(event.endTime);
      setColor(event.color);
      setLocation(event.location || '');
      setAllDay(event.allDay || false);
    } else {
      setTitle('');
      setDescription('');
      setDate(selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
      setStartTime('09:00');
      setEndTime('10:00');
      setColor('blue');
      setLocation('');
      setAllDay(false);
    }
  }, [event, selectedDate, open]);

  const handleSave = () => {
    if (!title.trim()) {
      return;
    }

    onSave({
      title: title.trim(),
      description: description.trim(),
      date,
      startTime,
      endTime,
      color,
      location: location.trim(),
      allDay,
    });
  };

  const handleDelete = () => {
    if (event) {
      onDelete(event.id);
    }
  };

  return (
    <DialogContent className="max-w-md bg-gradient-to-br from-slate-800/95 to-slate-900/95 border border-slate-700/50 shadow-2xl">
      <DialogHeader>
        <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
          {event ? 'Edit Event' : 'Create New Event'}
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Event title"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Event description"
            rows={3}
          />
        </div>

        {/* Date */}
        <div className="space-y-2">
          <Label htmlFor="date">Date *</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {/* All Day Toggle */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="allDay"
            checked={allDay}
            onChange={(e) => setAllDay(e.target.checked)}
            className="rounded border-gray-300"
          />
          <Label htmlFor="allDay">All day event</Label>
        </div>

        {/* Time */}
        {!allDay && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Color */}
        <div className="space-y-2">
          <Label htmlFor="color">Color</Label>
          <Select value={color} onValueChange={(value: CalendarEvent['color']) => setColor(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="blue">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  Blue
                </div>
              </SelectItem>
              <SelectItem value="green">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  Green
                </div>
              </SelectItem>
              <SelectItem value="purple">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  Purple
                </div>
              </SelectItem>
              <SelectItem value="red">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  Red
                </div>
              </SelectItem>
              <SelectItem value="orange">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  Orange
                </div>
              </SelectItem>
              <SelectItem value="pink">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                  Pink
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Event location"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t border-slate-700/30">
          {event && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-red-500/25"
            >
              <Trash2 size={16} className="mr-2" />
              Delete
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <DialogClose asChild>
              <Button
                variant="outline"
                className="hover:bg-slate-800/50 border-slate-600 transition-all duration-200"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              onClick={handleSave}
              disabled={!title.trim()}
              className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {event ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </div>
    </DialogContent>
  );
};

// Month View Component
interface CalendarViewProps {
  currentDate: Date;
  selectedDate: Date | null;
  setSelectedDate: (date: Date) => void;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent, mouseEvent: React.MouseEvent) => void;
}

const MonthView: React.FC<CalendarViewProps> = ({
  currentDate,
  selectedDate,
  setSelectedDate,
  events,
  onEventClick,
}) => {
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const today = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getCalendarDays = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 41); // 6 weeks

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      days.push(new Date(date));
    }

    return days;
  };

  const getEventsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return events.filter(event => event.date === dateString);
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const isToday = (date: Date) => {
    return formatDate(date) === formatDate(today);
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth;
  };

  const isSelected = (date: Date) => {
    return selectedDate && formatDate(date) === formatDate(selectedDate);
  };

  const isMobile = useIsMobile();

  return (
    <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 shadow-xl">
      <CardContent className="p-0">
        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-slate-700/50">
          {dayNames.map((day) => (
            <div
              key={day}
              className={`text-center font-medium text-slate-400 border-r border-slate-700/50 last:border-r-0 ${
                isMobile ? 'p-2 text-xs' : 'p-4 text-sm'
              }`}
            >
              {isMobile ? day.slice(0, 1) : day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {getCalendarDays().map((date, index) => {
            const dayEvents = getEventsForDate(date);
            const isCurrentMonthDate = isCurrentMonth(date);
            const isTodayDate = isToday(date);
            const isSelectedDate = isSelected(date);

            return (
              <div
                key={index}
                className={`border-r border-b border-slate-700/50 last:border-r-0 cursor-pointer transition-all duration-200 ${
                  isMobile ? 'min-h-[80px] p-1' : 'min-h-[120px] p-2'
                } ${
                  isCurrentMonthDate
                    ? 'hover:bg-slate-800/30 hover:shadow-lg'
                    : 'bg-slate-900/30 text-slate-600'
                } ${
                  isSelectedDate ? 'bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/30 shadow-lg shadow-violet-500/10' : ''
                }`}
                onClick={() => setSelectedDate(date)}
              >
                <div className={`font-medium mb-1 transition-all duration-200 ${
                  isMobile ? 'text-xs' : 'text-sm'
                } ${
                  isTodayDate
                    ? `bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-full flex items-center justify-center shadow-lg ${
                        isMobile ? 'w-5 h-5 text-xs' : 'w-6 h-6'
                      }`
                    : isCurrentMonthDate
                      ? 'text-white'
                      : 'text-slate-600'
                }`}>
                  {date.getDate()}
                </div>

                {/* Events for this day */}
                <div className="space-y-1">
                  {dayEvents.slice(0, isMobile ? 2 : 3).map((event) => (
                    <div
                      key={event.id}
                      className={`rounded border cursor-pointer hover:opacity-80 transition-all duration-200 hover:scale-105 ${
                        eventColorClasses[event.color]
                      } ${
                        isMobile ? 'text-xs p-0.5' : 'text-xs p-1'
                      }`}
                      onClick={(e) => {
                        onEventClick(event, e);
                      }}
                    >
                      <div className="font-medium truncate">{event.title}</div>
                      {!event.allDay && !isMobile && (
                        <div className="text-xs opacity-75">
                          {event.startTime}
                        </div>
                      )}
                    </div>
                  ))}
                  {dayEvents.length > (isMobile ? 2 : 3) && (
                    <div className={`text-slate-400 pl-1 ${isMobile ? 'text-xs' : 'text-xs'}`}>
                      +{dayEvents.length - (isMobile ? 2 : 3)} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

// Week View Component
const WeekView: React.FC<CalendarViewProps> = ({
  currentDate,
  selectedDate,
  setSelectedDate,
  events,
  onEventClick,
}) => {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Get the week days starting from Sunday
  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push(date);
    }
    return days;
  };

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return events.filter(event => event.date === dateString);
  };

  // Format hour for display
  const formatHour = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Check if date is selected
  const isSelected = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  // Convert time string to minutes from midnight
  const timeToMinutes = (timeStr: string) => {
    const timeParts = timeStr.split(':');
    const hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1], 10);
    return hours * 60 + minutes;
  };

  // Format time as HH:MM
  const formatTime = (timeStr: string) => {
    const timeParts = timeStr.split(':');
    return `${timeParts[0]}:${timeParts[1]}`;
  };

  const weekDays = getWeekDays();
  const HOUR_HEIGHT = 60; // Height of each hour slot in pixels
  const TIME_COLUMN_WIDTH = 80; // Width of time column in pixels

  return (
    <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 shadow-xl">
      <CardContent className="p-0">
        {/* Header with day names and dates */}
        <div className="flex border-b border-slate-700/50">
          <div className="w-20 p-3 border-r border-slate-700/50 flex-shrink-0"></div>
          <div className="flex-1 grid grid-cols-7">
            {weekDays.map((date, index) => (
              <div
                key={index}
                className={`p-3 text-center border-r border-slate-700/50 last:border-r-0 cursor-pointer transition-colors ${
                  isToday(date) ? 'bg-violet-500/20 text-violet-300' : ''
                } ${
                  isSelected(date) ? 'bg-violet-600/30 text-violet-200' : 'hover:bg-slate-800/30'
                }`}
                onClick={() => setSelectedDate(date)}
              >
                <div className="text-xs text-slate-400 font-medium">{dayNames[index]}</div>
                <div className={`text-lg font-semibold mt-1 ${
                  isToday(date) ? 'text-violet-300' : 'text-white'
                }`}>
                  {date.getDate()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* All-day events section */}
        <div className="flex border-b border-slate-700/50 min-h-[50px]">
          <div className="w-20 p-2 text-xs text-slate-400 border-r border-slate-700/50 flex items-center flex-shrink-0">
            All Day
          </div>
          <div className="flex-1 grid grid-cols-7">
            {weekDays.map((date, index) => {
              const allDayEvents = getEventsForDate(date).filter(event => event.allDay);
              return (
                <div key={index} className="p-1 border-r border-slate-700/50 last:border-r-0">
                  {allDayEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`text-xs p-1 rounded border cursor-pointer hover:opacity-80 mb-1 ${
                        eventColorClasses[event.color]
                      }`}
                      onClick={(e) => onEventClick(event, e)}
                    >
                      <div className="font-medium truncate">{event.title}</div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* Time grid with events */}
        <div className="max-h-[500px] overflow-y-auto">
          <div className="relative">
            {/* Hour grid background */}
            {hours.map((hour) => (
              <div key={hour} className="flex border-b border-slate-700/30">
                <div
                  className="w-20 p-2 text-xs text-slate-400 border-r border-slate-700/30 flex items-start flex-shrink-0"
                  style={{ height: `${HOUR_HEIGHT}px` }}
                >
                  {formatHour(hour)}
                </div>
                <div className="flex-1 grid grid-cols-7">
                  {weekDays.map((date, dayIndex) => (
                    <div
                      key={dayIndex}
                      className="border-r border-slate-700/30 last:border-r-0 cursor-pointer hover:bg-slate-800/20 relative"
                      style={{ height: `${HOUR_HEIGHT}px` }}
                      onClick={() => setSelectedDate(date)}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Positioned events overlay - positioned exactly over the grid columns */}
            <div className="absolute top-0 left-20 right-0" style={{ height: `${hours.length * HOUR_HEIGHT}px` }}>
              <div className="grid grid-cols-7 h-full">
                {weekDays.map((date, dayIndex) => {
                  const timedEvents = getEventsForDate(date).filter(event => !event.allDay);

                  return (
                    <div key={dayIndex} className="relative">
                      {timedEvents.map((event) => {
                        const startMinutes = timeToMinutes(event.startTime);
                        const endMinutes = timeToMinutes(event.endTime);
                        const durationMinutes = endMinutes - startMinutes;

                        // Account for the padding in the time column (p-2 = 8px top padding)
                        const top = (startMinutes / 60) * HOUR_HEIGHT + 8;
                        const height = Math.max((durationMinutes / 60) * HOUR_HEIGHT, 20);

                        return (
                          <div
                            key={event.id}
                            className={`absolute p-1 rounded border cursor-pointer hover:brightness-110 hover:shadow-lg transition-all duration-200 ${
                              eventColorClasses[event.color]
                            }`}
                            style={{
                              top: `${top}px`,
                              height: `${height}px`,
                              left: '2px',
                              right: '2px',
                              zIndex: 10,
                            }}
                            onClick={(e) => {
                              onEventClick(event, e);
                            }}
                          >
                            <div className="font-medium text-xs truncate">{event.title}</div>
                            <div className="text-xs opacity-75">
                              {formatTime(event.startTime)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};



// Day View Component
interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent, mouseEvent: React.MouseEvent) => void;
}

const DayView: React.FC<DayViewProps> = ({
  currentDate,
  events,
  onEventClick,
}) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Get events for the current date
  const getEventsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return events.filter(event => event.date === dateString).sort((a, b) => {
      if (a.allDay && !b.allDay) return -1;
      if (!a.allDay && b.allDay) return 1;
      return a.startTime.localeCompare(b.startTime);
    });
  };

  // Format hour for display
  const formatHour = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  // Check if current date is today
  const isToday = () => {
    const today = new Date();
    return currentDate.toDateString() === today.toDateString();
  };

  // Convert time string to minutes from midnight
  const timeToMinutes = (timeStr: string) => {
    const timeParts = timeStr.split(':');
    const hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1], 10);
    return hours * 60 + minutes;
  };

  // Format time as HH:MM
  const formatTime = (timeStr: string) => {
    const timeParts = timeStr.split(':');
    return `${timeParts[0]}:${timeParts[1]}`;
  };

  const dayEvents = getEventsForDate(currentDate);
  const HOUR_HEIGHT = 60; // Height of each hour slot in pixels
  const TIME_COLUMN_WIDTH = 80; // Width of time column in pixels

  return (
    <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 shadow-xl">
      <CardHeader>
        <CardTitle className="text-center">
          <div className={`text-2xl font-bold ${isToday() ? 'text-violet-400' : 'text-white'}`}>
            {currentDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* All Day Events */}
        {dayEvents.filter(event => event.allDay).length > 0 && (
          <div className="p-4 border-b border-slate-700/50">
            <h3 className="text-sm font-medium text-slate-400 mb-2">All Day</h3>
            <div className="space-y-2">
              {dayEvents.filter(event => event.allDay).map((event) => (
                <div
                  key={event.id}
                  className={`p-2 rounded border cursor-pointer hover:opacity-80 ${
                    eventColorClasses[event.color]
                  }`}
                  onClick={(e) => onEventClick(event, e)}
                >
                  <div className="font-medium">{event.title}</div>
                  {event.description && (
                    <div className="text-xs opacity-75 mt-1">{event.description}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hourly Schedule */}
        <div className="max-h-[600px] overflow-y-auto">
          <div className="relative">
            {/* Hour grid background */}
            {hours.map((hour) => (
              <div key={hour} className="flex border-b border-slate-700/30">
                <div
                  className="w-20 p-2 text-xs text-slate-400 border-r border-slate-700/30 flex items-start flex-shrink-0"
                  style={{ height: `${HOUR_HEIGHT}px` }}
                >
                  {formatHour(hour)}
                </div>
                <div
                  className="flex-1 relative"
                  style={{ height: `${HOUR_HEIGHT}px` }}
                />
              </div>
            ))}

            {/* Positioned events overlay - positioned exactly after the time column */}
            <div
              className="absolute top-0 left-20 right-0"
              style={{
                height: `${hours.length * HOUR_HEIGHT}px`,
              }}
            >
              {dayEvents.filter(event => !event.allDay).map((event) => {
                const startMinutes = timeToMinutes(event.startTime);
                const endMinutes = timeToMinutes(event.endTime);
                const durationMinutes = endMinutes - startMinutes;

                // Account for the padding in the time column (p-2 = 8px top padding)
                const top = (startMinutes / 60) * HOUR_HEIGHT + 8;
                const height = Math.max((durationMinutes / 60) * HOUR_HEIGHT, 20);

                return (
                  <div
                    key={event.id}
                    className={`absolute p-2 rounded border cursor-pointer hover:brightness-110 hover:shadow-lg transition-all duration-200 ${
                      eventColorClasses[event.color]
                    }`}
                    style={{
                      top: `${top}px`,
                      height: `${height}px`,
                      left: '4px',
                      right: '4px',
                      zIndex: 10,
                    }}
                    onClick={(e) => onEventClick(event, e)}
                  >
                    <div className="font-medium text-sm">{event.title}</div>
                    <div className="text-xs opacity-75">
                      {formatTime(event.startTime)} - {formatTime(event.endTime)}
                    </div>
                    {event.location && (
                      <div className="text-xs opacity-75 flex items-center mt-1">
                        <MapPin size={10} className="mr-1" />
                        {event.location}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendarView;
