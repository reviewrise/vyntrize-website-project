import { NextRequest, NextResponse } from 'next/server';
import { eventBus, CRMEvent } from '@/lib/agents/event-bus';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        // Simple internal authentication using a shared secret or env var
        if (authHeader !== `Bearer ${process.env.INTERNAL_API_SECRET || 'vyntrize-internal-secret'}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { event, payload } = body;

        if (!event || !payload) {
            return NextResponse.json({ error: 'Missing event or payload' }, { status: 400 });
        }

        await eventBus.emitCRMEvent(event as CRMEvent, payload);
        
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Internal Webhook] Error processing event:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
