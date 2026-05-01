'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import { ShareIcon } from '@heroicons/react/24/solid';
import TemplateEditor from './TemplateEditor';

interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  body: string;
  variables: any;
  isShared: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    displayName: string;
    email: string;
  } | null;
}

interface EmailTemplateListProps {
  currentUserId: string;
  currentUserRole: string;
}

export default function EmailTemplateList({ currentUserId, currentUserRole }: EmailTemplateListProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/crm/email-templates');

      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }

      const data = await response.json();
      setTemplates(data.templates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSaved = () => {
    fetchTemplates();
    setShowEditor(false);
    setEditingTemplate(null);
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setShowEditor(true);
  };

  const handleDeleteTemplate = async (templateId: number) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      const response = await fetch(`/api/crm/email-templates/${templateId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete template');
      }

      fetchTemplates();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete template');
    }
  };

  const canEditTemplate = (template: EmailTemplate) => {
    return template.user?.id === currentUserId || currentUserRole === 'ADMIN';
  };

  const canDeleteTemplate = (template: EmailTemplate) => {
    return template.user?.id === currentUserId || currentUserRole === 'ADMIN';
  };

  const extractVariables = (text: string): string[] => {
    const regex = /\{\{(\w+)\}\}/g;
    const matches = text.matchAll(regex);
    const variables = new Set<string>();
    for (const match of matches) {
      variables.add(match[1]);
    }
    return Array.from(variables);
  };

  if (loading && templates.length === 0) {
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
        <div className="text-sm text-gray-500">
          {templates.length} template{templates.length !== 1 ? 's' : ''}
        </div>
        <button
          onClick={() => {
            setEditingTemplate(null);
            setShowEditor(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-4 w-4" />
          New Template
        </button>
      </div>

      {/* Template Editor Modal */}
      {showEditor && (
        <TemplateEditor
          template={editingTemplate}
          currentUserRole={currentUserRole}
          onClose={() => {
            setShowEditor(false);
            setEditingTemplate(null);
          }}
          onSaved={handleTemplateSaved}
        />
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setPreviewTemplate(null)} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
              <h3 className="text-lg font-semibold mb-4">{previewTemplate.name}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject:</label>
                  <p className="text-sm text-gray-900">{previewTemplate.subject}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Body:</label>
                  <div className="text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-4 rounded border border-gray-200">
                    {previewTemplate.body}
                  </div>
                </div>
                {extractVariables(previewTemplate.subject + ' ' + previewTemplate.body).length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Variables:</label>
                    <div className="flex flex-wrap gap-2">
                      {extractVariables(previewTemplate.subject + ' ' + previewTemplate.body).map((variable) => (
                        <span
                          key={variable}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {`{{${variable}}}`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Templates List */}
      {templates.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">No templates yet. Create your first template above.</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul role="list" className="divide-y divide-gray-200">
            {templates.map((template) => {
              const variables = extractVariables(template.subject + ' ' + template.body);

              return (
                <li key={template.id}>
                  <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 truncate">{template.name}</p>
                          {template.isShared && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              <ShareIcon className="h-3 w-3" />
                              Shared
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-500 truncate">{template.subject}</p>
                        {variables.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {variables.slice(0, 3).map((variable) => (
                              <span
                                key={variable}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
                              >
                                {`{{${variable}}}`}
                              </span>
                            ))}
                            {variables.length > 3 && (
                              <span className="text-xs text-gray-500">+{variables.length - 3} more</span>
                            )}
                          </div>
                        )}
                        <p className="mt-2 text-xs text-gray-500">
                          Created by {template.user?.displayName || 'Unknown'}
                        </p>
                      </div>
                      <div className="ml-4 flex items-center gap-2">
                        <button
                          onClick={() => setPreviewTemplate(template)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Preview template"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        {canEditTemplate(template) && (
                          <button
                            onClick={() => handleEditTemplate(template)}
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Edit template"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                        )}
                        {canDeleteTemplate(template) && (
                          <button
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete template"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
