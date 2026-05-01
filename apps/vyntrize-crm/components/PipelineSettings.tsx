'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, ArrowsUpDownIcon } from '@heroicons/react/24/outline';

interface PipelineStage {
  id: number;
  name: string;
  description: string | null;
  stageOrder: number;
  probability: number;
  autoAssignToId: string | null;
  autoAssignTo: {
    id: string;
    displayName: string;
    email: string;
  } | null;
  autoCreateTask: boolean;
  taskTemplate: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function PipelineSettings() {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStages();
  }, []);

  const fetchStages = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/crm/pipeline-stages');

      if (!response.ok) {
        throw new Error('Failed to fetch pipeline stages');
      }

      const data = await response.json();
      setStages(data.stages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (stageId: number, isActive: boolean) => {
    try {
      const response = await fetch(`/api/crm/pipeline-stages/${stageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (!response.ok) {
        throw new Error('Failed to update stage');
      }

      fetchStages();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update stage');
    }
  };

  const handleDeleteStage = async (stageId: number) => {
    if (!confirm('Are you sure you want to delete this pipeline stage?')) {
      return;
    }

    try {
      const response = await fetch(`/api/crm/pipeline-stages/${stageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete stage');
      }

      fetchStages();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete stage');
    }
  };

  if (loading && stages.length === 0) {
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
      {/* Info Box */}
      <div className="rounded-md bg-blue-50 p-4">
        <p className="text-sm text-blue-800">
          Pipeline stages define the steps in your sales process. Configure automation rules to automatically assign leads or create tasks when a lead enters a stage.
        </p>
      </div>

      {/* Stages List */}
      {stages.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">No pipeline stages configured yet.</p>
          <p className="text-xs text-gray-400 mt-1">Contact your administrator to set up pipeline stages.</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul role="list" className="divide-y divide-gray-200">
            {stages.map((stage, index) => (
              <li key={stage.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                        {stage.stageOrder}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900">{stage.name}</p>
                          {!stage.isActive && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              Inactive
                            </span>
                          )}
                        </div>
                        {stage.description && (
                          <p className="mt-1 text-sm text-gray-500">{stage.description}</p>
                        )}
                        <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                          <span>Win Probability: {stage.probability}%</span>
                          {stage.autoAssignTo && (
                            <>
                              <span>•</span>
                              <span>Auto-assign to {stage.autoAssignTo.displayName}</span>
                            </>
                          )}
                          {stage.autoCreateTask && (
                            <>
                              <span>•</span>
                              <span>Auto-create task</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 flex items-center gap-2">
                      <button
                        onClick={() => handleToggleActive(stage.id, stage.isActive)}
                        className={`px-3 py-1 text-xs font-medium rounded-md ${
                          stage.isActive
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {stage.isActive ? 'Active' : 'Inactive'}
                      </button>
                      <button
                        onClick={() => handleDeleteStage(stage.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete stage"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Note */}
      <div className="text-sm text-gray-500">
        <p>
          <strong>Note:</strong> Pipeline stage management is currently view-only. To add or edit stages, use the API or database directly.
        </p>
      </div>
    </div>
  );
}
