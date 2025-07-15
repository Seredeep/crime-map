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
export async function POST(req: NextRequest) {
  try {
    const { mac, location, email } = await req.json();

    if (!mac) {
      return NextResponse.json(
        { success: false, message: 'MAC requerida' },
        { status: 400 },
      );
    }

    const normMac = mac.toString().trim().toLowerCase();
    const db      = (await clientPromise).db();
    const users   = db.collection('users');

    // 1. Buscar usuario con esa MAC
    let user = await users.findOne({ deviceMac: normMac });

    // 2. Si no está asociado, buscar por email y asociar
    if (!user && email) {
      const normEmail = email.toString().trim().toLowerCase();
      const userByEmail = await users.findOne({ email: normEmail });

      if (userByEmail) {
        await users.updateOne(
          { _id: userByEmail._id },
          { $set: { deviceMac: normMac } }
        );
        user = { ...userByEmail, deviceMac: normMac }; // actualizamos el objeto local
      }
    }

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Usuario no encontrado' },
        { status: 404 },
      );
    }

    // 3. Fabricar JWT
    const jwt = await encode({
      secret: process.env.NEXTAUTH_SECRET!,
      token : {
        id  : user._id.toString(),
        role: user.role ?? 'device',
        sub : user._id.toString(),
        name: user.name ?? '',
        email: user.email ?? '',
      },
    });

    const cookieName =
      process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token';

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
