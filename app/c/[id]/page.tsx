import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SharedCaseView, type SharedCaseData } from './shared-case-view';

export const dynamic = 'force-dynamic';

async function fetchSharedCase(id: string): Promise<SharedCaseData | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  try {
    const res = await fetch(
      `${url}/rest/v1/revela_shared_cases?id=eq.${encodeURIComponent(id)}&active=eq.true&select=before_image_url,after_image_url,watermark_enabled,watermark_logo_url`,
      {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        cache: 'no-store',
      }
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as SharedCaseData[];
    return rows?.[0] || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const data = await fetchSharedCase(params.id);

  if (!data) {
    return { title: 'Link não encontrado | Revela' };
  }

  return {
    title: 'Antes e Depois | Revela',
    description: 'Veja o resultado deste caso, compartilhado via Revela.',
    openGraph: {
      title: 'Antes e Depois',
      description: 'Resultado compartilhado via Revela.',
      images: [{ url: data.after_image_url }],
    },
    twitter: {
      card: 'summary_large_image',
      images: [data.after_image_url],
    },
    // Fotos de pacientes não devem ser indexadas pelo Google.
    robots: { index: false, follow: false },
  };
}

export default async function SharedCasePage({ params }: { params: { id: string } }) {
  const data = await fetchSharedCase(params.id);
  if (!data) notFound();
  return <SharedCaseView data={data} />;
}
