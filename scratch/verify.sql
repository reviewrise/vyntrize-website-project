SELECT
  n.id,
  n.note,
  n."userId"
FROM lead_notes n
JOIN crm_leads l ON n."leadId" = l.id
JOIN crm_contacts c ON l."contactId" = c.id
WHERE c.email = 'jane.webhook@example.com';
