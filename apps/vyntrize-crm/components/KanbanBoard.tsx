'use client';

import { useState, useCallback, useEffect } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { KanbanColumn } from './KanbanColumn';
import { updateLeadStage } from '@/lib/actions/leads';

const STAGES = [
    { id: 'NEW', label: 'New' },
    { id: 'CONTACTED', label: 'Contacted' },
    { id: 'QUALIFIED', label: 'Qualified' },
    { id: 'PROPOSAL_SENT', label: 'Proposal Sent' },
    { id: 'WON', label: 'Won' },
    { id: 'LOST', label: 'Lost' },
];

interface Lead {
    id: string;
    title: string;
    stage: string;
    dealValue: string | null;
    closeDate: string | null;
    contact: { firstName: string; lastName: string };
    assignee: { displayName: string } | null;
}

interface KanbanBoardProps {
    initialLeads: Lead[];
}

export function KanbanBoard({ initialLeads }: KanbanBoardProps) {
    const [leads, setLeads] = useState<Lead[]>(initialLeads);
    const [closingNoteModal, setClosingNoteModal] = useState<{
        leadId: string;
        targetStage: string;
    } | null>(null);
    const [closingNote, setClosingNote] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Keep internal state in sync with server changes (auto-refresh)
    useEffect(() => {
        setLeads(initialLeads);
    }, [initialLeads]);

    const getLeadsByStage = (stage: string) =>
        leads.filter((l) => l.stage === stage);

    const getTotalValue = (stage: string) =>
        leads
            .filter((l) => l.stage === stage && l.dealValue)
            .reduce((sum, l) => sum + parseFloat(l.dealValue!), 0);

    const handleDragEnd = useCallback(
        async (result: DropResult) => {
            const { draggableId, destination, source } = result;
            if (!destination || destination.droppableId === source.droppableId) return;

            const targetStage = destination.droppableId;

            if (targetStage === 'WON' || targetStage === 'LOST') {
                setClosingNoteModal({ leadId: draggableId, targetStage });
                return;
            }

            // Optimistic update
            setLeads((prev) =>
                prev.map((l) => (l.id === draggableId ? { ...l, stage: targetStage } : l))
            );

            const formData = new FormData();
            formData.set('id', draggableId);
            formData.set('stage', targetStage);
            const result2 = await updateLeadStage(formData);
            if (result2?.error) {
                setError(result2.error);
                // Revert
                setLeads((prev) =>
                    prev.map((l) => (l.id === draggableId ? { ...l, stage: source.droppableId } : l))
                );
            }
        },
        [leads]
    );

    const handleClosingNoteSubmit = async () => {
        if (!closingNoteModal) return;
        const { leadId, targetStage } = closingNoteModal;

        // Optimistic update
        setLeads((prev) =>
            prev.map((l) => (l.id === leadId ? { ...l, stage: targetStage } : l))
        );

        const formData = new FormData();
        formData.set('id', leadId);
        formData.set('stage', targetStage);
        formData.set('closingNote', closingNote);
        const result = await updateLeadStage(formData);

        if (result?.error) {
            setError(result.error);
            setLeads((prev) =>
                prev.map((l) => (l.id === leadId ? { ...l, stage: 'NEW' } : l))
            );
        }

        setClosingNoteModal(null);
        setClosingNote('');
    };

    return (
        <>
            {error && (
                <div className="mb-4 rounded-lg px-4 py-2 text-sm text-red-400 bg-red-900/20 border border-red-800">
                    {error}
                    <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
                </div>
            )}

            <DragDropContext onDragEnd={handleDragEnd}>
                <div className="flex gap-4 overflow-x-auto pb-4">
                    {STAGES.map((stage) => (
                        <KanbanColumn
                            key={stage.id}
                            stage={stage.id}
                            label={stage.label}
                            leads={getLeadsByStage(stage.id)}
                            totalValue={getTotalValue(stage.id)}
                        />
                    ))}
                </div>
            </DragDropContext>

            {/* Closing Note Modal */}
            {closingNoteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div
                        className="rounded-2xl p-6 w-full max-w-md"
                        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                    >
                        <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                            Moving to {closingNoteModal.targetStage}
                        </h3>
                        <p className="text-xs mb-4" style={{ color: 'var(--color-text-muted)' }}>
                            Please add a closing note before confirming.
                        </p>
                        <textarea
                            value={closingNote}
                            onChange={(e) => setClosingNote(e.target.value)}
                            rows={4}
                            placeholder="Add a closing note..."
                            className="w-full rounded-lg px-3 py-2 text-sm resize-none mb-4"
                            style={{
                                backgroundColor: 'var(--color-raised)',
                                border: '1px solid var(--color-border)',
                                color: 'var(--color-text)',
                            }}
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={handleClosingNoteSubmit}
                                disabled={!closingNote.trim()}
                                className="flex-1 rounded-lg py-2 text-sm font-semibold text-white disabled:opacity-50"
                                style={{ backgroundColor: 'var(--color-primary)' }}
                            >
                                Confirm
                            </button>
                            <button
                                onClick={() => { setClosingNoteModal(null); setClosingNote(''); }}
                                className="flex-1 rounded-lg py-2 text-sm font-semibold"
                                style={{
                                    backgroundColor: 'var(--color-raised)',
                                    border: '1px solid var(--color-border)',
                                    color: 'var(--color-text)',
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
