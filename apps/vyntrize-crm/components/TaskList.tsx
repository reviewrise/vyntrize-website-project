'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, FunnelIcon, CheckCircleIcon, ClockIcon, BoltIcon, CheckIcon, PlayIcon, SparklesIcon, CalendarIcon, UserCircleIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import TaskModal from './TaskModal';

interface Task {
  id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  taskType?: string;
  payload?: any;
  lead: {
    id: string;
    title: string;
  };
  assignedTo: {
    id: string;
    displayName: string;
    email: string;
  } | null;
  createdBy: {
    id: string;
    displayName: string;
    email: string;
  };
}

interface TaskListProps {
  currentUserId: string;
  currentUserRole: string;
  leadId?: string; // Optional: filter by lead
}

const statusColors: Record<string, { bg: string; text: string; icon: any }> = {
  PENDING: { bg: 'var(--color-warning-soft)', text: 'var(--color-warning)', icon: ClockIcon },
  IN_PROGRESS: { bg: 'var(--color-primary-soft)', text: 'var(--color-primary)', icon: PlayIcon },
  COMPLETED: { bg: 'var(--color-success-soft)', text: 'var(--color-success)', icon: CheckIcon },
  CANCELLED: { bg: 'var(--color-danger-soft)', text: 'var(--color-danger)', icon: TrashIcon },
  FAILED: { bg: 'var(--color-danger-soft)', text: 'var(--color-danger)', icon: BoltIcon },
};

const priorityColors: Record<string, string> = {
  LOW: 'var(--color-text-subtle)',
  MEDIUM: 'var(--color-warning)',
  HIGH: 'var(--color-danger)',
  URGENT: '#ef4444', // Hardcoded bright red for urgent glowing effect
};

export default function TaskList({ currentUserId, currentUserRole, leadId }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  const [selectedId, setSelectedId] = useState<number | null>(null);
  
  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [showOverdue, setShowOverdue] = useState(false);
  
  // Action state
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    fetchTasks();
  }, [leadId, filterStatus, filterPriority, filterAssignee, showOverdue]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (leadId) params.append('leadId', leadId);
      if (filterStatus) params.append('status', filterStatus);
      if (filterPriority) params.append('priority', filterPriority);
      if (filterAssignee) params.append('assignedTo', filterAssignee);
      if (showOverdue) params.append('overdue', 'true');

      const response = await fetch(`/api/crm/tasks?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }

      const data = await response.json();
      setTasks(data.tasks);
      
      // Auto-select first task if none selected
      if (data.tasks.length > 0 && !selectedId) {
        setSelectedId(data.tasks[0].id);
      } else if (data.tasks.length === 0) {
        setSelectedId(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskSaved = () => {
    fetchTasks();
    setShowModal(false);
    setEditingTask(null);
  };

  const handleStatusChange = async (taskId: number, newStatus: string) => {
    setProcessingId(taskId);
    try {
      const response = await fetch(`/api/crm/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task status');
      }

      // Update locally
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update task');
    } finally {
      setProcessingId(null);
    }
  };
  
  const handleAiResolve = async (taskId: number) => {
    setProcessingId(taskId);
    try {
      const response = await fetch(`/api/crm/tasks/${taskId}/resolve`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to resolve task');
      const data = await response.json();
      // Update locally
      setTasks(tasks.map(t => t.id === taskId ? { ...t, taskType: data.task.taskType, payload: data.task.payload } : t));
    } catch (error) {
      alert('AI Resolution failed');
    } finally {
      setProcessingId(null);
    }
  };

  const handleAiApprove = async (taskId: number) => {
    setProcessingId(taskId);
    try {
      const response = await fetch(`/api/crm/tasks/${taskId}/approve`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to approve task');
      fetchTasks();
    } catch (error) {
      alert('Approval failed');
    } finally {
      setProcessingId(null);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;
      if (!selectedId) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const idx = tasks.findIndex(t => t.id === selectedId);
        if (idx >= 0 && idx < tasks.length - 1) setSelectedId(tasks[idx + 1].id);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const idx = tasks.findIndex(t => t.id === selectedId);
        if (idx > 0) setSelectedId(tasks[idx - 1].id);
      } else if (e.key.toLowerCase() === 'c' && selectedTask && selectedTask.status !== 'COMPLETED') {
        e.preventDefault();
        handleStatusChange(selectedTask.id, 'COMPLETED');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, tasks]);

  const isOverdue = (dueDate: string | null, status: string) => {
    if (!dueDate || status === 'COMPLETED' || status === 'CANCELLED' || status === 'FAILED') {
      return false;
    }
    return new Date(dueDate) < new Date();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const selectedTask = tasks.find(t => t.id === selectedId);

  if (loading && tasks.length === 0) {
    return (
      <div className="flex h-[700px] rounded-2xl animate-pulse" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <div className="w-1/3 border-r p-4 space-y-4" style={{ borderColor: 'var(--color-border)' }}>
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
        </div>
        <div className="w-2/3 p-8 space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/2" />
          <div className="h-32 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 rounded-xl" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <div className="flex flex-wrap gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500 bg-transparent text-gray-700"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="rounded-lg border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500 bg-transparent text-gray-700"
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>

          <label className="inline-flex items-center gap-2 px-3 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: showOverdue ? 'var(--color-danger-soft)' : 'transparent' }}>
            <input
              type="checkbox"
              checked={showOverdue}
              onChange={(e) => setShowOverdue(e.target.checked)}
              className="rounded border-gray-300 text-red-600 focus:ring-red-500 bg-transparent"
            />
            <span className="text-sm font-medium" style={{ color: showOverdue ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>Overdue</span>
          </label>
        </div>

        <button
          onClick={() => {
            setEditingTask(null);
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white rounded-xl shadow-md transition-transform active:scale-95 hover:opacity-90"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <PlusIcon className="h-5 w-5" />
          New Task
        </button>
      </div>

      {/* Task Modal */}
      {showModal && (
        <TaskModal
          task={editingTask}
          leadId={leadId}
          onClose={() => {
            setShowModal(false);
            setEditingTask(null);
          }}
          onSaved={handleTaskSaved}
        />
      )}

      {/* Main Split View */}
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[500px] rounded-2xl" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div className="h-20 w-20 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: 'var(--color-success-soft)' }}>
            <CheckCircleIcon className="h-10 w-10" style={{ color: 'var(--color-success)' }} />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>All Caught Up!</h2>
          <p className="text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
            You have no tasks matching the current filters.
          </p>
        </div>
      ) : (
        <div className="flex h-[700px] rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          {/* Left Pane: Task List */}
          <div className="w-[35%] flex flex-col" style={{ borderRight: '1px solid var(--color-border)' }}>
            <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ scrollbarWidth: 'thin' }}>
              {tasks.map(task => {
                const isSelected = selectedId === task.id;
                const overdue = isOverdue(task.dueDate, task.status);
                const pColor = priorityColors[task.priority] || 'var(--color-text-muted)';
                const StatusIcon = statusColors[task.status]?.icon || ClockIcon;

                return (
                  <button
                    key={task.id}
                    onClick={() => setSelectedId(task.id)}
                    className="w-full text-left p-3.5 rounded-xl transition-all group relative overflow-hidden"
                    style={{
                      backgroundColor: isSelected ? 'var(--color-primary-soft)' : 'transparent',
                      border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    }}
                  >
                    {/* Priority glow line */}
                    {task.priority === 'URGENT' && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 shadow-[0_0_8px_#ef4444]" />
                    )}

                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pColor }} />
                        <span className="text-xs font-bold tracking-wider" style={{ color: pColor }}>{task.priority}</span>
                      </div>
                      <span className="text-xs font-medium flex items-center gap-1" style={{ color: overdue ? 'var(--color-danger)' : 'var(--color-text-subtle)' }}>
                        {overdue ? 'Overdue' : formatDate(task.dueDate)}
                      </span>
                    </div>

                    <div className="font-semibold text-sm mb-1.5 line-clamp-2" style={{ color: 'var(--color-text)' }}>
                      {task.title}
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="truncate max-w-[150px]" style={{ color: 'var(--color-text-muted)' }}>
                        {task.lead.title}
                      </span>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full" style={{ backgroundColor: statusColors[task.status]?.bg, color: statusColors[task.status]?.text }}>
                        <StatusIcon className="h-3 w-3" />
                        <span className="font-semibold uppercase tracking-wider" style={{ fontSize: '10px' }}>{task.status.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Pane: Task Details */}
          <div className="w-[65%] flex flex-col relative bg-white" style={{ backgroundColor: 'var(--color-surface)' }}>
            {selectedTask ? (
              <>
                <div className="flex-1 overflow-y-auto p-8">
                  {/* Header Row */}
                  <div className="flex justify-between items-start mb-6 gap-4">
                    <h2 className="text-3xl font-extrabold leading-tight" style={{ color: 'var(--color-text)' }}>
                      {selectedTask.title}
                    </h2>
                    <button
                      onClick={() => {
                        setEditingTask(selectedTask);
                        setShowModal(true);
                      }}
                      className="shrink-0 p-2 rounded-lg transition-colors hover:bg-gray-100"
                      title="Edit Task"
                    >
                      <PencilIcon className="h-5 w-5" style={{ color: 'var(--color-text-muted)' }} />
                    </button>
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--color-raised)' }}>
                      <UserCircleIcon className="h-8 w-8" style={{ color: 'var(--color-text-muted)' }} />
                      <div>
                        <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--color-text-subtle)' }}>Lead / Context</p>
                        <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{selectedTask.lead.title}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--color-raised)' }}>
                      <CalendarIcon className="h-8 w-8" style={{ color: 'var(--color-text-muted)' }} />
                      <div>
                        <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--color-text-subtle)' }}>Due Date</p>
                        <p className="text-sm font-medium" style={{ color: isOverdue(selectedTask.dueDate, selectedTask.status) ? 'var(--color-danger)' : 'var(--color-text)' }}>
                          {formatDate(selectedTask.dueDate)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mb-8">
                    <h3 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-muted)' }}>Description</h3>
                    {selectedTask.description ? (
                      <div className="text-sm leading-relaxed whitespace-pre-wrap p-4 rounded-xl" style={{ backgroundColor: 'var(--color-raised)', color: 'var(--color-text)' }}>
                        {selectedTask.description}
                      </div>
                    ) : (
                      <p className="text-sm italic" style={{ color: 'var(--color-text-subtle)' }}>No description provided.</p>
                    )}
                  </div>

                  {/* AI Resolution Area */}
                  {selectedTask.status !== 'COMPLETED' && (
                    <div className="mb-8">
                      <h3 className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: 'var(--color-primary)' }}>
                        <SparklesIcon className="h-4 w-4" /> AI Copilot
                      </h3>
                      
                      {selectedTask.taskType === 'MANUAL' ? (
                        <div className="p-5 rounded-xl border-2 border-dashed" style={{ borderColor: 'var(--color-primary-soft)', backgroundColor: 'var(--color-raised)' }}>
                          <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
                            Let the AI automatically draft the email, prepare the document, or resolve this task based on its description and lead context.
                          </p>
                          <button
                            onClick={() => handleAiResolve(selectedTask.id)}
                            disabled={processingId === selectedTask.id || !selectedTask.description}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white shadow-md transition-transform active:scale-95 disabled:opacity-50"
                            style={{ backgroundColor: 'var(--color-primary)' }}
                          >
                            <SparklesIcon className="h-4 w-4" />
                            {processingId === selectedTask.id ? 'Drafting...' : 'Draft Resolution'}
                          </button>
                        </div>
                      ) : (
                        <div className="p-5 rounded-xl" style={{ backgroundColor: 'var(--color-success-soft)' }}>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="px-2 py-1 bg-white rounded text-xs font-bold" style={{ color: 'var(--color-success)' }}>
                              PROPOSED: {selectedTask.taskType}
                            </span>
                          </div>
                          <div className="text-sm mb-4 bg-white p-4 rounded-lg shadow-sm border border-emerald-100" style={{ color: 'var(--color-text)' }}>
                            {selectedTask.taskType === 'EMAIL' ? (
                              <>
                                <div className="mb-2"><strong className="text-gray-500 text-xs uppercase tracking-wider">To:</strong> {selectedTask.payload?.to}</div>
                                <div className="mb-3"><strong className="text-gray-500 text-xs uppercase tracking-wider">Subject:</strong> {selectedTask.payload?.subject}</div>
                                <div className="pt-3 border-t border-gray-100 text-gray-700 whitespace-pre-wrap font-medium">
                                  {selectedTask.payload?.body?.replace(/<[^>]+>/g, '')}
                                </div>
                              </>
                            ) : (
                              <pre className="font-mono text-xs overflow-x-auto">{JSON.stringify(selectedTask.payload, null, 2)}</pre>
                            )}
                          </div>
                          <button
                            onClick={() => handleAiApprove(selectedTask.id)}
                            disabled={processingId === selectedTask.id}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white shadow-md transition-transform active:scale-95 disabled:opacity-50"
                            style={{ backgroundColor: 'var(--color-success)' }}
                          >
                            <CheckIcon className="h-4 w-4" />
                            {processingId === selectedTask.id ? 'Executing...' : 'Approve & Execute Task'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Sticky Action Footer */}
                <div className="shrink-0 p-4 flex items-center justify-between" style={{ borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-raised)' }}>
                  <div className="flex gap-3">
                    {selectedTask.status !== 'COMPLETED' && (
                      <button
                        onClick={() => handleStatusChange(selectedTask.id, 'COMPLETED')}
                        disabled={processingId === selectedTask.id}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-transform active:scale-95 text-white"
                        style={{ backgroundColor: 'var(--color-success)' }}
                      >
                        <CheckIcon className="h-5 w-5" />
                        Mark Complete
                      </button>
                    )}
                    {selectedTask.status !== 'IN_PROGRESS' && selectedTask.status !== 'COMPLETED' && (
                      <button
                        onClick={() => handleStatusChange(selectedTask.id, 'IN_PROGRESS')}
                        disabled={processingId === selectedTask.id}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-transform active:scale-95"
                        style={{ backgroundColor: 'var(--color-primary-soft)', color: 'var(--color-primary)' }}
                      >
                        <PlayIcon className="h-5 w-5" />
                        Start Task
                      </button>
                    )}
                  </div>
                  
                  <div className="hidden md:flex items-center text-xs font-mono" style={{ color: 'var(--color-text-subtle)' }}>
                    {selectedTask.status !== 'COMPLETED' && (
                      <span className="flex items-center gap-2">
                        Press <kbd className="px-1.5 py-0.5 rounded border shadow-sm" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>C</kbd> to complete
                      </span>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                Select a task to view details
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
