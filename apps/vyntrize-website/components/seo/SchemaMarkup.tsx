import React from 'react';

type SchemaType = 'LocalBusiness' | 'Service' | 'FAQPage' | 'Article' | 'Organization';

interface SchemaProps {
  type: SchemaType;
  data: any;
}

export default function SchemaMarkup({ type, data }: SchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': type,
    ...data,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
