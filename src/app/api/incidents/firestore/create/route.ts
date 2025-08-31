// #region Imports
import admin, { firestore } from '@/lib/config/db/firebase';
import { sendMessageToFirestore } from '@/lib/services/chat/firestoreChatService';
import { isValidIncidentTypeId } from '@/lib/services/incidents/utils';
import { NextRequest, NextResponse } from 'next/server';
// #endregion

// #region Types
interface CreateIncidentBody {
  type: string;
  description: string;
  neighborhood: string;
  chatId: string;
  location: { type: 'Point'; coordinates: [number, number] };
  tags?: string[];
  createdBy?: string;
  activeForMinutes?: number; // default 60
}
// #endregion

// #region Validation
function validateBody(body: any): { ok: true; data: CreateIncidentBody } | { ok: false; message: string } {
  if (!body || typeof body !== 'object') return { ok: false, message: 'Payload inválido' };

  const required = ['type', 'description', 'neighborhood', 'chatId', 'location'];
  for (const key of required) {
    if (!(key in body)) return { ok: false, message: `Falta el campo requerido: ${key}` };
  }

  if (!isValidIncidentTypeId(body.type)) return { ok: false, message: 'type inválido' };

  const loc = body.location;
  if (!loc || loc.type !== 'Point' || !Array.isArray(loc.coordinates) || loc.coordinates.length !== 2)
    return { ok: false, message: 'location inválida' };

  const [lng, lat] = loc.coordinates;
  if (typeof lng !== 'number' || typeof lat !== 'number') return { ok: false, message: 'coordinates inválidas' };

  const data: CreateIncidentBody = {
    type: String(body.type),
    description: String(body.description),
    neighborhood: String(body.neighborhood),
    chatId: String(body.chatId),
    location: { type: 'Point', coordinates: [lng, lat] },
    tags: Array.isArray(body.tags) ? body.tags.map(String) : undefined,
    createdBy: body.createdBy ? String(body.createdBy) : undefined,
    activeForMinutes: typeof body.activeForMinutes === 'number' ? body.activeForMinutes : 60,
  };

  return { ok: true, data };
}
// #endregion

// #region Handler
export async function POST(request: NextRequest) {
  try {
    // #region Request Processing
    const json = await request.json().catch(() => null);
    const validation = validateBody(json);
    if (!('ok' in validation) || validation.ok === false) {
      return NextResponse.json({ success: false, message: validation.message }, { status: 400 });
    }
    const body = validation.data;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + (body.activeForMinutes ?? 60) * 60_000);

    // #region Create Firestore Incident
    const incidentDocRef = firestore.collection('incidents').doc();
    const incidentId = incidentDocRef.id;

    const incidentData = {
      id: incidentId,
      type: body.type,
      description: body.description,
      neighborhood: body.neighborhood,
      chatId: body.chatId,
      location: body.location,
      status: 'active',
      activeUntil: admin.firestore.Timestamp.fromDate(expiresAt),
      createdAt: admin.firestore.Timestamp.fromDate(now),
      updatedAt: admin.firestore.Timestamp.fromDate(now),
      tags: body.tags ?? [],
      createdBy: body.createdBy ?? null,
    };

    await incidentDocRef.set(incidentData);
    // #endregion

    // #region Post system message in neighborhood chat
    const systemUserId = 'system';
    const systemUserName = 'Sistema';
    const message = `🚨 ${body.description} (expira en 1h)`;

    const metadata = {
      kind: 'incident',
      incidentId,
      event: 'created',
      activeUntil: admin.firestore.Timestamp.fromDate(expiresAt),
      incident: incidentData,
    };

    await sendMessageToFirestore(body.chatId, systemUserId, systemUserName, message, 'incident', metadata);
    // #endregion

    // #region Update chat activeIncidents array
    const activeIncidentEntry = {
      incidentId,
      type: body.type,
      description: body.description,
      expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
      createdAt: admin.firestore.Timestamp.fromDate(now),
    };

    await firestore.collection('chats').doc(body.chatId).update({
      activeIncidents: admin.firestore.FieldValue.arrayUnion(activeIncidentEntry),
      updatedAt: admin.firestore.Timestamp.fromDate(now),
    });
    // #endregion
    // #endregion

    // #region Response
    return NextResponse.json({ success: true, incidentId, expiresAt: expiresAt.toISOString() });
    // #endregion
  } catch (error: any) {
    console.error('Error creating incident in Firestore:', error);
    return NextResponse.json({ success: false, message: error?.message || 'Internal error' }, { status: 500 });
  }
}
// #endregion
