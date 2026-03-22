import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables } from '@/integrations/supabase/types';

export type Note = Tables<'notes'>;

export const useNotes = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (err) {
      console.error('Error fetching notes:', err);
      setError('Failed to fetch notes');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const createNote = async (note: Omit<Note, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('notes')
        .insert([{ ...note, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      
      if (data) {
        setNotes(prev => [data, ...prev]);
      }
      
      return data;
    } catch (err) {
      console.error('Error creating note:', err);
      setError('Failed to create note');
      return null;
    }
  };

  const updateNote = async (id: string, updates: Partial<Note>) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('notes')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      if (data) {
        setNotes(prev => prev.map(note => note.id === id ? data : note));
      }
      
      return true;
    } catch (err) {
      console.error('Error updating note:', err);
      setError('Failed to update note');
      return false;
    }
  };

  const deleteNote = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setNotes(prev => prev.filter(note => note.id !== id));
      return true;
    } catch (err) {
      console.error('Error deleting note:', err);
      setError('Failed to delete note');
      return false;
    }
  };

  return {
    notes,
    loading,
    error,
    createNote,
    updateNote,
    deleteNote,
    refreshNotes: fetchNotes,
  };
};