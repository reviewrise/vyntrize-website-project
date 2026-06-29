'use client';

import { Droppable } from '@hello-pangea/dnd';
import { LeadCard } from './LeadCard';

interface Lead {
    id: string;
    title: string;
    stage: string;
    score: number;
    dealValue: string | null;
    closeDate: string | null;
    contact: { firstName: string; lastName: string };
    assignee: { displayName: string } | null;
}

interface KanbanColumnProps {
    stage: string;
    label: string;
    leads: Lead[];
    totalValue: number;
}

export function KanbanColumn({ stage, label, leads, totalValue }: KanbanColumnProps) {
    return (
        <div className="flex flex-col min-w-[220px] w-[220px]">
            {/* Column Header */}
            <div
                className="rounded-t-xl px-3 py-2.5 mb-0"
                style={{
                    backgroundColor: 'var(--color-surface)',
                    borderTop: '1px solid var(--color-border)',
                    borderLeft: '1px solid var(--color-border)',
                    borderRight: '1px solid var(--color-border)',
                }}
            >
                <div className="flex items-center justify-between mb-0.5">
                    <p className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
                        {label}
                    </p>
                    <span
                        className="text-[10px] font-bold rounded-full px-2 py-0.5"
                        style={{ backgroundColor: 'var(--color-raised)', color: 'var(--color-text-muted)' }}
                    >
                        {leads.length}
                    </span>
                </div>
                {totalValue > 0 && (
                    <p className="text-[10px] text-emerald-400 font-semibold">
                        ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                )}
            </div>

            {/* Droppable Area */}
            <Droppable droppableId={stage}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="flex-1 rounded-b-xl p-2 min-h-[200px]"
                        style={{
                            backgroundColor: snapshot.isDraggingOver ? 'var(--color-raised)' : 'var(--color-bg)',
                            border: '1px solid var(--color-border)',
                            borderTop: 'none',
                            transition: 'background-color 0.15s ease',
                        }}
                    >
                        {leads.map((lead, index) => (
                            <LeadCard key={lead.id} lead={lead} index={index} />
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
}
