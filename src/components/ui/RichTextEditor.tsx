import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Card, CardContent } from '@/components/ui/card';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
  value, 
  onChange,
  placeholder = "Write your note here...",
  className = ""
}) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Only render on client side to avoid SSR issues
  if (!isClient) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="h-64 bg-muted rounded-md animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  const modules = {
    toolbar: {
      container: [
        [{ 'font': [] }],
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'script': 'sub'}, { 'script': 'super' }],
        ['blockquote', 'code-block'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'indent': '-1'}, { 'indent': '+1' }],
        ['link', 'image', 'video'],
        ['clean'],
        ['undo', 'redo']
      ],
    },
    clipboard: {
      matchVisual: false,
    },
  };

  const formats = [
    'font',
    'header',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'script',
    'blockquote', 'code-block',
    'list', 'bullet', 'ordered', 'indent',
    'link', 'image', 'video'
  ];

  // Custom CSS for ruled lines in the editor
  const customStyles = `
    .ql-editor {
      line-height: 1.5;
      padding: 20px;
    }
    
    .ql-editor p {
      margin-bottom: 0;
      line-height: 1.8;
      position: relative;
    }
    
    .ql-editor p:not(:last-child)::after {
      content: "";
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: 1px;
      background: linear-gradient(to right, #e5e7eb 50%, transparent 50%);
      background-size: 10px 1px;
      background-repeat: repeat-x;
    }
    
    .ql-toolbar.ql-snow {
      position: sticky;
      top: 0;
      z-index: 10;
      background: white;
      border-top-left-radius: 0.5rem;
      border-top-right-radius: 0.5rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    
    .ql-container.ql-snow {
      border-bottom-left-radius: 0.5rem;
      border-bottom-right-radius: 0.5rem;
    }
  `;

  return (
    <Card className={className}>
      <style>{customStyles}</style>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="h-full"
      />
    </Card>
  );
};

export default RichTextEditor;