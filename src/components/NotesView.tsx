import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotes } from '@/hooks/useNotes';
import { Plus, Search, Tag, Link2, Brain, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const NotesView: React.FC = () => {
  const navigate = useNavigate();
  const { notes, loading, error } = useNotes();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const allTags = Array.from(new Set(notes.flatMap(note => note.tags || [])));
  
  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (note.content && note.content.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesTag = !selectedTag || (note.tags && note.tags.includes(selectedTag));
    return matchesSearch && matchesTag;
  });

  const colorClasses = {
    purple: 'bg-purple-500/20 border-purple-500/50',
    blue: 'bg-blue-500/20 border-blue-500/50',
    green: 'bg-green-500/20 border-green-500/50',
    orange: 'bg-orange-500/20 border-orange-500/50',
    red: 'bg-red-500/20 border-red-500/50',
  };

  const NoteCard: React.FC<{ note: any }> = ({ note }) => (
    <Card 
      className={`${colorClasses[note.color as keyof typeof colorClasses]} hover:glow transition-all duration-200 cursor-pointer border-2 hover:border-primary/30`}
      onClick={() => navigate(`/notes/${note.id}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base font-semibold line-clamp-2">{note.title}</CardTitle>
          <div className="flex space-x-1">
            {note.linked_tasks && note.linked_tasks.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                <Link2 size={10} className="mr-1" />
                {note.linked_tasks.length}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div 
          className="text-sm text-muted-foreground mb-3 line-clamp-3" 
          dangerouslySetInnerHTML={{ __html: note.content || '' }}
        />
        <div className="flex flex-wrap gap-1 mb-2">
          {note.tags && note.tags.map((tag: string) => (
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
        <div className="text-xs text-muted-foreground flex items-center">
          <FileText size={12} className="mr-1" />
          {note.created_at ? new Date(note.created_at).toLocaleDateString() : 'Unknown date'}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
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
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-24 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>

          {/* Notes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-3">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-5/6" />
                    <Skeleton className="h-3 w-2/3" />
                    <div className="flex gap-1 mt-3">
                      <Skeleton className="h-5 w-12 rounded-full" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center justify-center">
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
              className="pl-10 py-5"
            />
          </div>
          <Button size="sm" className="shrink-0 h-12 px-4" onClick={() => navigate('/notes/new')}>
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
            className="h-8"
          >
            All Notes
          </Button>
          {allTags.map(tag => (
            <Button
              key={tag}
              variant={selectedTag === tag ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
              className="h-8"
            >
              {tag}
            </Button>
          ))}
        </div>

        {/* Notes Grid */}
        {filteredNotes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredNotes.map(note => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Brain size={48} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No notes found</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {searchTerm || selectedTag ? 'Try adjusting your search or filters' : 'Start capturing your thoughts by creating your first note'}
            </p>
            <Button size="lg" onClick={() => navigate('/notes/new')} className="h-12 px-6">
              <Plus size={18} className="mr-2" />
              Create your first note
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesView;