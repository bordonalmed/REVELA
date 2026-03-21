import { NextRequest, NextResponse } from 'next/server';

// Rota stub para receber backups criptografados.
// A implementação real de armazenamento seguro deve ser feita no backend.

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // TODO: persistir payload de forma segura (ex.: storage criptografado por usuário)
    // Por enquanto, apenas aceitamos e respondemos 200 para completar o fluxo.
    if (!body?.ciphertext || !body?.iv || !body?.kdfSalt) {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('Erro na rota /api/secure-backup:', error);
    return NextResponse.json({ error: 'Erro ao processar backup' }, { status: 500 });
  }
}

