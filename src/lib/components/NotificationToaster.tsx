// #region Imports
'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiBell, FiAlertTriangle, FiCheckCircle, FiInfo, FiX } from 'react-icons/fi'
import { useNotificationsStore } from '../contexts/notificationsStore'

// #endregion

// #region Component
export default function NotificationToaster() {
  const notifications = useNotificationsStore((s) => s.notifications)
  const remove = useNotificationsStore((s) => s.remove)

  useEffect(() => {
    // Auto hide timers
    const timers = notifications.map((n) => {
      if (!n.autoHideMs) return null
      const remain = Math.max(1000, n.autoHideMs - (Date.now() - n.createdAt))
      return setTimeout(() => remove(n.id), remain)
    })
    return () => {
      timers.forEach((t) => t && clearTimeout(t))
    }
  }, [notifications, remove])

  const colorFor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-700 border-green-500'
      case 'warning':
        return 'bg-yellow-700 border-yellow-500'
      case 'error':
        return 'bg-red-700 border-red-500'
      case 'panic':
        return 'bg-red-800 border-red-600'
      case 'chat':
        return 'bg-blue-700 border-blue-500'
      default:
        return 'bg-gray-700 border-gray-600'
    }
  }

  const iconFor = (type: string) => {
    switch (type) {
      case 'success':
        return <FiCheckCircle className="w-5 h-5" />
      case 'warning':
        return <FiAlertTriangle className="w-5 h-5" />
      case 'error':
        return <FiAlertTriangle className="w-5 h-5" />
      case 'panic':
        return <FiAlertTriangle className="w-5 h-5" />
      case 'chat':
        return <FiBell className="w-5 h-5" />
      default:
        return <FiInfo className="w-5 h-5" />
    }
  }

  return (
    <div className="fixed z-[1000] top-4 left-1/2 -translate-x-1/2 w-full max-w-sm px-2 pointer-events-none">
      <AnimatePresence>
        {notifications.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
            className={`pointer-events-auto mb-2 rounded-lg border shadow-lg text-white ${colorFor(n.type)}`}
          >
            <div className="flex items-start p-3">
              <div className="mt-0.5 mr-2 opacity-90">{iconFor(n.type)}</div>
              <div className="flex-1 min-w-0">
                {n.title && <div className="text-sm font-semibold leading-tight">{n.title}</div>}
                <div className="text-sm leading-snug opacity-90 truncate">{n.message}</div>
              </div>
              <button
                aria-label="Close notification"
                className="ml-2 p-1 rounded hover:bg-white/10"
                onClick={() => remove(n.id)}
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
// #endregion
