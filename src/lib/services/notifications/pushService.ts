// #region Imports
import admin from '@/lib/config/db/firebase'
import clientPromise from '@/lib/config/db/mongodb'
import { ObjectId } from 'mongodb'

// #endregion

// #region Types
export interface PushPayload {
  title: string
  body: string
  data?: Record<string, string>
  android?: {
    priority?: 'normal' | 'high'
    channelId?: string
  }
}

// #endregion

// #region Helpers
async function getTokensForUsers(userIds: string[]): Promise<string[]> {
  const client = await clientPromise
  const db = client.db()
  const tokens = await db
    .collection('device_tokens')
    .find({ userId: { $in: userIds.map((id) => new ObjectId(id)) } })
    .project<{ token: string }>({ token: 1, _id: 0 })
    .toArray()
  return tokens.map((t) => t.token)
}

async function filterUsersWithNotificationsEnabled(userIds: string[]): Promise<string[]> {
  const client = await clientPromise
  const db = client.db()
  const users = await db
    .collection('users')
    .find({ _id: { $in: userIds.map((id) => new ObjectId(id)) }, notificationsEnabled: true })
    .project<{ _id: ObjectId }>({ _id: 1 })
    .toArray()
  return users.map((u) => u._id.toString())
}
// #endregion

// #region Main
export async function sendPushToUsers(userIds: string[], payload: PushPayload) {
  if (!userIds?.length) return { success: true, sent: 0 }

  const allowedUsers = await filterUsersWithNotificationsEnabled(userIds)
  if (!allowedUsers.length) return { success: true, sent: 0 }

  const tokens = await getTokensForUsers(allowedUsers)
  if (!tokens.length) return { success: true, sent: 0 }

  const message: admin.messaging.MulticastMessage = {
    tokens,
    notification: {
      title: payload.title,
      body: payload.body,
    },
    data: Object.fromEntries(Object.entries(payload.data || {}).map(([k, v]) => [k, String(v)])),
    android: {
      priority: payload.android?.priority === 'high' ? 'high' : 'normal',
      notification: {
        channelId: payload.android?.channelId || 'default',
      },
    },
  }

  const res = await admin.messaging().sendEachForMulticast(message)
  return { success: true, sent: res.successCount, failed: res.failureCount }
}
// #endregion
