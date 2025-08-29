// Safe bootstrap for Capacitor Push Notifications listeners
// Sets up foreground and action listeners on native platforms.

'use client'

import { Capacitor } from '@capacitor/core'

export async function initializePushNotificationsBootstrap() {
  if (typeof window === 'undefined') return
  if (!Capacitor.isNativePlatform()) return

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications')

    // Ensure listeners are not duplicated (best-effort)
    try {
      // @ts-ignore optional API in v7
      if (PushNotifications.removeAllListeners) {
        await PushNotifications.removeAllListeners()
      }
    } catch {}

    PushNotifications.addListener('pushNotificationReceived', (notification: any) => {
      console.log('Push received (foreground):', notification)
    })

    PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (action: any) => {
        console.log('Push action performed:', action)
        // TODO: route to screen based on action.notification.data
      }
    )
  } catch (e) {
    console.warn('PushNotifications plugin not available for bootstrap:', e)
  }
}
