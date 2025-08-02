'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { signOut, useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
    FiAlertTriangle,
    FiBell,
    FiCamera,
    FiCheckCircle,
    FiChevronLeft,
    FiChevronRight,
    FiClock,
    FiHelpCircle,
    FiLogOut,
    FiMapPin,
    FiSettings,
    FiShield,
    FiSmartphone,
    FiUser,
    FiUsers,
    FiXCircle,
    FiZap,
} from 'react-icons/fi'
import IncidentQueue from './IncidentQueue'

interface MobileSettingsViewProps {
  className?: string
}

const Toast = ({
  message,
  type,
  onHide,
}: {
  message: string
  type: 'success' | 'error'
  onHide: () => void
}) => {
  useEffect(() => {
    const timer = setTimeout(onHide, 5000)
    return () => clearTimeout(timer)
  }, [onHide])

  const Icon = type === 'success' ? FiCheckCircle : FiXCircle
  const bgColor = type === 'success' ? 'bg-green-700' : 'bg-red-700'
  const borderColor = type === 'success' ? 'border-green-500' : 'border-red-500'
  const shadowColor =
    type === 'success' ? 'shadow-green-500/50' : 'shadow-red-500/50'

  return createPortal(
    <div
      className={`fixed top-5 left-1/2 -translate-x-1/2 z-[1000] p-3 rounded-lg shadow-md border ${bgColor} ${borderColor} text-white font-medium flex items-center space-x-3
        transform opacity-100 scale-100 transition-all duration-300 ease-in-out`}
    >
      <Icon className={`w-6 h-6 ${shadowColor} drop-shadow-lg`} />
      <span>{message}</span>
    </div>,
    document.body
  )
}

const MobileSettingsView = ({ className = '' }: MobileSettingsViewProps) => {
  const { data: session, update } = useSession()
  const t = useTranslations('Profile')
  const configT = useTranslations('ConfigSections')
  const [activeSection, setActiveSection] = useState<'profile' | 'queue'>(
    'profile'
  )
  const [activeConfigSection, setActiveConfigSection] = useState<string | null>(
    null
  )

  // Settings state
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [privacyPublic, setPrivacyPublic] = useState(false)
  const [autoLocationEnabled, setAutoLocationEnabled] = useState(false)
  const [pushNotifications, setPushNotifications] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [vibrationEnabled, setVibrationEnabled] = useState(true)
  const [dataSharing, setDataSharing] = useState(false)
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true)
  const [darkMode, setDarkMode] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [highAccuracyLocation, setHighAccuracyLocation] = useState(false)
  const [backgroundLocation, setBackgroundLocation] = useState(false)

  // UI State
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error'
  } | null>(null)

  // Profile Image State
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null)
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(
    null
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Effect to sync state with session
  useEffect(() => {
    if (session?.user) {
      setNotificationsEnabled(session.user.notificationsEnabled ?? true)
      setPrivacyPublic(session.user.privacyPublic ?? false)
      setAutoLocationEnabled(session.user.autoLocationEnabled ?? true)
      setProfileImagePreview(session.user.profileImage || null)
      console.log(
        'Session user profileImage on mount/update:',
        session.user.profileImage
      )
    }
  }, [session])

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    console.log(`Toast activado: ${message} (Tipo: ${type})`)
  }

  const handleSettingChange = useCallback(
    async (
      newSettings: Partial<{
        notificationsEnabled: boolean
        privacyPublic: boolean
        autoLocationEnabled: boolean
      }>
    ) => {
      if (isSaving) {
        console.log('Attempt to save while already saving.')
        return
      }
      setIsSaving(true)
      console.log('Starting configuration save...')

      const fullSettings = {
        notificationsEnabled,
        privacyPublic,
        autoLocationEnabled,
        ...newSettings,
      }
      console.log('Configuration to send:', fullSettings)

      try {
        const response = await fetch('/api/user/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fullSettings),
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error(
            'Error en la respuesta de la API de configuración:',
            errorData
          )
          throw new Error(
            errorData.message || configT('couldNotSaveConfiguration')
          )
        }

        console.log('Configuration saved in API. Updating session...')
        await update(fullSettings)
        console.log('Session updated.')
        showToast(configT('configurationSaved'), 'success')
      } catch (error) {
        console.error('Error al guardar la configuración:', error)
        showToast(
          error instanceof Error ? error.message : configT('unknownError'),
          'error'
        )
        if (session?.user) {
          setNotificationsEnabled(session.user.notificationsEnabled ?? true)
          setPrivacyPublic(session.user.privacyPublic ?? false)
          setAutoLocationEnabled(session.user.autoLocationEnabled ?? true)
          console.log(
            'Estado de settings revertido a valores de sesión tras error.'
          )
        }
      } finally {
        setIsSaving(false)
        console.log('Configuration save attempt finished.')
      }
    },
    [
      isSaving,
      notificationsEnabled,
      privacyPublic,
      autoLocationEnabled,
      update,
      session,
    ]
  )

  const createToggleHandler =
    (
      setter: React.Dispatch<React.SetStateAction<boolean>>,
      key: 'notificationsEnabled' | 'privacyPublic' | 'autoLocationEnabled'
    ) =>
    () => {
      setter((prev) => {
        const newValue = !prev
        console.log(`Toggle ${key} cambiado a: ${newValue}`)
        handleSettingChange({ [key]: newValue })
        return newValue
      })
    }

  const toggleNotifications = createToggleHandler(
    setNotificationsEnabled,
    'notificationsEnabled'
  )
  const togglePrivacy = createToggleHandler(setPrivacyPublic, 'privacyPublic')

  const toggleAutoLocation = () => {
    const newValue = !autoLocationEnabled
    setAutoLocationEnabled(newValue)
    console.log(`Toggle autoLocation cambiado a: ${newValue}`)

    if (newValue) {
      if ('geolocation' in navigator) {
        console.log('Requesting geolocation permission...')
        navigator.geolocation.getCurrentPosition(
          () => {
            console.log('Location permission granted.')
            showToast(configT('locationActivated'), 'success')
            handleSettingChange({ autoLocationEnabled: true })
          },
          () => {
            console.log('Location permission denied.')
            showToast(configT('locationPermissionDenied'), 'error')
            setAutoLocationEnabled(false)
            handleSettingChange({ autoLocationEnabled: false })
          }
        )
      } else {
        console.log('Geolocation not supported.')
        showToast(configT('geolocationNotSupported'), 'error')
        setAutoLocationEnabled(false)
      }
    } else {
      handleSettingChange({ autoLocationEnabled: false })
    }
  }

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      console.log('Archivo de imagen seleccionado:', file.name)
      setProfileImageFile(file)
      const previewUrl = URL.createObjectURL(file)
      setProfileImagePreview(previewUrl)
      console.log('Generated image preview URL (blob):', previewUrl)
    } else {
      console.log('No image file selected.')
      setProfileImageFile(null)
      setProfileImagePreview(session?.user?.profileImage || null)
    }
  }

  useEffect(() => {
    return () => {
      if (profileImagePreview && profileImagePreview.startsWith('blob:')) {
        console.log('Revocando URL del objeto blob:', profileImagePreview)
        URL.revokeObjectURL(profileImagePreview)
      }
    }
  }, [profileImagePreview])

  const handleImageUpload = async () => {
    if (!profileImageFile) {
      console.log('No hay archivo de imagen para subir.')
      return
    }
    setIsSaving(true)
    console.log('Iniciando subida de imagen...')

    const formData = new FormData()
    formData.append('profileImage', profileImageFile)
    console.log('FormData creado.')

    try {
      const response = await fetch('/api/user/upload-profile-image', {
        method: 'POST',
        body: formData,
      })
      console.log(
        'Respuesta de la API de carga de imagen:',
        response.status,
        response.statusText
      )

      if (!response.ok) {
        const errorData = await response.json()
        console.error(
          'Error en la respuesta de la API de carga de imagen:',
          errorData
        )
        throw new Error(errorData.message || configT('couldNotUploadImage'))
      }

      const result = await response.json()
      console.log('Image uploaded successfully. Result:', result)
      showToast(configT('imageUpdated'), 'success')
      console.log(
        'Actualizando sesión con nueva URL de imagen:',
        result.profileImageUrl
      )
      await update({ profileImage: result.profileImageUrl })
      console.log(
        'Sesión actualizada con nueva URL de imagen.',
        session?.user?.profileImage
      )
      setProfileImageFile(null)
    } catch (error) {
      console.error('Error al subir la imagen:', error)
      showToast(
        error instanceof Error ? error.message : configT('unknownError'),
        'error'
      )
      setProfileImagePreview(session?.user?.profileImage || null)
      console.log('Image preview state reverted after error.')
    } finally {
      setIsSaving(false)
      console.log('Finalizado el intento de subida de imagen.')
    }
  }

  const isAdmin = session?.user?.role === 'admin'
  const isEditor = session?.user?.role === 'editor'
  const canManageIncidents = isAdmin || isEditor

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin':
        return t('administrator')
      case 'editor':
        return t('editor')
      case 'user':
        return t('user')
      default:
        return t('user')
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'editor':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'user':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const configSections = [
    {
      id: 'profile',
      title: configT('profile'),
      icon: FiUser,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      description: configT('profileDescription'),
      available: true,
    },
    {
      id: 'notifications',
      title: configT('notifications'),
      icon: FiBell,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
      description: configT('notificationsDescription'),
      available: false,
    },
    {
      id: 'privacy',
      title: configT('privacy'),
      icon: FiShield,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      description: configT('privacyDescription'),
      available: false,
    },
    {
      id: 'location',
      title: configT('location'),
      icon: FiMapPin,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
      description: configT('locationDescription'),
      available: false,
    },
    {
      id: 'device',
      title: configT('device'),
      icon: FiSmartphone,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/20',
      description: configT('deviceDescription'),
      available: false,
    },
    {
      id: 'permissions',
      title: configT('permissions'),
      icon: FiZap,
      color: 'text-red-400',
      bgColor: 'bg-red-500/20',
      description: configT('permissionsDescription'),
      available: false,
    },
    {
      id: 'app',
      title: configT('app'),
      icon: FiSettings,
      color: 'text-gray-400',
      bgColor: 'bg-gray-500/20',
      description: configT('appDescription'),
      available: false,
    },
    {
      id: 'support',
      title: configT('support'),
      icon: FiHelpCircle,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/20',
      description: configT('supportDescription'),
      available: false,
    },
  ]

  const renderConfigSection = (sectionId: string) => {
    switch (sectionId) {
      case 'profile':
        return (
          <div className="space-y-4">
            {/* Información Personal */}
            <div className="bg-gray-700/40 rounded-lg p-4 border border-gray-600/20">
              <h4 className="text-white font-medium mb-3 flex items-center">
                <FiUser className="w-4 h-4 mr-2 text-blue-400" />
                Personal Information
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Name</span>
                  <span className="text-white font-medium">
                    {session?.user?.name || 'Not set'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Email</span>
                  <span className="text-white font-medium">
                    {session?.user?.email}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Role</span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoleColor(
                      session?.user?.role || 'user'
                    )}`}
                  >
                    {getRoleName(session?.user?.role || 'user')}
                  </span>
                </div>
              </div>
            </div>

            {/* Información de Ubicación */}
            <div className="bg-gray-700/40 rounded-lg p-4 border border-gray-600/20">
              <h4 className="text-white font-medium mb-3 flex items-center">
                <FiMapPin className="w-4 h-4 mr-2 text-purple-400" />
                Location
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Neighborhood</span>
                  <span className="text-white font-medium flex items-center">
                    <FiMapPin className="w-4 h-4 mr-1 text-purple-400" />
                    {session?.user?.neighborhood || 'Not assigned'}
                  </span>
                </div>
                {session?.user?.createdAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Member since</span>
                    <span className="text-white font-medium">
                      {new Date(session.user.createdAt).toLocaleDateString(
                        'en-US',
                        {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        }
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Avatar */}
            <div className="bg-gray-700/40 rounded-lg p-4 border border-gray-600/20">
              <h4 className="text-white font-medium mb-3 flex items-center">
                <FiCamera className="w-4 h-4 mr-2 text-green-400" />
                Profile Picture
              </h4>
              <div className="flex items-center space-x-4">
                <motion.div
                  className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center relative group overflow-hidden cursor-pointer shadow-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {profileImagePreview ? (
                    <Image
                      src={profileImagePreview}
                      alt="Avatar"
                      width={80}
                      height={80}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <FiUser className="w-10 h-10 text-white" />
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <FiCamera className="w-5 h-5 text-white" />
                  </div>
                </motion.div>
                <div className="flex-1">
                  <p className="text-gray-300 text-sm mb-2">
                    Tap to change photo
                  </p>
                  {profileImageFile && (
                    <motion.button
                      onClick={handleImageUpload}
                      disabled={isSaving}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isSaving ? 'Uploading...' : 'Save'}
                    </motion.button>
                  )}
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
          </div>
        )

      case 'notifications':
        return (
          <div className="space-y-4">
            <div className="bg-gray-700/30 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3">
                {configT('notificationTypes')}
              </h4>
              <div className="space-y-3">
                <button
                  onClick={() => setPushNotifications(!pushNotifications)}
                  className="w-full flex items-center justify-between p-3 bg-gray-600/30 hover:bg-gray-600/50 rounded-lg transition-colors"
                >
                  <span className="text-gray-300">
                    {configT('pushNotifications')}
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full ${
                      pushNotifications ? 'bg-blue-500' : 'bg-gray-600'
                    }`}
                  ></div>
                </button>
                <button
                  onClick={() => setEmailNotifications(!emailNotifications)}
                  className="w-full flex items-center justify-between p-3 bg-gray-600/30 hover:bg-gray-600/50 rounded-lg transition-colors"
                >
                  <span className="text-gray-300">
                    {configT('emailNotifications')}
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full ${
                      emailNotifications ? 'bg-blue-500' : 'bg-gray-600'
                    }`}
                  ></div>
                </button>
                <button
                  onClick={toggleNotifications}
                  disabled={isSaving}
                  className="w-full flex items-center justify-between p-3 bg-gray-600/30 hover:bg-gray-600/50 rounded-lg transition-colors disabled:opacity-50"
                >
                  <span className="text-gray-300">
                    {configT('generalNotifications')}
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full ${
                      notificationsEnabled ? 'bg-blue-500' : 'bg-gray-600'
                    }`}
                  ></div>
                </button>
              </div>
            </div>
            <div className="bg-gray-700/30 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3">
                {configT('soundSettings')}
              </h4>
              <div className="space-y-3">
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="w-full flex items-center justify-between p-3 bg-gray-600/30 hover:bg-gray-600/50 rounded-lg transition-colors"
                >
                  <span className="text-gray-300">{configT('sound')}</span>
                  <div
                    className={`w-5 h-5 rounded-full ${
                      soundEnabled ? 'bg-blue-500' : 'bg-gray-600'
                    }`}
                  ></div>
                </button>
                <button
                  onClick={() => setVibrationEnabled(!vibrationEnabled)}
                  className="w-full flex items-center justify-between p-3 bg-gray-600/30 hover:bg-gray-600/50 rounded-lg transition-colors"
                >
                  <span className="text-gray-300">{configT('vibration')}</span>
                  <div
                    className={`w-5 h-5 rounded-full ${
                      vibrationEnabled ? 'bg-blue-500' : 'bg-gray-600'
                    }`}
                  ></div>
                </button>
              </div>
            </div>
          </div>
        )

      case 'privacy':
        return (
          <div className="space-y-4">
            <div className="bg-gray-700/30 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3">
                {configT('profileVisibility')}
              </h4>
              <div className="space-y-3">
                <button
                  onClick={togglePrivacy}
                  disabled={isSaving}
                  className="w-full flex items-center justify-between p-3 bg-gray-600/30 hover:bg-gray-600/50 rounded-lg transition-colors disabled:opacity-50"
                >
                  <span className="text-gray-300">
                    {configT('publicProfile')}
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full ${
                      privacyPublic ? 'bg-blue-500' : 'bg-gray-600'
                    }`}
                  ></div>
                </button>
              </div>
            </div>
            <div className="bg-gray-700/30 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3">
                {configT('dataAndAnalytics')}
              </h4>
              <div className="space-y-3">
                <button
                  onClick={() => setDataSharing(!dataSharing)}
                  className="w-full flex items-center justify-between p-3 bg-gray-600/30 hover:bg-gray-600/50 rounded-lg transition-colors"
                >
                  <span className="text-gray-300">{configT('shareData')}</span>
                  <div
                    className={`w-5 h-5 rounded-full ${
                      dataSharing ? 'bg-blue-500' : 'bg-gray-600'
                    }`}
                  ></div>
                </button>
                <button
                  onClick={() => setAnalyticsEnabled(!analyticsEnabled)}
                  className="w-full flex items-center justify-between p-3 bg-gray-600/30 hover:bg-gray-600/50 rounded-lg transition-colors"
                >
                  <span className="text-gray-300">{configT('analytics')}</span>
                  <div
                    className={`w-5 h-5 rounded-full ${
                      analyticsEnabled ? 'bg-blue-500' : 'bg-gray-600'
                    }`}
                  ></div>
                </button>
              </div>
            </div>
          </div>
        )

      case 'location':
        return (
          <div className="space-y-4">
            <div className="bg-gray-700/30 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3">
                {configT('locationSettings')}
              </h4>
              <div className="space-y-3">
                <button
                  onClick={toggleAutoLocation}
                  disabled={isSaving}
                  className="w-full flex items-center justify-between p-3 bg-gray-600/30 hover:bg-gray-600/50 rounded-lg transition-colors disabled:opacity-50"
                >
                  <span className="text-gray-300">
                    {configT('autoLocation')}
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full ${
                      autoLocationEnabled ? 'bg-blue-500' : 'bg-gray-600'
                    }`}
                  ></div>
                </button>
                <button
                  onClick={() => setHighAccuracyLocation(!highAccuracyLocation)}
                  className="w-full flex items-center justify-between p-3 bg-gray-600/30 hover:bg-gray-600/50 rounded-lg transition-colors"
                >
                  <span className="text-gray-300">
                    {configT('highAccuracy')}
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full ${
                      highAccuracyLocation ? 'bg-blue-500' : 'bg-gray-600'
                    }`}
                  ></div>
                </button>
                <button
                  onClick={() => setBackgroundLocation(!backgroundLocation)}
                  className="w-full flex items-center justify-between p-3 bg-gray-600/30 hover:bg-gray-600/50 rounded-lg transition-colors"
                >
                  <span className="text-gray-300">
                    {configT('backgroundLocation')}
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full ${
                      backgroundLocation ? 'bg-blue-500' : 'bg-gray-600'
                    }`}
                  ></div>
                </button>
              </div>
            </div>
          </div>
        )

      case 'device':
        return (
          <div className="space-y-4">
            <div className="bg-gray-700/30 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3">
                {configT('hardware')}
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-600/30 rounded-lg">
                  <span className="text-gray-300">{configT('sensors')}</span>
                  <span className="text-green-400 text-sm">
                    {configT('available')}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-600/30 rounded-lg">
                  <span className="text-gray-300">{configT('camera')}</span>
                  <span className="text-green-400 text-sm">
                    {configT('available')}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-600/30 rounded-lg">
                  <span className="text-gray-300">{configT('microphone')}</span>
                  <span className="text-green-400 text-sm">
                    {configT('available')}
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-gray-700/30 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3">
                {configT('advancedSettings')}
              </h4>
              <p className="text-gray-400 text-sm">
                {configT('hardwareTeamDevelopment')}
              </p>
            </div>
          </div>
        )

      case 'permissions':
        return (
          <div className="space-y-4">
            <div className="bg-gray-700/30 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3">
                {configT('appPermissions')}
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-600/30 rounded-lg">
                  <span className="text-gray-300">{configT('location')}</span>
                  <span className="text-green-400 text-sm">
                    {configT('granted')}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-600/30 rounded-lg">
                  <span className="text-gray-300">{configT('camera')}</span>
                  <span className="text-green-400 text-sm">
                    {configT('granted')}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-600/30 rounded-lg">
                  <span className="text-gray-300">
                    {configT('notifications')}
                  </span>
                  <span className="text-green-400 text-sm">
                    {configT('granted')}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-600/30 rounded-lg">
                  <span className="text-gray-300">{configT('storage')}</span>
                  <span className="text-yellow-400 text-sm">
                    {configT('pending')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )

      case 'app':
        return (
          <div className="space-y-4">
            <div className="bg-gray-700/30 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3">
                {configT('appearance')}
              </h4>
              <div className="space-y-3">
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="w-full flex items-center justify-between p-3 bg-gray-600/30 hover:bg-gray-600/50 rounded-lg transition-colors"
                >
                  <span className="text-gray-300">{configT('darkMode')}</span>
                  <div
                    className={`w-5 h-5 rounded-full ${
                      darkMode ? 'bg-blue-500' : 'bg-gray-600'
                    }`}
                  ></div>
                </button>
              </div>
            </div>
            <div className="bg-gray-700/30 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3">
                {configT('performance')}
              </h4>
              <div className="space-y-3">
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className="w-full flex items-center justify-between p-3 bg-gray-600/30 hover:bg-gray-600/50 rounded-lg transition-colors"
                >
                  <span className="text-gray-300">
                    {configT('autoRefresh')}
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full ${
                      autoRefresh ? 'bg-blue-500' : 'bg-gray-600'
                    }`}
                  ></div>
                </button>
              </div>
            </div>
            <div className="bg-gray-700/30 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3">
                {configT('appInfo')}
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">{configT('version')}</span>
                  <span className="text-white">1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">{configT('build')}</span>
                  <span className="text-white">2024.1.1</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">{configT('lastUpdate')}</span>
                  <span className="text-white">
                    Hace 2 {configT('daysAgo')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )

      case 'support':
        return (
          <div className="space-y-4">
            <div className="bg-gray-700/30 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3">
                {configT('helpAndSupport')}
              </h4>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-3 bg-gray-600/30 hover:bg-gray-600/50 rounded-lg transition-colors">
                  <span className="text-gray-300">{configT('helpCenter')}</span>
                  <FiHelpCircle className="w-4 h-4 text-gray-400" />
                </button>
                <button className="w-full flex items-center justify-between p-3 bg-gray-600/30 hover:bg-gray-600/50 rounded-lg transition-colors">
                  <span className="text-gray-300">
                    {configT('contactSupport')}
                  </span>
                  <FiHelpCircle className="w-4 h-4 text-gray-400" />
                </button>
                <button className="w-full flex items-center justify-between p-3 bg-gray-600/30 hover:bg-gray-600/50 rounded-lg transition-colors">
                  <span className="text-gray-300">
                    {configT('reportProblem')}
                  </span>
                  <FiHelpCircle className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
            <div className="bg-gray-700/30 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3">
                {configT('legal')}
              </h4>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-3 bg-gray-600/30 hover:bg-gray-600/50 rounded-lg transition-colors">
                  <span className="text-gray-300">
                    {configT('termsOfService')}
                  </span>
                  <FiHelpCircle className="w-4 h-4 text-gray-400" />
                </button>
                <button className="w-full flex items-center justify-between p-3 bg-gray-600/30 hover:bg-gray-600/50 rounded-lg transition-colors">
                  <span className="text-gray-300">
                    {configT('privacyPolicy')}
                  </span>
                  <FiHelpCircle className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (!session?.user) {
    return (
      <div
        className={`w-full h-full bg-gray-900 flex items-center justify-center ${className}`}
      >
        <div className="text-center text-gray-400">
          <FiUser className="w-12 h-12 mx-auto mb-4" />
          <p>No active session</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`w-full min-h-screen bg-gray-900 ${className}`}>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onHide={() => setToast(null)}
        />
      )}

      {/* Header estilo WhatsApp */}
      <div className="sticky top-0 z-20 bg-gray-900/95 backdrop-blur-md">
        <AnimatePresence mode="wait">
          {activeConfigSection ? (
            // Header cuando se está en una sección específica
            <motion.div
              key="section-header"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-center justify-between px-4 py-4"
            >
              <motion.button
                onClick={() => setActiveConfigSection(null)}
                className="flex items-center text-blue-400 hover:text-blue-300 transition-colors p-2 rounded-lg hover:bg-gray-800/50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiChevronLeft className="w-6 h-6" />
              </motion.button>

              <div className="flex-1 text-center px-10">
                <h2 className="text-lg font-semibold text-white">
                  {
                    configSections.find((s) => s.id === activeConfigSection)
                      ?.title
                  }
                </h2>
              </div>
            </motion.div>
          ) : (
            // Header principal
            <motion.div
              key="main-header"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="px-4 py-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-white">
                  {canManageIncidents ? 'Administration Panel' : 'Settings'}
                </h1>
              </div>

              {canManageIncidents && (
                <motion.div
                  className="flex bg-gray-800/30 rounded-xl p-1 backdrop-blur-sm"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <button
                    onClick={() => setActiveSection('profile')}
                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
                      activeSection === 'profile'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                    }`}
                  >
                    <FiUser className="w-4 h-4 mx-auto mb-1" />
                    Profile
                  </button>
                  <button
                    onClick={() => setActiveSection('queue')}
                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
                      activeSection === 'queue'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                    }`}
                  >
                    <FiCheckCircle className="w-4 h-4 mx-auto mb-1" />
                    Queue
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Contenido principal con animaciones mejoradas */}
      <div className="px-4 py-2 pb-32">
        <AnimatePresence mode="wait">
          {activeSection === 'profile' ? (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="space-y-6"
            >
              {/* Vista previa del perfil - solo en menú principal */}
              {!activeConfigSection && (
                <motion.div
                  className="bg-gradient-to-br from-gray-800/70 via-gray-900/50 to-gray-800/70 backdrop-blur-2xl rounded-3xl p-7 border border-gray-600/20 shadow-2xl relative overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  {/* Efecto de fondo sutil */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-50"></div>

                  <div className="relative flex items-center space-x-6">
                    {/* Avatar premium con efectos avanzados */}
                    <div className="relative flex-shrink-0">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-0.5 shadow-2xl">
                        <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center overflow-hidden ring-2 ring-gray-600/30">
                          {profileImagePreview ? (
                            <Image
                              src={profileImagePreview}
                              alt="Profile"
                              width={80}
                              height={80}
                              className="object-cover"
                            />
                          ) : (
                            <FiUser className="w-10 h-10 text-gray-400" />
                          )}
                        </div>
                      </div>
                      {/* Efecto de brillo premium */}
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-transparent via-white/10 to-transparent opacity-0 hover:opacity-100 transition-all duration-500 pointer-events-none"></div>
                      {/* Efecto de pulso sutil */}
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 animate-pulse opacity-30"></div>
                    </div>

                    {/* Información del usuario con diseño premium */}
                    <div className="flex-1 min-w-0">
                      <h2 className="text-2xl font-bold text-white mb-3 truncate bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                        {session.user.name || 'User'}
                      </h2>

                      {/* Información de fecha de registro */}
                      {session.user.createdAt && (
                        <div className="mb-4">
                          <span className="text-xs text-gray-300 font-medium bg-gray-800/30 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                            Since{' '}
                            {new Date(
                              session.user.createdAt
                            ).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                            })}
                          </span>
                        </div>
                      )}

                      {/* Badge del barrio con diseño premium */}
                      <div className="flex items-center space-x-3 bg-gradient-to-r from-gray-700/60 via-gray-800/60 to-gray-700/60 rounded-2xl px-5 py-3 backdrop-blur-xl border border-gray-600/40 w-fit shadow-xl">
                        <div className="w-5 h-5 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                          <FiMapPin className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-sm font-bold text-gray-100 truncate">
                          {session.user.neighborhood || 'Not assigned'}
                        </span>
                        {/* Indicador de estado */}
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0"></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Contenido de la sección de configuración */}
              {activeConfigSection && (
                <motion.div
                  className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-5 border border-gray-700/40 shadow-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  {renderConfigSection(activeConfigSection)}
                </motion.div>
              )}

              {/* Estadísticas de administración - solo en menú principal */}
              {!activeConfigSection && canManageIncidents && (
                <motion.div
                  className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/30 shadow-xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mr-3">
                      <FiShield className="w-4 h-4 text-blue-400" />
                    </div>
                    Admin Statistics
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      {
                        icon: FiAlertTriangle,
                        value: '12',
                        label: 'Pending',
                        color: 'yellow',
                      },
                      {
                        icon: FiCheckCircle,
                        value: '45',
                        label: 'Verified',
                        color: 'green',
                      },
                      {
                        icon: FiClock,
                        value: '2.3h',
                        label: 'Avg. Time',
                        color: 'blue',
                      },
                      {
                        icon: FiUsers,
                        value: '156',
                        label: 'Total Users',
                        color: 'purple',
                      },
                    ].map((stat, index) => (
                      <motion.div
                        key={stat.label}
                        className="bg-gray-700/30 rounded-xl p-4 text-center backdrop-blur-sm"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        whileHover={{ scale: 1.05 }}
                      >
                        <stat.icon
                          className={`w-6 h-6 text-${stat.color}-400 mx-auto mb-2`}
                        />
                        <div className="text-2xl font-bold text-white mb-1">
                          {stat.value}
                        </div>
                        <div className="text-xs text-gray-400 font-medium">
                          {stat.label}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Sección de configuración - solo en menú principal */}
              {!activeConfigSection && (
                <motion.div
                  className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/40 shadow-lg overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center">
                      <div className="w-8 h-8 bg-gray-500/20 rounded-lg flex items-center justify-center mr-3">
                        <FiSettings className="w-4 h-4 text-gray-400" />
                      </div>
                      Settings
                    </h3>
                    <div className="space-y-3">
                      {configSections.map((section, index) => (
                        <motion.div
                          key={section.id}
                          className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-300 backdrop-blur-sm border ${
                            section.available
                              ? 'bg-gray-700/30 hover:bg-gray-700/50 border-gray-600/20 cursor-pointer'
                              : 'bg-gray-800/20 border-gray-700/20 cursor-not-allowed opacity-50'
                          }`}
                          whileHover={
                            section.available
                              ? {
                                  scale: 1.02,
                                  backgroundColor: 'rgba(55, 65, 81, 0.5)',
                                }
                              : {}
                          }
                          whileTap={section.available ? { scale: 0.98 } : {}}
                          transition={{
                            type: 'spring',
                            stiffness: 400,
                            damping: 17,
                            delay: index * 0.05,
                          }}
                          onClick={
                            section.available
                              ? () => setActiveConfigSection(section.id)
                              : undefined
                          }
                        >
                          <div className="flex items-center space-x-4">
                            <div
                              className={`w-12 h-12 ${
                                section.bgColor
                              } rounded-xl flex items-center justify-center shadow-lg ${
                                !section.available ? 'opacity-50' : ''
                              }`}
                            >
                              <section.icon
                                className={`w-6 h-6 ${section.color} ${
                                  !section.available ? 'text-gray-500' : ''
                                }`}
                              />
                            </div>
                            <div className="text-left">
                              <h4
                                className={`font-semibold text-base ${
                                  section.available
                                    ? 'text-white'
                                    : 'text-gray-500'
                                }`}
                              >
                                {section.title}
                              </h4>
                              <p
                                className={`text-sm ${
                                  section.available
                                    ? 'text-gray-400'
                                    : 'text-gray-600'
                                }`}
                              >
                                {section.available
                                  ? section.description
                                  : '🚧 Not available in demo version'}
                              </p>
                            </div>
                          </div>
                          {section.available ? (
                            <FiChevronRight className="w-5 h-5 text-gray-400" />
                          ) : (
                            <div className="w-5 h-5" />
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Botón de cerrar sesión - solo en menú principal */}
              {!activeConfigSection && (
                <motion.div
                  className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-5 border border-gray-700/40 shadow-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <motion.button
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-center space-x-3 p-4 bg-gradient-to-r from-red-500/20 to-red-600/20 hover:from-red-500/30 hover:to-red-600/30 border border-red-500/30 rounded-xl transition-all duration-300 backdrop-blur-sm"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FiLogOut className="w-5 h-5 text-red-400" />
                    <span className="text-red-400 font-semibold">Sign Out</span>
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="queue"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="space-y-6"
            >
              <motion.div
                className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/30 shadow-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h3 className="text-lg font-bold text-white mb-6 flex items-center">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mr-3">
                    <FiCheckCircle className="w-4 h-4 text-blue-400" />
                  </div>
                  Verification Queue
                </h3>
                <IncidentQueue />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default MobileSettingsView
