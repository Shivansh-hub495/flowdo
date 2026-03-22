import React, { createContext, useContext, ReactNode } from 'react';
import { useCalendarEvents, CalendarEvent } from '@/hooks/useCalendarEvents';

// Re-export the CalendarEvent interface for convenience
export type { CalendarEvent };

interface CalendarContextType {
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
  addEvent: (event: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>) => Promise<CalendarEvent | undefined>;
  updateEvent: (id: string, event: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  getEventsForDate: (date: string) => CalendarEvent[];
  getTodaysEvents: () => CalendarEvent[];
  refetch: () => Promise<void>;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
};

interface CalendarProviderProps {
  children: ReactNode;
}

export const CalendarProvider: React.FC<CalendarProviderProps> = ({ children }) => {
  const calendarHook = useCalendarEvents();

  const value = {
    events: calendarHook.events,
    loading: calendarHook.loading,
    error: calendarHook.error,
    addEvent: calendarHook.addEvent,
    updateEvent: calendarHook.updateEvent,
    deleteEvent: calendarHook.deleteEvent,
    getEventsForDate: calendarHook.getEventsForDate,
    getTodaysEvents: calendarHook.getTodaysEvents,
    refetch: calendarHook.refetch,
  };

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
};
