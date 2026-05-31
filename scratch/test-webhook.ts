import crypto from 'crypto';

const webhookUrl = 'http://localhost:3014/api/webhooks/vyntrise-booking';
const secret = 'test-secret'; // Assuming we'll use this for local testing

const payload = {
  "event": "booking.created",
  "sentAt": "2026-05-30T18:53:42.340Z",
  "organization": {
    "id": "4e550582-e07e-4be9-b733-b325a90417a3",
    "name": "Vyntrise Workspace"
  },
  "bookingFlow": {
    "version": 1,
    "slotDurationMinutes": 20,
    "minGapMinutes": 0,
    "steps": [
      {
        "id": "organization_name",
        "question": "What is the name of your organization?",
        "inputType": "text"
      },
      {
        "id": "service_selection",
        "question": "Which service are you interested in?",
        "inputType": "options"
      },
      {
        "id": "preferred_date_time",
        "question": "When would you like to schedule a consultation?",
        "inputType": "datetime"
      },
      {
        "id": "contact_email",
        "question": "What is your contact email?",
        "inputType": "text"
      },
      {
        "id": "additional_notes",
        "question": "Any additional notes or specific requirements?",
        "inputType": "text"
      }
    ]
  },
  "appointment": {
    "id": "00000000-0000-4000-8000-000000000001",
    "customerName": "Jane Doe",
    "customerEmail": "Any special requests noted here",
    "startTime": "2026-06-01T19:30:00.000Z",
    "endTime": "2026-06-01T19:50:00.000Z",
    "status": "requested",
    "source": "chatbot_embed",
    "serviceDescription": "AI Search & Reputation",
    "partySize": null,
    "bookingFlowQa": [
      {
        "stepId": "organization_name",
        "question": "What is the name of your organization?",
        "answer": "Acme Corp Webhook Test"
      },
      {
        "stepId": "service_selection",
        "question": "Which service are you interested in?",
        "answer": "AI Search & Reputation"
      },
      {
        "stepId": "preferred_date_time",
        "question": "When would you like to schedule a consultation?",
        "answer": "Sun, Jun 1, 7:30 PM"
      },
      {
        "stepId": "contact_email",
        "question": "What is your contact email?",
        "answer": "jane.webhook@example.com"
      },
      {
        "stepId": "additional_notes",
        "question": "Any additional notes or specific requirements?",
        "answer": "Looking forward to it."
      }
    ],
    "rawMessage": "Completed guided booking flow"
  }
};

const rawBody = JSON.stringify(payload);

const signature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

async function test() {
    console.log(`Sending payload to ${webhookUrl}...`);
    try {
        const res = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-VyntRise-Event': 'booking.created',
                'X-VyntRise-Signature': `sha256=${signature}`
            },
            body: rawBody
        });
        
        const text = await res.text();
        console.log(`Status: ${res.status}`);
        console.log(`Response: ${text}`);
    } catch (e) {
        console.error('Error:', e);
    }
}

test();
