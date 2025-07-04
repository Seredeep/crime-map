/* ---------------------------------------------------------
 *  /api/device/alert
 *  Recibe { mac, location? } del ESP32-C3 y reenvía al
 *  endpoint original /api/panic creando un JWT temporal.
 * --------------------------------------------------------*/

import clientPromise from '@/lib/mongodb';
import { encode } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

/* ─────────────────────────────
 *  GET → ping de salud
 * ───────────────────────────── */
export async function GET() {
  return NextResponse.json({ ok: true, msg: 'device alert endpoint vivo' });
}

/* ─────────────────────────────
 *  POST → alerta desde el ESP
 * ───────────────────────────── */
export async function POST(req: NextRequest) {
  try {
    /* 0. Payload mínimo: { mac, location? } */
    const { mac, location } = await req.json();

    if (!mac) {
      return NextResponse.json(
        { success: false, message: 'MAC requerida' },
        { status: 400 },
      );
    }

    /* 1. Normalizar y buscar usuario dueño de la MAC */
    const normMac = mac.toString().trim().toLowerCase();
    const db      = (await clientPromise).db();

    // ajusta el campo si tu colección se llama deviceMacs o similar
    const user = await db.collection('users').findOne({ deviceMac: normMac });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Usuario no encontrado' },
        { status: 404 },
      );
    }

    /* 2. Fabricar JWT firmado con NEXTAUTH_SECRET */
    const jwt = await encode({
      secret: process.env.NEXTAUTH_SECRET!,
      token : {
        /* campos que tu tipo JWT marca como necesarios */
        id  : user._id.toString(),
        role: user.role ?? 'device',

        /* payload estándar de NextAuth */
        sub  : user._id.toString(),
        name : user.name  ?? '',
        email: user.email ?? '',
      },
    });

    /* 3. Nombre de la cookie según entorno */
    const cookieName =
      process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token';

    /* 4. Reenviar al endpoint /api/panic con la cookie puesta */
    const backendUrl =
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/panic/send`;

    const r = await fetch(backendUrl, {
      method : 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie        : `${cookieName}=${jwt}`,
      },
      body: JSON.stringify({
        timestamp: Date.now(),
        location : location ?? null,
      }),
    });

    const data = await r.json();
    return NextResponse.json(data, { status: r.status });

  } catch (err) {
    console.error('Error en /api/device/alert:', err);
    return NextResponse.json(
      { success: false, message: 'Error interno' },
      { status: 500 },
    );
  }
}
