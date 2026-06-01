'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import NoteForm from './NoteForm';

interface Note {
  id: number;
  note: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    displayName: string;
    email: string;
  };
}

interface LeadNotesProps {
  leadId: string;
  currentUserId: string;
  currentUserRole: string;
}

export default function LeadNotes({ leadId, currentUserId, currentUserRole }: LeadNotesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [deletingNoteId, setDeletingNoteId] = useState<number | null>(null);

  useEffect(() => {
    fetchNotes();
  }, [leadId]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/crm/leads/${leadId}/notes`);

      if (!response.ok) {
        throw new Error('Failed to fetch notes');
      }

      const data = await response.json();
      setNotes(data.notes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async (noteText: string, isPinned: boolean) => {
    try {
      const response = await fetch(`/api/crm/leads/${leadId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: noteText, isPinned }),
      });

      if (!response.ok) {
        throw new Error('Failed to create note');
      }

      await fetchNotes();
      setShowForm(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create note');
    }
  };

  const handleUpdateNote = async (noteId: number, noteText: string, isPinned: boolean) => {
    try {
      const response = await fetch(`/api/crm/leads/${leadId}/notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: noteText, isPinned }),
      });

      if (!response.ok) {
        throw new Error('Failed to update note');
      }

      await fetchNotes();
      setEditingNote(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update note');
    }
  };

  const handleTogglePin = async (note: Note) => {
    try {
      const response = await fetch(`/api/crm/leads/${leadId}/notes/${note.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !note.isPinned }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle pin');
      }

      await fetchNotes();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to toggle pin');
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!confirm('Are you sure you want to delete this note?')) {
      return;
    }

    try {
      setDeletingNoteId(noteId);

      const response = await fetch(`/api/crm/leads/${leadId}/notes/${noteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete note');
      }

      await fetchNotes();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete note');
    } finally {
      setDeletingNoteId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const canEditNote = (note: Note) => {
    if (!note.user) return currentUserRole === 'ADMIN';
    return note.user.id === currentUserId || currentUserRole === 'ADMIN';
  };

  const canDeleteNote = (note: Note) => {
    if (!note.user) return currentUserRole === 'ADMIN';
    return note.user.id === currentUserId || currentUserRole === 'ADMIN';
  };

  if (loading && notes.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <p className="text-sm text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Notes</h3>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-4 w-4" />
          Add Note
        </button>
      </div>

      {/* Note Form */}
      {showForm && (
        <NoteForm
          onSubmit={handleCreateNote}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Notes List */}
      {notes.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">No notes yet. Add your first note above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className={`bg-white border rounded-lg p-4 ${
                note.isPinned ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'
              }`}
            >
              {editingNote?.id === note.id ? (
                <NoteForm
                  initialNote={note.note}
                  initialIsPinned={note.isPinned}
                  onSubmit={(text, isPinned) => handleUpdateNote(note.id, text, isPinned)}
                  onCancel={() => setEditingNote(null)}
                />
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 whitespace-pre-wrap break-words">
                        {note.note}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleTogglePin(note)}
                        className="p-1 text-gray-400 hover:text-yellow-500 transition-colors"
                        title={note.isPinned ? 'Unpin note' : 'Pin note'}
                      >
                        {note.isPinned ? (
                          <StarSolidIcon className="h-5 w-5 text-yellow-500" />
                        ) : (
                          <StarOutlineIcon className="h-5 w-5" />
                        )}
                      </button>
                      {canEditNote(note) && (
                        <button
                          onClick={() => setEditingNote(note)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit note"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                      )}
                      {canDeleteNote(note) && (
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          disabled={deletingNoteId === note.id}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                          title="Delete note"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                    <span className="font-medium">{note.user?.displayName ?? 'System'}</span>
                    <span>•</span>
                    <span>{formatDate(note.createdAt)}</span>
                    {note.updatedAt !== note.createdAt && (
                      <>
                        <span>•</span>
                        <span className="italic">edited</span>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
