'use client';

import Head from 'next/head';

interface SEOHeadProps {
  title?: string;
  description?: string;
  noindex?: boolean;
  canonical?: string;
}

export function SEOHead({ title, description, noindex = false, canonical }: SEOHeadProps) {
  return (
    <Head>
      {title && <title>{title}</title>}
      {description && <meta name="description" content={description} />}
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {canonical && <link rel="canonical" href={canonical} />}
    </Head>
  );
}

