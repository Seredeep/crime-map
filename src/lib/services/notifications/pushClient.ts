// #region Imports
'use client'

import { Capacitor } from '@capacitor/core'

// #endregion

// #region Constants
const STORAGE_KEY = 'push_fcm_token'
// #endregion

// #region Types
export interface RegisterResult {
  ok: boolean
  token?: string
  reason?: string
}
// #endregion

// #region Helpers
function isNativeAndroid() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'
}

export function getStoredPushToken() {
  if (typeof window === 'undefined') return undefined
  return localStorage.getItem(STORAGE_KEY) || undefined
}

function storePushToken(token?: string) {
  if (typeof window === 'undefined') return
  if (token) localStorage.setItem(STORAGE_KEY, token)
}

function clearStoredPushToken() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
// #endregion

// #region API Calls
async function apiRegister(token: string, platform: 'android' | 'ios' | 'web') {
  await fetch('/api/notifications/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, platform }),
  })
}

async function apiUnregister(token: string) {
  await fetch('/api/notifications/register', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  })
}
// #endregion

// #region Public API
export async function ensurePushPermissionAndRegister(): Promise<RegisterResult> {
  if (!isNativeAndroid()) {
    return { ok: false, reason: 'not-native-android' }
  }

  // Dynamic import to avoid breaking web builds when plugin isn't installed
  let PushNotifications: any
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    PushNotifications = (await import('@capacitor/push-notifications')).PushNotifications
  } catch (e) {
    console.warn('Push plugin not available:', e)
    return { ok: false, reason: 'plugin-missing' }
  }

  // Check permission
  const permStatus = await PushNotifications.checkPermissions()
  if (permStatus.receive === 'denied') {
    const request = await PushNotifications.requestPermissions()
    if (request.receive !== 'granted') {
      return { ok: false, reason: 'permission-denied' }
    }
  }

  // Register and wait for token
  const token: string = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('registration-timeout')), 15000)

    const regHandler = (result: { value: { token: string } }) => {
      clearTimeout(timeout)
      cleanup()
      resolve(result?.value?.token)
    }
    const errHandler = (err: any) => {
      clearTimeout(timeout)
      cleanup()
      reject(err)
    }
    const cleanup = () => {
      try {
        PushNotifications.removeAllListeners && PushNotifications.removeAllListeners()
      } catch {}
    }

    try {
      PushNotifications.addListener('registration', regHandler)
      PushNotifications.addListener('registrationError', errHandler)
      PushNotifications.register()
    } catch (e) {
      clearTimeout(timeout)
      cleanup()
      reject(e)
    }
  })

  try {
    await apiRegister(token, 'android')
    storePushToken(token)
    return { ok: true, token }
  } catch (e) {
    console.error('Failed to register token on server:', e)
    return { ok: false, reason: 'server-register-failed' }
  }
}

export async function unregisterPushToken(): Promise<boolean> {
  const token = getStoredPushToken()
  if (!token) return true

  try {
    await apiUnregister(token)
    clearStoredPushToken()
    return true
  } catch (e) {
    console.error('Failed to unregister token on server:', e)
    return false
  }
}
// #endregion
