// API Route para gerenciar configuração de pixels de conversão
// Mantém IDs e tokens privados no servidor

import { NextRequest, NextResponse } from 'next/server';

// IDs dos pixels (privados - não expostos no cliente)
const META_PIXEL_ID = process.env.META_PIXEL_ID || '';
const TWITTER_PIXEL_ID = process.env.TWITTER_PIXEL_ID || '';
const GOOGLE_ADS_CONVERSION_ID = process.env.GOOGLE_ADS_CONVERSION_ID || '';
const TIKTOK_PIXEL_ID = process.env.TIKTOK_PIXEL_ID || '';

// Labels de conversão do Google Ads (privados)
const GOOGLE_ADS_CONVERSION_LABELS: Record<string, string> = {
  'login': process.env.GOOGLE_ADS_LOGIN_LABEL || '',
  'signup': process.env.GOOGLE_ADS_SIGNUP_LABEL || '',
  'create_project': process.env.GOOGLE_ADS_CREATE_PROJECT_LABEL || '',
  'export_image': process.env.GOOGLE_ADS_EXPORT_LABEL || '',
};

export async function GET(request: NextRequest) {
  try {
    // Retornar apenas os IDs necessários para inicialização no cliente
    // Não expor tokens sensíveis
    const config = {
      meta: META_PIXEL_ID ? { pixelId: META_PIXEL_ID } : null,
      twitter: TWITTER_PIXEL_ID ? { pixelId: TWITTER_PIXEL_ID } : null,
      google: GOOGLE_ADS_CONVERSION_ID ? { conversionId: GOOGLE_ADS_CONVERSION_ID } : null,
      tiktok: TIKTOK_PIXEL_ID ? { pixelId: TIKTOK_PIXEL_ID } : null,
    };

    return NextResponse.json(config, {
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Erro ao obter configuração de pixels:', error);
    return NextResponse.json({ error: 'Erro ao obter configuração' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, conversionLabel, value, currency } = body;

    // Retornar label de conversão do Google Ads se solicitado
    if (event && GOOGLE_ADS_CONVERSION_LABELS[event]) {
      return NextResponse.json({
        conversionId: GOOGLE_ADS_CONVERSION_ID,
        conversionLabel: GOOGLE_ADS_CONVERSION_LABELS[event],
      });
    }

    return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
  } catch (error) {
    console.error('Erro ao processar conversão:', error);
    return NextResponse.json({ error: 'Erro ao processar conversão' }, { status: 500 });
  }
}

