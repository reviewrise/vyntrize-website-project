'use client';

import { useState, useEffect } from 'react';
import {
  ClockIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  CursorArrowRaysIcon,
  ArrowDownTrayIcon,
  PhoneIcon,
  ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline';

interface Activity {
  id: number;
  activityType: string;
  activityName: string | null;
  activityData: any;
  pageUrl: string | null;
  sessionId: string | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface LeadActivityTimelineProps {
  leadId: string;
}

const activityIcons: Record<string, React.ComponentType<any>> = {
  page_view: DocumentTextIcon,
  form_submit: CursorArrowRaysIcon,
  email_open: EnvelopeIcon,
  email_click: CursorArrowRaysIcon,
  download: ArrowDownTrayIcon,
  call: PhoneIcon,
  note: ChatBubbleLeftIcon,
  custom: ClockIcon,
};

const activityColors: Record<string, string> = {
  page_view: 'bg-blue-100 text-blue-600',
  form_submit: 'bg-green-100 text-green-600',
  email_open: 'bg-purple-100 text-purple-600',
  email_click: 'bg-indigo-100 text-indigo-600',
  download: 'bg-orange-100 text-orange-600',
  call: 'bg-yellow-100 text-yellow-600',
  note: 'bg-gray-100 text-gray-600',
  custom: 'bg-gray-100 text-gray-600',
};

const activityLabels: Record<string, string> = {
  page_view: 'Page View',
  form_submit: 'Form Submission',
  email_open: 'Email Opened',
  email_click: 'Email Link Clicked',
  download: 'Download',
  call: 'Phone Call',
  note: 'Note',
  custom: 'Custom Event',
};

export default function LeadActivityTimeline({ leadId }: LeadActivityTimelineProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchActivities();
  }, [leadId, currentPage, filterType]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: '20',
      });

      if (filterType) {
        params.append('activityType', filterType);
      }

      const response = await fetch(`/api/crm/leads/${leadId}/activities?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch activities');
      }

      const data = await response.json();
      setActivities(data.activities);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const getActivityDescription = (activity: Activity): string => {
    switch (activity.activityType) {
      case 'page_view':
        return activity.pageUrl || 'Viewed a page';
      case 'form_submit':
        return `Submitted ${activity.activityName || 'a form'}`;
      case 'email_open':
        return `Opened email: ${activity.activityData?.subject || 'Unknown'}`;
      case 'email_click':
        return `Clicked link in email`;
      case 'download':
        return `Downloaded ${activity.activityData?.fileName || 'a file'}`;
      case 'call':
        return `${activity.activityData?.direction || 'Phone'} call`;
      case 'note':
        return activity.activityData?.note || 'Added a note';
      default:
        return activity.activityName || 'Custom activity';
    }
  };

  const Icon = (type: string) => activityIcons[type] || ClockIcon;

  if (loading && activities.length === 0) {
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
      {/* Filter */}
      <div className="flex items-center gap-2">
        <label htmlFor="activity-filter" className="text-sm font-medium text-gray-700">
          Filter:
        </label>
        <select
          id="activity-filter"
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value);
            setCurrentPage(1);
          }}
          className="rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">All Activities</option>
          <option value="page_view">Page Views</option>
          <option value="form_submit">Form Submissions</option>
          <option value="email_open">Email Opens</option>
          <option value="email_click">Email Clicks</option>
          <option value="download">Downloads</option>
        </select>
      </div>

      {/* Timeline */}
      {activities.length === 0 ? (
        <div className="text-center py-12">
          <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No activities</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filterType ? 'No activities match the selected filter.' : 'No activities recorded yet.'}
          </p>
        </div>
      ) : (
        <div className="flow-root">
          <ul role="list" className="-mb-8">
            {activities.map((activity, activityIdx) => {
              const ActivityIcon = Icon(activity.activityType);
              const iconColor = activityColors[activity.activityType] || activityColors.custom;

              return (
                <li key={activity.id}>
                  <div className="relative pb-8">
                    {activityIdx !== activities.length - 1 ? (
                      <span
                        className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span
                          className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${iconColor}`}
                        >
                          <ActivityIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      </div>
                      <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {activityLabels[activity.activityType] || 'Activity'}
                          </p>
                          <p className="text-sm text-gray-500">{getActivityDescription(activity)}</p>
                        </div>
                        <div className="whitespace-nowrap text-right text-sm text-gray-500">
                          <time dateTime={activity.createdAt}>{formatDate(activity.createdAt)}</time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={currentPage === pagination.totalPages}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(currentPage - 1) * pagination.pageSize + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * pagination.pageSize, pagination.total)}
                </span>{' '}
                of <span className="font-medium">{pagination.total}</span> activities
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300">
                  Page {currentPage} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={currentPage === pagination.totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
