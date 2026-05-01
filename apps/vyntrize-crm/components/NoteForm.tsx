'use client';

import { useState } from 'react';

interface NoteFormProps {
  initialNote?: string;
  initialIsPinned?: boolean;
  onSubmit: (note: string, isPinned: boolean) => void;
  onCancel: () => void;
}

export default function NoteForm({
  initialNote = '',
  initialIsPinned = false,
  onSubmit,
  onCancel,
}: NoteFormProps) {
  const [note, setNote] = useState(initialNote);
  const [isPinned, setIsPinned] = useState(initialIsPinned);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (note.trim().length === 0) {
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(note, isPinned);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div className="space-y-3">
        <div>
          <label htmlFor="note" className="sr-only">
            Note
          </label>
          <textarea
            id="note"
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note..."
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          />
        </div>

        <div className="flex items-center">
          <input
            id="pin-note"
            type="checkbox"
            checked={isPinned}
            onChange={(e) => setIsPinned(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="pin-note" className="ml-2 text-sm text-gray-700">
            Pin this note to the top
          </label>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={submitting || note.trim().length === 0}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Saving...' : initialNote ? 'Update Note' : 'Add Note'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
