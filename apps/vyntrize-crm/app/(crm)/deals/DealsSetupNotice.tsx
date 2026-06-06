import Link from 'next/link';
import { Info, ArrowRight } from 'lucide-react';

interface Props {
  contactCount: number;
  leadCount: number;
}

export function DealsSetupNotice({ contactCount, leadCount }: Props) {
  if (leadCount > 0) return null;

  const needsContact = contactCount === 0;

  const steps = needsContact
    ? [
        {
          step: '1',
          title: 'Add a contact',
          description: 'Save the person or company you are selling to.',
          href: '/contacts',
        },
        {
          step: '2',
          title: 'Create a lead on Pipeline',
          description: 'Link that contact to a sales opportunity.',
          href: '/pipeline',
        },
        {
          step: '3',
          title: 'Create a deal here',
          description: 'Track value, status, and invoices for that lead.',
        },
      ]
    : [
        {
          step: '1',
          title: 'Create a lead on Pipeline',
          description: `You have ${contactCount} contact${contactCount === 1 ? '' : 's'} — add a lead for the opportunity you want to track.`,
          href: '/pipeline',
        },
        {
          step: '2',
          title: 'Create a deal here',
          description: 'Every deal must be linked to a lead. You can also create deals from a lead’s detail page.',
        },
      ];

  return (
    <div
      style={{
        background: 'var(--color-primary-soft)',
        border: '1px solid color-mix(in srgb, var(--color-primary) 25%, transparent)',
        borderRadius: '0.75rem',
        padding: '1.125rem 1.25rem',
        marginBottom: '1.5rem',
      }}
    >
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
        <Info
          style={{
            width: 18,
            height: 18,
            color: 'var(--color-primary)',
            flexShrink: 0,
            marginTop: '0.125rem',
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 0.25rem' }}>
            Before you can create a deal
          </p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', margin: '0 0 1rem', lineHeight: 1.55 }}>
            Deals are always linked to a lead. Set up your contact and pipeline first, then return here to add the deal.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(12rem, 1fr))',
              gap: '0.625rem',
            }}
          >
            {steps.map((item) => (
              <div
                key={item.step}
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 0.875rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                  <span
                    style={{
                      width: '1.375rem',
                      height: '1.375rem',
                      borderRadius: '9999px',
                      background: 'var(--color-primary)',
                      color: '#fff',
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {item.step}
                  </span>
                  {item.href ? (
                    <Link
                      href={item.href}
                      style={{
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: 'var(--color-primary)',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      {item.title}
                      <ArrowRight style={{ width: 12, height: 12 }} />
                    </Link>
                  ) : (
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text)' }}>
                      {item.title}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
