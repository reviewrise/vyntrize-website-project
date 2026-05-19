'use client';

import { useState, useEffect, useCallback } from 'react';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import EmailComposer from '@/components/EmailComposer';
import EmailHistory from '@/components/EmailHistory';
import ActivityLogger from '@/components/ActivityLogger';

interface LeadDetailClientProps {
  leadId: string;
  contactEmail: string;
  contactName: string;
  initialManualOverride?: boolean;
}

export default function LeadDetailClient({
  leadId,
  contactEmail,
  contactName,
  initialManualOverride = false,
}: LeadDetailClientProps) {
  const [isEmailComposerOpen, setIsEmailComposerOpen] = useState(false);
  const [manualOverride, setManualOverride] = useState(initialManualOverride);
  const [overrideLoading, setOverrideLoading] = useState(false);

  const handleManualOverrideChange = async (checked: boolean) => {
    setOverrideLoading(true);
    try {
      const res = await fetch(`/api/crm/leads/${leadId}/manual-override`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manualOverride: checked }),
      });
      if (res.ok) {
        setManualOverride(checked);
      }
    } catch (err) {
      console.error('Failed to update manual override', err);
    } finally {
      setOverrideLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-3 flex-wrap">
        {/* Manual override badge */}
        {manualOverride && (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{
              backgroundColor: 'rgba(245,158,11,0.12)',
              color: 'var(--color-warning, #f59e0b)',
              border: '1px solid rgba(245,158,11,0.3)',
            }}
          >
            Auto-progression disabled
          </span>
        )}

        {/* Manual override toggle */}
        <label
          className="flex items-center gap-2 cursor-pointer select-none"
          style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}
        >
          <span>Exempt from auto-progression</span>
          <button
            role="switch"
            aria-checked={manualOverride}
            disabled={overrideLoading}
            onClick={() => handleManualOverrideChange(!manualOverride)}
            style={{
              width: '36px',
              height: '20px',
              borderRadius: '10px',
              border: 'none',
              cursor: overrideLoading ? 'not-allowed' : 'pointer',
              backgroundColor: manualOverride
                ? 'var(--color-warning, #f59e0b)'
                : 'var(--color-border)',
              position: 'relative',
              transition: 'background-color 0.2s',
              flexShrink: 0,
              opacity: overrideLoading ? 0.6 : 1,
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: '2px',
                left: manualOverride ? '18px' : '2px',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: '#fff',
                transition: 'left 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }}
            />
          </button>
        </label>

        {/* Log Activity button */}
        <ActivityLogger
          leadId={leadId}
          onLogged={() => window.location.reload()}
        />

        {/* Send Email button */}
        <button
          onClick={() => setIsEmailComposerOpen(true)}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <EnvelopeIcon className="h-4 w-4" />
          Send Email
        </button>
      </div>

      <EmailComposer
        isOpen={isEmailComposerOpen}
        onClose={() => setIsEmailComposerOpen(false)}
        defaultTo={contactEmail}
        defaultToName={contactName}
        leadId={leadId}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </>
  );
}

// Separate export for EmailHistory section
export function LeadEmailHistory({ leadId }: { leadId: string }) {
  return <EmailHistory id={leadId} type="lead" />;
}

// ─── Active Drip Sequences Section ───────────────────────────────────────────

interface DripEnrollmentRow {
  id: string;
  sequenceId: string;
  sequenceName: string;
  currentStepIndex: number;
  totalSteps: number;
  enrolledAt: string;
  status: string;
}

export function LeadDripSequences({ leadId }: { leadId: string }) {
  const [enrollments, setEnrollments] = useState<DripEnrollmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [unenrolling, setUnenrolling] = useState<string | null>(null);

  const fetchEnrollments = useCallback(async () => {
    try {
      const res = await fetch(`/api/crm/leads/${leadId}/drip-enrollments`);
      if (res.ok) {
        const data = await res.json();
        setEnrollments(data.enrollments ?? []);
      }
    } catch (err) {
      console.error('Failed to fetch drip enrollments', err);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  const handleUnenroll = async (sequenceId: string, enrollmentId: string) => {
    setUnenrolling(enrollmentId);
    try {
      const res = await fetch(
        `/api/automation/drip-sequences/${sequenceId}/enrollments/${enrollmentId}`,
        { method: 'DELETE' }
      );
      if (res.ok) {
        setEnrollments((prev) => prev.filter((e) => e.id !== enrollmentId));
      }
    } catch (err) {
      console.error('Failed to unenroll', err);
    } finally {
      setUnenrolling(null);
    }
  };

  if (loading) {
    return (
      <div
        className="rounded-2xl p-6"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
        }}
      >
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Loading drip sequences…
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div
        className="px-5 py-4"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
          Active Drip Sequences
        </p>
      </div>

      {enrollments.length === 0 ? (
        <div className="px-5 py-6">
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            No active drip sequence enrollments.
          </p>
        </div>
      ) : (
        <div>
          {enrollments.map((enrollment, i) => (
            <div
              key={enrollment.id}
              className="px-5 py-4 flex items-center justify-between gap-4"
              style={{
                borderBottom:
                  i < enrollments.length - 1
                    ? '1px solid var(--color-border)'
                    : 'none',
              }}
            >
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-medium truncate"
                  style={{ color: 'var(--color-text)' }}
                >
                  {enrollment.sequenceName}
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Step {enrollment.currentStepIndex + 1} of {enrollment.totalSteps} ·
                  Enrolled {new Date(enrollment.enrolledAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() =>
                  handleUnenroll(enrollment.sequenceId, enrollment.id)
                }
                disabled={unenrolling === enrollment.id}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold"
                style={{
                  backgroundColor: 'var(--color-raised)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-muted)',
                  cursor:
                    unenrolling === enrollment.id ? 'not-allowed' : 'pointer',
                  opacity: unenrolling === enrollment.id ? 0.6 : 1,
                  flexShrink: 0,
                }}
              >
                {unenrolling === enrollment.id ? 'Removing…' : 'Unenroll'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
