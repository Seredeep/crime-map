// #region Imports
import clientPromise from '@/lib/config/db/mongodb'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { authOptions } from '../../auth/[...nextauth]/auth.config'

// #endregion

// #region Types
interface RegisterBody {
  token: string
  platform: 'android' | 'ios' | 'web'
}

interface UnregisterBody {
  token: string
}
// #endregion

// #region POST /api/notifications/register
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'No autenticado' }, { status: 401 })
  }

  let body: RegisterBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ message: 'JSON inválido' }, { status: 400 })
  }

  const { token, platform } = body
  if (!token || !platform || !['android', 'ios', 'web'].includes(platform)) {
    return NextResponse.json({ message: 'Parámetros inválidos' }, { status: 400 })
  }

  try {
    const client = await clientPromise
    const db = client.db()

    // Upsert token per user
    const now = new Date()
    await db.collection('device_tokens').updateOne(
      { token },
      {
        $set: {
          token,
          userId: new ObjectId(session.user.id),
          platform,
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true }
    )

    return NextResponse.json({ message: 'Token registrado' })
  } catch (err) {
    console.error('Error registrando token:', err)
    return NextResponse.json({ message: 'Error interno al registrar token' }, { status: 500 })
  }
}
// #endregion

// #region DELETE /api/notifications/register
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'No autenticado' }, { status: 401 })
  }

  let body: UnregisterBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ message: 'JSON inválido' }, { status: 400 })
  }

  const { token } = body
  if (!token) {
    return NextResponse.json({ message: 'Token requerido' }, { status: 400 })
  }

  try {
    const client = await clientPromise
    const db = client.db()

    await db.collection('device_tokens').deleteOne({ token, userId: new ObjectId(session.user.id) })

    return NextResponse.json({ message: 'Token eliminado' })
  } catch (err) {
    console.error('Error eliminando token:', err)
    return NextResponse.json({ message: 'Error interno al eliminar token' }, { status: 500 })
  }
}
// #endregion
