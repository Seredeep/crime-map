// #region Imports
import { create } from 'zustand'

// #endregion

// #region Types
export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'chat' | 'panic'

export interface AppNotification {
  id: string
  type: NotificationType
  title?: string
  message: string
  data?: Record<string, any>
  createdAt: number
  autoHideMs?: number
}

interface NotificationsState {
  notifications: AppNotification[]
  add: (n: Omit<AppNotification, 'id' | 'createdAt'> & { id?: string }) => string
  remove: (id: string) => void
  clear: () => void
}
// #endregion

// #region Helpers
const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
// #endregion

// #region Store
export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  add: (n) => {
    const id = n.id || genId()
    const createdAt = Date.now()
    const notif: AppNotification = {
      id,
      createdAt,
      autoHideMs: 4500,
      ...n,
    }
    set((s) => ({ notifications: [notif, ...s.notifications].slice(0, 20) }))
    return id
  },
  remove: (id) => set((s) => ({ notifications: s.notifications.filter((x) => x.id !== id) })),
  clear: () => set({ notifications: [] }),
}))
// #endregion
