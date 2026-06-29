import 'dotenv/config';
import { prisma } from '../lib/prisma';
import { emitSmsReplied } from '../lib/agents/event-emitter';
import { initializeAgentSystem } from '../lib/agents/init';

async function main() {
    console.log('🚀 Initializing Agent System...');
    await initializeAgentSystem();

    // 1. Find a test lead to simulate the interaction with
    console.log('\n🔍 Finding a test lead...');
    const lead = await prisma.lead.findFirst({
        where: { stage: { not: 'WON' } },
        include: { contact: true }
    });

    if (!lead) {
        console.error('❌ No active leads found in the database. Please create one first.');
        process.exit(1);
    }

    console.log(`✅ Found Lead: ${lead.contact.firstName} ${lead.contact.lastName} (${lead.stage})`);

    // 2. Simulate the inbound SMS event
    const simulatedMessage = "Hey, what are your pricing options? I might be interested in a meeting.";
    
    console.log(`\n📨 Simulating Inbound SMS: "${simulatedMessage}"`);
    console.log(`   Phone Number: ${lead.contact.phone || 'Unknown'}`);
    
    // We emit the exact same event the webhook emits
    await emitSmsReplied(lead.id, {
        contactId: lead.contact.id,
        message: simulatedMessage,
        fromPhone: lead.contact.phone || '+1234567890'
    });

    // 3. Simulate an inbound Email event as well
    const simulatedEmail = "I received your proposal and would love to move forward. Can we chat tomorrow?";
    console.log(`\n📧 Simulating Inbound Email: "${simulatedEmail}"`);
    console.log(`   Email Address: ${lead.contact.email || 'Unknown'}`);
    
    // Using the raw eventBus since we didn't export emitEmailReplied in event-emitter
    const { eventBus, CRMEvent } = await import('../lib/agents/event-bus');
    await eventBus.emitCRMEvent(CRMEvent.EMAIL_REPLIED, {
        leadId: lead.id,
        metadata: {
            contactId: lead.contact.id,
            subject: "Re: Following up",
            text: simulatedEmail,
            fromEmail: lead.contact.email || 'test@example.com'
        }
    });

    console.log(`\n⏳ Events Emitted! The ConversationalAgent should now process both SMS and Email replies.`);
    console.log(`Check your terminal output for the Agent logs (it may take a few seconds for the LLM to generate the replies).`);
    console.log(`\nYou can also check the Lead Notes in the UI for Lead ID: ${lead.id}`);

    // Wait for the agent to finish before exiting (crude but works for testing)
    setTimeout(() => {
        console.log('\n✅ Test script finished.');
        process.exit(0);
    }, 12000);
}

main().catch(console.error);
