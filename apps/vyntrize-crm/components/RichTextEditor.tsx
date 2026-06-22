'use client';

import React, { useRef, useEffect, useState } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  RemoveFormatting, 
  Strikethrough,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Sync initial value once when editor is mounted
  useEffect(() => {
    if (isMounted && editorRef.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [isMounted]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const executeCommand = (command: string, arg: string = '') => {
    document.execCommand(command, false, arg);
    handleInput();
  };

  if (!isMounted) {
    return <div className="h-48 border border-gray-200 rounded-lg animate-pulse bg-gray-50" />;
  }

  return (
    <div className="flex flex-col border rounded-lg overflow-hidden bg-white shadow-sm transition-all focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500" style={{ borderColor: 'var(--color-border)' }}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 border-b select-none" style={{ borderColor: 'var(--color-border)' }}>
        <button
          type="button"
          onClick={() => executeCommand('bold')}
          className="p-1.5 rounded hover:bg-gray-200 text-gray-700 transition-colors"
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('italic')}
          className="p-1.5 rounded hover:bg-gray-200 text-gray-700 transition-colors"
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('underline')}
          className="p-1.5 rounded hover:bg-gray-200 text-gray-700 transition-colors"
          title="Underline"
        >
          <Underline className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('strikeThrough')}
          className="p-1.5 rounded hover:bg-gray-200 text-gray-700 transition-colors"
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </button>

        <span className="w-px h-4 bg-gray-300 mx-1" />

        <button
          type="button"
          onClick={() => executeCommand('justifyLeft')}
          className="p-1.5 rounded hover:bg-gray-200 text-gray-700 transition-colors"
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('justifyCenter')}
          className="p-1.5 rounded hover:bg-gray-200 text-gray-700 transition-colors"
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('justifyRight')}
          className="p-1.5 rounded hover:bg-gray-200 text-gray-700 transition-colors"
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </button>

        <span className="w-px h-4 bg-gray-300 mx-1" />

        <button
          type="button"
          onClick={() => executeCommand('insertUnorderedList')}
          className="p-1.5 rounded hover:bg-gray-200 text-gray-700 transition-colors"
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('insertOrderedList')}
          className="p-1.5 rounded hover:bg-gray-200 text-gray-700 transition-colors"
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </button>

        <span className="w-px h-4 bg-gray-300 mx-1" />

        <button
          type="button"
          onClick={() => executeCommand('removeFormat')}
          className="p-1.5 rounded hover:bg-gray-200 text-gray-700 transition-colors text-red-500"
          title="Clear Formatting"
        >
          <RemoveFormatting className="h-4 w-4" />
        </button>
      </div>

      {/* Editable Content */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="p-4 min-h-[200px] max-h-[400px] overflow-y-auto focus:outline-none text-sm text-gray-800 leading-relaxed font-medium rich-editor-content"
        data-placeholder={placeholder}
        style={{
          minHeight: '200px',
        }}
      />
      <style>{`
        .rich-editor-content:empty::before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
          display: block;
        }
      `}</style>
    </div>
  );
}
