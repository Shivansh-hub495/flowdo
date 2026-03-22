import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD format
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  color: 'blue' | 'green' | 'purple' | 'red' | 'orange' | 'pink';
  location?: string;
  attendees?: string[];
  allDay?: boolean;
  created_at?: string;
  updated_at?: string;
}

export const useCalendarEvents = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch all calendar events for the current user
  const fetchEvents = async () => {
    if (!user) {
      setEvents([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (error) {
        throw error;
      }

      // Transform the data to match our interface
      const transformedEvents: CalendarEvent[] = (data || []).map(event => ({
        id: event.id,
        title: event.title,
        description: event.description || undefined,
        date: event.date,
        startTime: event.start_time,
        endTime: event.end_time,
        color: event.color,
        location: event.location || undefined,
        attendees: Array.isArray(event.attendees) ? event.attendees as string[] : [],
        allDay: event.all_day,
        created_at: event.created_at || undefined,
        updated_at: event.updated_at || undefined,
      }));

      setEvents(transformedEvents);
    } catch (err) {
      console.error('Error fetching calendar events:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch calendar events');
      toast({
        title: "Error",
        description: "Failed to load calendar events. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Add a new calendar event
  const addEvent = async (eventData: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .insert({
          user_id: user.id,
          title: eventData.title,
          description: eventData.description || null,
          date: eventData.date,
          start_time: eventData.startTime,
          end_time: eventData.endTime,
          color: eventData.color,
          location: eventData.location || null,
          attendees: eventData.attendees || [],
          all_day: eventData.allDay || false,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Transform and add to local state
      const newEvent: CalendarEvent = {
        id: data.id,
        title: data.title,
        description: data.description || undefined,
        date: data.date,
        startTime: data.start_time,
        endTime: data.end_time,
        color: data.color,
        location: data.location || undefined,
        attendees: Array.isArray(data.attendees) ? data.attendees as string[] : [],
        allDay: data.all_day,
        created_at: data.created_at || undefined,
        updated_at: data.updated_at || undefined,
      };

      setEvents(prev => [...prev, newEvent]);

      toast({
        title: "Success",
        description: "Calendar event created successfully.",
      });

      return newEvent;
    } catch (err) {
      console.error('Error adding calendar event:', err);
      toast({
        title: "Error",
        description: "Failed to create calendar event. Please try again.",
        variant: "destructive",
      });
      throw err;
    }
  };

  // Update an existing calendar event
  const updateEvent = async (id: string, eventData: Partial<CalendarEvent>) => {
    if (!user) return;

    try {
      const updateData: any = {};
      
      if (eventData.title !== undefined) updateData.title = eventData.title;
      if (eventData.description !== undefined) updateData.description = eventData.description || null;
      if (eventData.date !== undefined) updateData.date = eventData.date;
      if (eventData.startTime !== undefined) updateData.start_time = eventData.startTime;
      if (eventData.endTime !== undefined) updateData.end_time = eventData.endTime;
      if (eventData.color !== undefined) updateData.color = eventData.color;
      if (eventData.location !== undefined) updateData.location = eventData.location || null;
      if (eventData.attendees !== undefined) updateData.attendees = eventData.attendees || [];
      if (eventData.allDay !== undefined) updateData.all_day = eventData.allDay;

      const { data, error } = await supabase
        .from('calendar_events')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update local state
      setEvents(prev => prev.map(event => 
        event.id === id ? {
          ...event,
          title: data.title,
          description: data.description || undefined,
          date: data.date,
          startTime: data.start_time,
          endTime: data.end_time,
          color: data.color,
          location: data.location || undefined,
          attendees: Array.isArray(data.attendees) ? data.attendees as string[] : [],
          allDay: data.all_day,
          updated_at: data.updated_at || undefined,
        } : event
      ));

      toast({
        title: "Success",
        description: "Calendar event updated successfully.",
      });
    } catch (err) {
      console.error('Error updating calendar event:', err);
      toast({
        title: "Error",
        description: "Failed to update calendar event. Please try again.",
        variant: "destructive",
      });
      throw err;
    }
  };

  // Delete a calendar event
  const deleteEvent = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      // Remove from local state
      setEvents(prev => prev.filter(event => event.id !== id));

      toast({
        title: "Success",
        description: "Calendar event deleted successfully.",
      });
    } catch (err) {
      console.error('Error deleting calendar event:', err);
      toast({
        title: "Error",
        description: "Failed to delete calendar event. Please try again.",
        variant: "destructive",
      });
      throw err;
    }
  };

  // Get events for a specific date
  const getEventsForDate = (date: string) => {
    return events.filter(event => event.date === date);
  };

  // Get today's events
  const getTodaysEvents = () => {
    const today = new Date().toISOString().split('T')[0];
    return getEventsForDate(today);
  };

  // Fetch events on component mount and when user changes
  useEffect(() => {
    fetchEvents();
  }, [user]);

  return {
    events,
    loading,
    error,
    addEvent,
    updateEvent,
    deleteEvent,
    getEventsForDate,
    getTodaysEvents,
    refetch: fetchEvents,
  };
};
