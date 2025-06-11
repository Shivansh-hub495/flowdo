import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Calendar, Trophy } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAchievements, Achievement } from '@/hooks/useAchievements';

interface EditAchievementModalProps {
  achievement: Achievement;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAchievementUpdated?: () => void;
}

const EditAchievementModal: React.FC<EditAchievementModalProps> = ({
  achievement,
  open,
  onOpenChange,
  onAchievementUpdated
}) => {
  const { updateAchievement, uploadAchievementImage } = useAchievements();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [achievementDate, setAchievementDate] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form with achievement data
  useEffect(() => {
    if (achievement) {
      setTitle(achievement.title);
      setDescription(achievement.description || '');
      setAchievementDate(achievement.achievement_date || new Date().toISOString().split('T')[0]);
      setCurrentImageUrl(achievement.image_url || null);
      setImagePreview(null);
      setSelectedImage(null);
    }
  }, [achievement]);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }

      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setCurrentImageUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert('Please enter a title for your achievement');
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = currentImageUrl;
      
      // Upload new image if selected
      if (selectedImage) {
        const uploadedUrl = await uploadAchievementImage(selectedImage);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        } else {
          setIsSubmitting(false);
          return;
        }
      }

      // Update achievement
      const updatedAchievement = await updateAchievement(achievement.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        image_url: imageUrl || undefined,
        achievement_date: achievementDate,
      });

      if (updatedAchievement) {
        onOpenChange(false);
        onAchievementUpdated?.();
      }
    } catch (error) {
      console.error('Error updating achievement:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayImage = imagePreview || currentImageUrl;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-lg font-bold text-slate-800">
            <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
            Edit Achievement
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label htmlFor="image" className="text-sm font-medium text-slate-700">
              Achievement Image (9:16 ratio recommended)
            </Label>

            {displayImage ? (
              <div className="relative">
                <div
                  className="w-full h-40 bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-gray-300"
                  style={{ aspectRatio: '9/16' }}
                >
                  <img
                    src={displayImage}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div
                className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-6 h-6 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 text-center">
                  Click to upload an image<br />
                  <span className="text-xs">PNG, JPG up to 5MB</span>
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium text-slate-700">
              Achievement Title *
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter achievement title..."
              className="w-full"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-slate-700">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your achievement..."
              className="w-full h-16 resize-none"
            />
          </div>

          {/* Achievement Date */}
          <div className="space-y-2">
            <Label htmlFor="date" className="text-sm font-medium text-slate-700">
              Achievement Date
            </Label>
            <div className="relative">
              <Input
                id="date"
                type="date"
                value={achievementDate}
                onChange={(e) => setAchievementDate(e.target.value)}
                className="w-full pl-10"
              />
              <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
              disabled={isSubmitting || !title.trim()}
            >
              {isSubmitting ? 'Updating...' : 'Update Achievement'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditAchievementModal;
