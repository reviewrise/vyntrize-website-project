'use client';

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  body: string;
  variables: any;
  isShared: boolean;
}

interface TemplateEditorProps {
  template?: EmailTemplate | null;
  currentUserRole: string;
  onClose: () => void;
  onSaved: () => void;
}

const commonVariables = [
  { name: 'firstName', description: 'Contact first name' },
  { name: 'lastName', description: 'Contact last name' },
  { name: 'email', description: 'Contact email' },
  { name: 'companyName', description: 'Company name' },
  { name: 'jobTitle', description: 'Contact job title' },
  { name: 'leadTitle', description: 'Lead title' },
  { name: 'dealValue', description: 'Deal value' },
];

export default function TemplateEditor({ template, currentUserRole, onClose, onSaved }: TemplateEditorProps) {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isShared, setIsShared] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (template) {
      setName(template.name);
      setSubject(template.subject);
      setBody(template.body);
      setIsShared(template.isShared);
    }
  }, [template]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !subject.trim() || !body.trim()) {
      return;
    }

    setSubmitting(true);

    try {
      const url = template
        ? `/api/crm/email-templates/${template.id}`
        : '/api/crm/email-templates';
      const method = template ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          subject: subject.trim(),
          body: body.trim(),
          isShared,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save template');
      }

      onSaved();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to save template');
    } finally {
      setSubmitting(false);
    }
  };

  const insertVariable = (variable: string, field: 'subject' | 'body') => {
    const variableText = `{{${variable}}}`;
    if (field === 'subject') {
      setSubject((prev) => prev + variableText);
    } else {
      setBody((prev) => prev + variableText);
    }
  };

  return (
    <Transition.Root show={true} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl sm:p-6">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 w-full text-center sm:mt-0 sm:text-left">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      {template ? 'Edit Email Template' : 'Create Email Template'}
                    </Dialog.Title>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                          Template Name *
                        </label>
                        <input
                          type="text"
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          placeholder="e.g., Welcome Email, Follow-up"
                          required
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                            Subject Line *
                          </label>
                          <div className="text-xs text-gray-500">
                            Insert variable:
                            {commonVariables.slice(0, 3).map((v) => (
                              <button
                                key={v.name}
                                type="button"
                                onClick={() => insertVariable(v.name, 'subject')}
                                className="ml-2 text-blue-600 hover:text-blue-800"
                              >
                                {`{{${v.name}}}`}
                              </button>
                            ))}
                          </div>
                        </div>
                        <input
                          type="text"
                          id="subject"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          placeholder="e.g., Hi {{firstName}}, thanks for your interest!"
                          required
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label htmlFor="body" className="block text-sm font-medium text-gray-700">
                            Email Body *
                          </label>
                        </div>
                        <textarea
                          id="body"
                          rows={12}
                          value={body}
                          onChange={(e) => setBody(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-mono text-xs"
                          placeholder="Hi {{firstName}},&#10;&#10;Thank you for reaching out to us..."
                          required
                        />
                        <div className="mt-2 text-xs text-gray-500">
                          <p className="font-medium mb-1">Available variables:</p>
                          <div className="grid grid-cols-2 gap-2">
                            {commonVariables.map((v) => (
                              <button
                                key={v.name}
                                type="button"
                                onClick={() => insertVariable(v.name, 'body')}
                                className="text-left hover:bg-gray-50 p-1 rounded"
                              >
                                <span className="text-blue-600">{`{{${v.name}}}`}</span>
                                <span className="text-gray-500"> - {v.description}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {currentUserRole === 'ADMIN' && (
                        <div className="flex items-center">
                          <input
                            id="is-shared"
                            type="checkbox"
                            checked={isShared}
                            onChange={(e) => setIsShared(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor="is-shared" className="ml-2 text-sm text-gray-700">
                            Share this template with all users
                          </label>
                        </div>
                      )}

                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-2">
                        <button
                          type="submit"
                          disabled={submitting}
                          className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:w-auto disabled:opacity-50"
                        >
                          {submitting ? 'Saving...' : template ? 'Update Template' : 'Create Template'}
                        </button>
                        <button
                          type="button"
                          onClick={onClose}
                          disabled={submitting}
                          className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
