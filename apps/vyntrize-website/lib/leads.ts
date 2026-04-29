// Lead types aligned with Prisma ContactSubmission model

export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL_SENT' | 'WON' | 'LOST' | 'SPAM';
export type LeadPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Lead {
  id: string;
  createdAt: string;
  updatedAt: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string | null;
  intent: string;
  message: string;
  status: LeadStatus;
  priority: LeadPriority;
  assignedTo: string | null;
  firstResponseAt: string | null;
  lastContactedAt: string | null;
  notes: string | null;
  source: string | null;
  ipAddress: string | null;
  userAgent: string | null;
}

export async function getLeads(status?: string): Promise<Lead[]> {
  const url = status && status !== 'all' ? `/api/leads?status=${status}` : '/api/leads';
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return [];
  return res.json();
}

export async function updateLead(id: string, updates: Partial<Pick<Lead, 'status' | 'notes' | 'priority' | 'assignedTo'>>): Promise<Lead | null> {
  const res = await fetch(`/api/leads/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function deleteLead(id: string): Promise<void> {
  await fetch(`/api/leads/${id}`, { method: 'DELETE' });
}

export async function deleteAllLeads(): Promise<void> {
  await fetch('/api/leads', { method: 'DELETE' });
}

export const statusLabels: Record<LeadStatus, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Qualified',
  PROPOSAL_SENT: 'Proposal Sent',
  WON: 'Won',
  LOST: 'Lost',
  SPAM: 'Spam',
};

export const statusColors: Record<LeadStatus, string> = {
  NEW: 'bg-blue-100 text-blue-700',
  CONTACTED: 'bg-violet-100 text-violet-700',
  QUALIFIED: 'bg-amber-100 text-amber-700',
  PROPOSAL_SENT: 'bg-orange-100 text-orange-700',
  WON: 'bg-emerald-100 text-emerald-700',
  LOST: 'bg-slate-100 text-slate-500',
  SPAM: 'bg-red-100 text-red-500',
};

export const priorityLabels: Record<LeadPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

export const priorityColors: Record<LeadPriority, string> = {
  LOW: 'bg-slate-100 text-slate-500',
  MEDIUM: 'bg-blue-100 text-blue-600',
  HIGH: 'bg-amber-100 text-amber-700',
  URGENT: 'bg-red-100 text-red-600',
};

export const allStatuses: LeadStatus[] = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'WON', 'LOST', 'SPAM'];
