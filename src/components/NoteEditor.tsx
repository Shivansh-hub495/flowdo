import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useNotes } from '@/hooks/useNotes';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ChevronLeft, 
  Save, 
  Trash2, 
  Tag, 
  Palette,
  Type,
  Hash,
  Plus
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Textarea } from '@/components/ui/textarea';

interface NoteEditorProps {
  isNew?: boolean;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ isNew = false }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { notes, createNote, updateNote, deleteNote } = useNotes();
  const { toast } = useToast();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [color, setColor] = useState<'blue' | 'purple' | 'green' | 'orange' | 'red'>('blue');
  
  const note = notes.find(n => n.id === id);

  useEffect(() => {
    if (!isNew && note) {
      setTitle(note.title);
      setContent(note.content || '');
      setTags(note.tags || []);
      setColor(note.color as any);
    }
  }, [note, isNew]);

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your note",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isNew) {
        const newNote = await createNote({
          title,
          content,
          tags,
          linked_tasks: [],
          color,
        });
        
        if (newNote) {
          toast({
            title: "Note created",
            description: "Your note has been saved successfully",
          });
          navigate(`/notes/${newNote.id}`);
        }
      } else if (note) {
        const success = await updateNote(note.id, {
          title,
          content,
          tags,
          color,
        });
        
        if (success) {
          toast({
            title: "Note updated",
            description: "Your note has been updated successfully",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save note. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!note) return;
    
    if (window.confirm('Are you sure you want to delete this note?')) {
      const success = await deleteNote(note.id);
      
      if (success) {
        toast({
          title: "Note deleted",
          description: "Your note has been deleted successfully",
        });
        navigate('/notes');
      } else {
        toast({
          title: "Error",
          description: "Failed to delete note. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const colorOptions = [
    { value: 'blue', label: 'Blue', class: 'bg-blue-500' },
    { value: 'purple', label: 'Purple', class: 'bg-purple-500' },
    { value: 'green', label: 'Green', class: 'bg-green-500' },
    { value: 'orange', label: 'Orange', class: 'bg-orange-500' },
    { value: 'red', label: 'Red', class: 'bg-red-500' },
  ];

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header with back button and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/notes')} className="h-10 w-10">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">
              {isNew ? 'Create New Note' : 'Edit Note'}
            </h1>
            <p className="text-sm text-muted-foreground hidden sm:block">
              {isNew ? 'Start writing your thoughts' : 'Make changes to your note'}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          {!isNew && (
            <Button variant="outline" size="sm" onClick={handleDelete} className="hidden sm:flex">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
          <Button size="sm" onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            <Save className="h-4 w-4 mr-2" />
            Save Note
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main editor area */}
        <div className="lg:col-span-3">
          <Card className="mb-6 shadow-sm">
            <CardHeader className="pb-4">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Note title"
                className="text-xl md:text-2xl font-bold border-0 p-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground"
              />
            </CardHeader>
            <CardContent className="p-0">
              <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder="Start writing your note here... Use the formatting toolbar above."
                className="min-h-[500px]"
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar with metadata */}
        <div className="lg:col-span-1">
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="space-y-6">
                {/* Color Selection */}
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center">
                    <Palette className="h-4 w-4 mr-2" />
                    Note Color
                  </h3>
                  <div className="grid grid-cols-5 gap-2">
                    {colorOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setColor(option.value as any)}
                        className={`h-8 rounded-md ${option.class} ${
                          color === option.value ? 'ring-2 ring-offset-2 ring-ring ring-offset-background' : ''
                        }`}
                        aria-label={option.label}
                      />
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Tags Section */}
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center">
                    <Hash className="h-4 w-4 mr-2" />
                    Tags
                  </h3>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1 pr-1.5">
                        <span>{tag}</span>
                        <button 
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add tag"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                      className="text-sm"
                    />
                    <Button onClick={handleAddTag} size="sm" className="h-9 w-9 p-0">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Note Info */}
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center">
                    <Type className="h-4 w-4 mr-2" />
                    Note Info
                  </h3>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Characters: {content.replace(/<[^>]*>/g, '').length}</p>
                    <p>Words: {content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length}</p>
                  </div>
                </div>

                {/* Mobile Delete Button */}
                {!isNew && (
                  <Button variant="outline" onClick={handleDelete} className="w-full sm:hidden">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Note
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NoteEditor;