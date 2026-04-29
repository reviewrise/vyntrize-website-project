'use client';

import { useState } from 'react';
import { FileText, Phone, Mail, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { createActivity, editActivity, deleteActivity } from '@/lib/actions/activities';

interface Activity {
    id: string;
    type: string;
    body: string;
    originalBody: string | null;
    isEdited: boolean;
    duration: number | null;
    direction: string | null;
    createdAt: string;
    user: { displayName: string };
    leadId: string | null;
    contactId: string | null;
}

interface ActivityFeedProps {
    activities: Activity[];
    targetType: 'lead' | 'contact';
    targetId: string;
    currentUserId: string;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
    NOTE: <FileText className="h-3.5 w-3.5" />,
    CALL: <Phone className="h-3.5 w-3.5" />,
    EMAIL: <Mail className="h-3.5 w-3.5" />,
};

export function ActivityFeed({ activities, targetType, targetId, currentUserId }: ActivityFeedProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editBody, setEditBody] = useState('');
    const [showOriginal, setShowOriginal] = useState<string | null>(null);
    const [activityType, setActivityType] = useState<'NOTE' | 'CALL' | 'EMAIL'>('NOTE');

    const handleEdit = (activity: Activity) => {
        setEditingId(activity.id);
        setEditBody(activity.body);
    };

    const handleEditSubmit = async (id: string) => {
        const formData = new FormData();
        formData.set('id', id);
        formData.set('body', editBody);
        await editActivity(formData);
        setEditingId(null);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this activity? This cannot be undone.')) return;
        const formData = new FormData();
        formData.set('id', id);
        formData.set('confirmed', 'true');
        await deleteActivity(formData);
    };

    return (
        <div className="space-y-4">
            {/* Add Activity Form */}
            <div
                className="rounded-2xl p-6"
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
                <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
                    Log Activity
                </h2>
                <form action={async (formData: FormData) => { await createActivity(formData); }} className="space-y-3">
                    <input type="hidden" name={targetType === 'lead' ? 'leadId' : 'contactId'} value={targetId} />

                    <div className="flex gap-2">
                        {(['NOTE', 'CALL', 'EMAIL'] as const).map((t) => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setActivityType(t)}
                                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
                                style={{
                                    backgroundColor: activityType === t ? 'var(--color-primary)' : 'var(--color-raised)',
                                    color: activityType === t ? 'white' : 'var(--color-text-muted)',
                                    border: '1px solid var(--color-border)',
                                }}
                            >
                                {TYPE_ICONS[t]} {t}
                            </button>
                        ))}
                    </div>
                    <input type="hidden" name="type" value={activityType} />

                    <textarea
                        name="body"
                        rows={3}
                        required
                        placeholder={`Add a ${activityType.toLowerCase()}...`}
                        className="w-full rounded-lg px-3 py-2 text-sm resize-none"
                        style={{
                            backgroundColor: 'var(--color-raised)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-text)',
                        }}
                    />

                    {(activityType === 'CALL' || activityType === 'EMAIL') && (
                        <div className="flex gap-3">
                            <div>
                                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>
                                    Duration (min)
                                </label>
                                <input
                                    name="duration"
                                    type="number"
                                    min="0"
                                    className="w-24 rounded-lg px-3 py-1.5 text-sm"
                                    style={{
                                        backgroundColor: 'var(--color-raised)',
                                        border: '1px solid var(--color-border)',
                                        color: 'var(--color-text)',
                                    }}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>
                                    Direction
                                </label>
                                <select
                                    name="direction"
                                    className="rounded-lg px-3 py-1.5 text-sm"
                                    style={{
                                        backgroundColor: 'var(--color-raised)',
                                        border: '1px solid var(--color-border)',
                                        color: 'var(--color-text)',
                                    }}
                                >
                                    <option value="">—</option>
                                    <option value="INBOUND">Inbound</option>
                                    <option value="OUTBOUND">Outbound</option>
                                </select>
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
                        style={{ backgroundColor: 'var(--color-primary)' }}
                    >
                        Log Activity
                    </button>
                </form>
            </div>

            {/* Activity List */}
            <div
                className="rounded-2xl overflow-hidden"
                style={{ border: '1px solid var(--color-border)' }}
            >
                <div
                    className="px-5 py-4"
                    style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}
                >
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                        Activity ({activities.length})
                    </p>
                </div>

                {activities.length === 0 ? (
                    <div className="px-5 py-8 text-center" style={{ backgroundColor: 'var(--color-bg)' }}>
                        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No activities yet.</p>
                    </div>
                ) : (
                    <div style={{ backgroundColor: 'var(--color-bg)' }}>
                        {activities.map((activity, i) => (
                            <div
                                key={activity.id}
                                className="px-5 py-4"
                                style={{ borderBottom: i < activities.length - 1 ? '1px solid var(--color-border)' : 'none' }}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-2.5 flex-1">
                                        <span
                                            className="mt-0.5 flex-shrink-0"
                                            style={{ color: 'var(--color-text-muted)' }}
                                        >
                                            {TYPE_ICONS[activity.type]}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
                                                    {activity.user.displayName}
                                                </span>
                                                <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                                                    {new Date(activity.createdAt).toLocaleString()}
                                                </span>
                                                {activity.isEdited && (
                                                    <span className="text-[10px] italic" style={{ color: 'var(--color-text-muted)' }}>
                                                        edited
                                                    </span>
                                                )}
                                                {activity.duration && (
                                                    <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                                                        {activity.duration}min
                                                    </span>
                                                )}
                                                {activity.direction && (
                                                    <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                                                        {activity.direction.toLowerCase()}
                                                    </span>
                                                )}
                                            </div>

                                            {editingId === activity.id ? (
                                                <div className="space-y-2">
                                                    <textarea
                                                        value={editBody}
                                                        onChange={(e) => setEditBody(e.target.value)}
                                                        rows={3}
                                                        className="w-full rounded-lg px-3 py-2 text-sm resize-none"
                                                        style={{
                                                            backgroundColor: 'var(--color-raised)',
                                                            border: '1px solid var(--color-border)',
                                                            color: 'var(--color-text)',
                                                        }}
                                                    />
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleEditSubmit(activity.id)}
                                                            className="rounded-lg px-3 py-1 text-xs font-semibold text-white"
                                                            style={{ backgroundColor: 'var(--color-primary)' }}
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingId(null)}
                                                            className="rounded-lg px-3 py-1 text-xs font-semibold"
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
                                            ) : (
                                                <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--color-text)' }}>
                                                    {activity.body}
                                                </p>
                                            )}

                                            {activity.isEdited && activity.originalBody && (
                                                <button
                                                    onClick={() => setShowOriginal(showOriginal === activity.id ? null : activity.id)}
                                                    className="flex items-center gap-1 text-[10px] mt-1"
                                                    style={{ color: 'var(--color-text-muted)' }}
                                                >
                                                    {showOriginal === activity.id ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
                                                    {showOriginal === activity.id ? 'Hide original' : 'Show original'}
                                                </button>
                                            )}

                                            {showOriginal === activity.id && activity.originalBody && (
                                                <p
                                                    className="text-xs mt-1 p-2 rounded-lg italic"
                                                    style={{
                                                        backgroundColor: 'var(--color-raised)',
                                                        color: 'var(--color-text-muted)',
                                                    }}
                                                >
                                                    {activity.originalBody}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        <button
                                            onClick={() => handleEdit(activity)}
                                            className="p-1.5 rounded-lg hover:opacity-80"
                                            style={{ color: 'var(--color-text-muted)' }}
                                            title="Edit"
                                        >
                                            <Pencil className="h-3 w-3" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(activity.id)}
                                            className="p-1.5 rounded-lg hover:opacity-80 text-red-400"
                                            title="Delete"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
