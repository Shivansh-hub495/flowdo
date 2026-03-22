# Notes Feature Documentation

## Overview
The Notes feature provides users with a rich text editing experience for capturing and organizing thoughts, ideas, and information. It includes a full-featured editor with formatting options, tagging system, and color coding.

## Features
- Rich text editing with formatting options (bold, italic, lists, etc.)
- Tagging system for organizing notes
- Color-coded notes for visual organization
- Search and filter functionality
- Full CRUD operations (Create, Read, Update, Delete)

## Technical Implementation

### Database Schema
The notes feature uses a dedicated `notes` table in the Supabase database:

```sql
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    tags TEXT[] DEFAULT '{}',
    linked_tasks UUID[] DEFAULT '{}',
    color TEXT CHECK (color IN ('purple', 'blue', 'green', 'orange', 'red')) DEFAULT 'blue',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Components
1. **NotesView** - The main notes dashboard displaying all notes in a grid layout
2. **NoteEditor** - The rich text editor component for creating and editing notes
3. **RichTextEditor** - A reusable rich text editor component using ReactQuill

### Hooks
1. **useNotes** - Custom hook for managing notes data and operations

### Routes
- `/notes` - Main notes dashboard
- `/notes/new` - Create a new note
- `/notes/:id` - Edit an existing note

## Usage
1. Navigate to the Notes section from the sidebar
2. Click "New Note" to create a note
3. Use the rich text editor to format your content
4. Add tags for organization
5. Select a color for visual categorization
6. Save your note

## Future Enhancements
- Note sharing functionality
- Note templates
- Advanced search with content indexing
- Note versioning/history