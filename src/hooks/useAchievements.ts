import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface Achievement {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  image_url?: string;
  achievement_date?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAchievementData {
  title: string;
  description?: string;
  image_url?: string;
  achievement_date?: string;
}

export const useAchievements = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchAchievements = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAchievements(data || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch achievements');
      toast({
        title: "Error",
        description: "Failed to load achievements. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createAchievement = async (achievementData: CreateAchievementData): Promise<Achievement | null> => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create achievements.",
        variant: "destructive",
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('achievements')
        .insert([
          {
            title: achievementData.title,
            description: achievementData.description,
            image_url: achievementData.image_url,
            achievement_date: achievementData.achievement_date || new Date().toISOString().split('T')[0],
            user_id: user.id,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Achievement created successfully!",
      });

      return data;
    } catch (error) {
      console.error('Error creating achievement:', error);
      toast({
        title: "Error",
        description: "Failed to create achievement. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateAchievement = async (id: string, updates: Partial<CreateAchievementData>): Promise<Achievement | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('achievements')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Achievement updated successfully!",
      });

      return data;
    } catch (error) {
      console.error('Error updating achievement:', error);
      toast({
        title: "Error",
        description: "Failed to update achievement. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteAchievement = async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('achievements')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Achievement deleted successfully!",
      });

      return true;
    } catch (error) {
      console.error('Error deleting achievement:', error);
      toast({
        title: "Error",
        description: "Failed to delete achievement. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const testBucketAccess = async () => {
    try {
      console.log('Testing bucket access...');
      const { data, error } = await supabase.storage
        .from('achievement-images')
        .list('', { limit: 1 });

      if (error) {
        console.error('Bucket access error:', error);
      } else {
        console.log('Bucket access successful:', data);
      }
    } catch (error) {
      console.error('Bucket test failed:', error);
    }
  };

  const uploadAchievementImage = async (file: File): Promise<string | null> => {
    if (!user) {
      console.error('No user found for upload');
      return null;
    }

    try {
      // Test bucket access first
      await testBucketAccess();

      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      console.log('Uploading file:', fileName, 'to bucket: achievement-images');
      console.log('User ID:', user.id);
      console.log('File size:', file.size);
      console.log('File type:', file.type);
      console.log('Session exists:', !!session);

      const { data, error } = await supabase.storage
        .from('achievement-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error details:', error);
        throw new Error(error.message || 'Upload failed');
      }

      console.log('Upload successful:', data);

      const { data: { publicUrl } } = supabase.storage
        .from('achievement-images')
        .getPublicUrl(fileName);

      console.log('Public URL:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: `Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
      return null;
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, [user]);

  return {
    achievements,
    loading,
    error,
    createAchievement,
    updateAchievement,
    deleteAchievement,
    uploadAchievementImage,
    refetch: fetchAchievements,
  };
};
