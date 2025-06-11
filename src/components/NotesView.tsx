
import React, { useState } from 'react';
import { Plus, Search, Tag, Link2, Brain } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  linkedTasks: string[];
  color: string;
  createdAt: string;
}

const NotesView: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([
    {
      id: '1',
      title: 'Project Alpha Strategy',
      content: 'Focus on user experience improvements. Key metrics: engagement, retention, satisfaction.',
      tags: ['strategy', 'ux', 'metrics'],
      linkedTasks: ['1'],
      color: 'purple',
      createdAt: '2025-06-07',
    },
    {
      id: '2',
      title: 'Daily Reflection',
      content: 'What went well today? Morning routine was perfect. Need to improve: afternoon energy dip.',
      tags: ['reflection', 'personal'],
      linkedTasks: [],
      color: 'blue',
      createdAt: '2025-06-07',
    },
    {
      id: '3',
      title: 'Reading Notes: Deep Work',
      content: 'Cal Newport emphasizes the importance of focused, uninterrupted work sessions. Key insight: shallow work is easy to replicate.',
      tags: ['books', 'productivity', 'focus'],
      linkedTasks: [],
      color: 'green',
      createdAt: '2025-06-06',
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const allTags = Array.from(new Set(notes.flatMap(note => note.tags)));
  
  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = !selectedTag || note.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const colorClasses = {
    purple: 'bg-purple-500/20 border-purple-500/50',
    blue: 'bg-blue-500/20 border-blue-500/50',
    green: 'bg-green-500/20 border-green-500/50',
    orange: 'bg-orange-500/20 border-orange-500/50',
    red: 'bg-red-500/20 border-red-500/50',
  };

  const NoteCard: React.FC<{ note: Note }> = ({ note }) => (
    <Card className={`${colorClasses[note.color as keyof typeof colorClasses]} hover:glow transition-all duration-200 cursor-pointer`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base font-semibold">{note.title}</CardTitle>
          <div className="flex space-x-1">
            {note.linkedTasks.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                <Link2 size={10} className="mr-1" />
                {note.linkedTasks.length}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
          {note.content}
        </p>
        <div className="flex flex-wrap gap-1 mb-2">
          {note.tags.map(tag => (
            <Badge 
              key={tag} 
              variant="outline" 
              className="text-xs cursor-pointer hover:bg-primary/20"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedTag(tag === selectedTag ? null : tag);
              }}
            >
              <Tag size={8} className="mr-1" />
              {tag}
            </Badge>
          ))}
        </div>
        <div className="text-xs text-muted-foreground">
          {new Date(note.createdAt).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2 flex items-center justify-center">
            <Brain className="mr-2" size={24} />
            Mind Flow
          </h1>
          <p className="text-muted-foreground">Where thoughts become structured and searchable</p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button size="sm" className="shrink-0">
            <Plus size={16} className="mr-2" />
            New Note
          </Button>
        </div>

        {/* Tags Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={selectedTag === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedTag(null)}
          >
            All Notes
          </Button>
          {allTags.map(tag => (
            <Button
              key={tag}
              variant={selectedTag === tag ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
            >
              {tag}
            </Button>
          ))}
        </div>

        {/* Notes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map(note => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>

        {filteredNotes.length === 0 && (
          <div className="text-center py-12">
            <Brain size={48} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No notes found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || selectedTag ? 'Try adjusting your search or filters' : 'Start capturing your thoughts'}
            </p>
            <Button>
              <Plus size={16} className="mr-2" />
              Create your first note
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesView;
