'use client';

import { Draggable } from '@hello-pangea/dnd';
import Link from 'next/link';
import { AlertCircle, DollarSign, User } from 'lucide-react';

interface LeadCardProps {
    lead: {
        id: string;
        title: string;
        stage: string;
        dealValue: string | null;
        closeDate: string | null;
        contact: { firstName: string; lastName: string };
        assignee: { displayName: string } | null;
    };
    index: number;
}

const OPEN_STAGES = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT'];

export function LeadCard({ lead, index }: LeadCardProps) {
    const isOverdue =
        lead.closeDate &&
        new Date(lead.closeDate) < new Date() &&
        OPEN_STAGES.includes(lead.stage);

    return (
        <Draggable draggableId={lead.id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className="rounded-xl p-3 mb-2 cursor-grab active:cursor-grabbing"
                    style={{
                        backgroundColor: snapshot.isDragging ? 'var(--color-raised)' : 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        boxShadow: snapshot.isDragging ? '0 4px 12px rgba(0,0,0,0.3)' : 'none',
                        ...provided.draggableProps.style,
                    }}
                >
                    <Link href={`/leads/${lead.id}`} onClick={(e) => e.stopPropagation()}>
                        <p className="text-xs font-semibold mb-1.5 hover:underline" style={{ color: 'var(--color-text)' }}>
                            {lead.title}
                        </p>
                    </Link>

                    <p className="text-[11px] mb-2" style={{ color: 'var(--color-text-muted)' }}>
                        {lead.contact.firstName} {lead.contact.lastName}
                    </p>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {lead.dealValue && (
                                <span className="flex items-center gap-0.5 text-[10px] font-semibold text-emerald-400">
                                    <DollarSign className="h-2.5 w-2.5" />
                                    {parseFloat(lead.dealValue).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                </span>
                            )}
                            {isOverdue && (
                                <span className="flex items-center gap-0.5 text-[10px] font-semibold text-red-400">
                                    <AlertCircle className="h-2.5 w-2.5" />
                                    Overdue
                                </span>
                            )}
                        </div>
                        {lead.assignee && (
                            <span className="flex items-center gap-0.5 text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                                <User className="h-2.5 w-2.5" />
                                {lead.assignee.displayName.split(' ')[0]}
                            </span>
                        )}
                    </div>
                </div>
            )}
        </Draggable>
    );
}
