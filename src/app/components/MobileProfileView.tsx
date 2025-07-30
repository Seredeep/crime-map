'use client';

import { motion } from 'framer-motion';
import { signOut, useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  FiAlertTriangle,
  FiCamera,
  FiCheckCircle,
  FiClock,
  FiLogOut,
  FiMapPin,
  FiSettings,
  FiShield,
  FiUser,
  FiUsers,
  FiXCircle
} from 'react-icons/fi';
import IncidentQueue from './IncidentQueue';

interface MobileProfileViewProps {
  className?: string;
}

const Toast = ({ message, type, onHide }: { message: string; type: 'success' | 'error'; onHide: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onHide, 5000);
    return () => clearTimeout(timer);
  }, [onHide]);

  const Icon = type === 'success' ? FiCheckCircle : FiXCircle;
  const bgColor = type === 'success' ? 'bg-green-700' : 'bg-red-700';
  const borderColor = type === 'success' ? 'border-green-500' : 'border-red-500';
  const shadowColor = type === 'success' ? 'shadow-green-500/50' : 'shadow-red-500/50';

  return createPortal(
    <div
      className={`fixed top-5 left-1/2 -translate-x-1/2 z-[1000] p-3 rounded-lg shadow-md border ${bgColor} ${borderColor} text-white font-medium flex items-center space-x-3
        transform opacity-100 scale-100 transition-all duration-300 ease-in-out`}
    >
      <Icon className={`w-6 h-6 ${shadowColor} drop-shadow-lg`} />
      <span>{message}</span>
    </div>,
    document.body
  );
};

const MobileProfileView = ({ className = '' }: MobileProfileViewProps) => {
  const { data: session, update } = useSession();
  const t = useTranslations('Profile');
  const [activeSection, setActiveSection] = useState<'profile' | 'queue'>('profile');

  // Settings state
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [privacyPublic, setPrivacyPublic] = useState(false);
  const [autoLocationEnabled, setAutoLocationEnabled] = useState(false);

  // UI State
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Profile Image State
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Effect to sync state with session
  useEffect(() => {
    if (session?.user) {
      setNotificationsEnabled(session.user.notificationsEnabled ?? true);
      setPrivacyPublic(session.user.privacyPublic ?? false);
      setAutoLocationEnabled(session.user.autoLocationEnabled ?? true);
      setProfileImagePreview(session.user.profileImage || null);
      console.log("Session user profileImage on mount/update:", session.user.profileImage);
    }
  }, [session]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    console.log(`Toast activado: ${message} (Tipo: ${type})`);
  };

  const handleSettingChange = useCallback(async (newSettings: Partial<{ notificationsEnabled: boolean; privacyPublic: boolean; autoLocationEnabled: boolean }>) => {
    if (isSaving) {
      console.log("Intento de guardar mientras ya se está guardando.");
      return;
    }
    setIsSaving(true);
    console.log("Iniciando guardado de configuración...");

    const fullSettings = {
      notificationsEnabled,
      privacyPublic,
      autoLocationEnabled,
      ...newSettings,
    };
    console.log("Configuración a enviar:", fullSettings);

    try {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullSettings),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error en la respuesta de la API de configuración:", errorData);
        throw new Error(errorData.message || 'No se pudo guardar la configuración.');
      }

      console.log("Configuración guardada en la API. Actualizando sesión...");
      await update(fullSettings);
      console.log("Sesión actualizada.");
      showToast('Configuración guardada.', 'success');
    } catch (error) {
      console.error('Error al guardar la configuración:', error);
      showToast(error instanceof Error ? error.message : 'Error desconocido.', 'error');
      if (session?.user) {
        setNotificationsEnabled(session.user.notificationsEnabled ?? true);
        setPrivacyPublic(session.user.privacyPublic ?? false);
        setAutoLocationEnabled(session.user.autoLocationEnabled ?? true);
        console.log("Estado de settings revertido a valores de sesión tras error.");
      }
    } finally {
      setIsSaving(false);
      console.log("Finalizado el intento de guardado de configuración.");
    }
  }, [isSaving, notificationsEnabled, privacyPublic, autoLocationEnabled, update, session]);

  const createToggleHandler = (
    setter: React.Dispatch<React.SetStateAction<boolean>>,
    key: 'notificationsEnabled' | 'privacyPublic' | 'autoLocationEnabled'
  ) => () => {
    setter(prev => {
      const newValue = !prev;
      console.log(`Toggle ${key} cambiado a: ${newValue}`);
      handleSettingChange({ [key]: newValue });
      return newValue;
    });
  };

  const toggleNotifications = createToggleHandler(setNotificationsEnabled, 'notificationsEnabled');
  const togglePrivacy = createToggleHandler(setPrivacyPublic, 'privacyPublic');

  const toggleAutoLocation = () => {
    const newValue = !autoLocationEnabled;
    setAutoLocationEnabled(newValue);
    console.log(`Toggle autoLocation cambiado a: ${newValue}`);

    if (newValue) {
      if ('geolocation' in navigator) {
        console.log("Solicitando permiso de geolocalización...");
        navigator.geolocation.getCurrentPosition(
          () => {
            console.log("Permiso de ubicación concedido.");
            showToast('Ubicación activada.', 'success');
            handleSettingChange({ autoLocationEnabled: true });
          },
          () => {
            console.log("Permiso de ubicación denegado.");
            showToast('Permiso de ubicación denegado.', 'error');
            setAutoLocationEnabled(false);
            handleSettingChange({ autoLocationEnabled: false });
          }
        );
      } else {
        console.log("Geolocalización no soportada.");
        showToast('Geolocalización no soportada.', 'error');
        setAutoLocationEnabled(false);
      }
    } else {
      handleSettingChange({ autoLocationEnabled: false });
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log("Archivo de imagen seleccionado:", file.name);
      setProfileImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setProfileImagePreview(previewUrl);
      console.log("Generated image preview URL (blob):", previewUrl);
    } else {
      console.log("Ningún archivo de imagen seleccionado.");
      setProfileImageFile(null);
      setProfileImagePreview(session?.user?.profileImage || null);
    }
  };

  useEffect(() => {
    return () => {
      if (profileImagePreview && profileImagePreview.startsWith('blob:')) {
        console.log("Revocando URL del objeto blob:", profileImagePreview);
        URL.revokeObjectURL(profileImagePreview);
      }
    };
  }, [profileImagePreview]);

  const handleImageUpload = async () => {
    if (!profileImageFile) {
      console.log("No hay archivo de imagen para subir.");
      return;
    }
    setIsSaving(true);
    console.log("Iniciando subida de imagen...");

    const formData = new FormData();
    formData.append('profileImage', profileImageFile);
    console.log("FormData creado.");

    try {
      const response = await fetch('/api/user/upload-profile-image', {
        method: 'POST',
        body: formData,
      });
      console.log("Respuesta de la API de carga de imagen:", response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error en la respuesta de la API de carga de imagen:", errorData);
        throw new Error(errorData.message || 'Error al subir la imagen.');
      }

      const result = await response.json();
      console.log("Imagen subida con éxito. Resultado:", result);
      showToast('Imagen actualizada.', 'success');
      console.log("Actualizando sesión con nueva URL de imagen:", result.profileImageUrl);
      await update({ profileImage: result.profileImageUrl });
      console.log("Sesión actualizada con nueva URL de imagen.", session?.user?.profileImage);
      setProfileImageFile(null);
    } catch (error) {
      console.error('Error al subir la imagen:', error);
      showToast(error instanceof Error ? error.message : 'Error desconocido.', 'error');
      setProfileImagePreview(session?.user?.profileImage || null);
      console.log("Estado de previsualización de imagen revertido tras error.");
    } finally {
      setIsSaving(false);
      console.log("Finalizado el intento de subida de imagen.");
    }
  };

  const isAdmin = session?.user?.role === 'admin';
  const isEditor = session?.user?.role === 'editor';
  const canManageIncidents = isAdmin || isEditor;

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin': return t('administrator');
      case 'editor': return t('editor');
      case 'user': return t('user');
      default: return t('user');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'editor': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'user': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (!session?.user) {
    return (
      <div className={`w-full h-full bg-gray-900 flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-400">
          <FiUser className="w-12 h-12 mx-auto mb-4" />
          <p>No hay sesión activa</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full bg-gray-900 ${className}`}>
      {toast && <Toast message={toast.message} type={toast.type} onHide={() => setToast(null)} />}
      <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700/50 p-4">
        <h1 className="text-2xl font-bold text-white mb-4">
          {canManageIncidents ? 'Panel de Administración' : 'Configuración'}
        </h1>
        {canManageIncidents && (
          <div className="flex bg-gray-800/50 rounded-xl p-1">
            <button
              onClick={() => setActiveSection('profile')}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeSection === 'profile'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <FiUser className="w-4 h-4 mx-auto mb-1" />
              {t('profile')}
            </button>
            <button
              onClick={() => setActiveSection('queue')}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeSection === 'queue'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <FiCheckCircle className="w-4 h-4 mx-auto mb-1" />
              {t('queue')}
            </button>
          </div>
        )}
      </div>
      <div className="p-4 pb-24">
        {activeSection === 'profile' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div
                    className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center relative group overflow-hidden cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="flex flex-col items-center">
                      <div className="relative mb-4">
                        <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden border-2 border-gray-600 shadow-lg">
                          {profileImagePreview ? (
                            <Image
                              src={profileImagePreview}
                              alt="Vista previa"
                              width={96}
                              height={96}
                              className="object-cover"
                            />
                          ) : (
                            <FiUser className="w-12 h-12 text-gray-500" />
                          )}
                        </div>
                      </div>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <FiCamera className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-white">
                      {session.user.name || 'Usuario'}
                    </h2>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(session.user.role || 'user')}`}>
                        {getRoleName(session.user.role || 'user')}
                      </span>
                      {session.user.createdAt && (
                        <span className="text-xs text-gray-400">
                          Desde {new Date(session.user.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-gray-300 bg-gray-700/30 rounded-full px-3 py-1">
                  <FiMapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-xs font-medium">{session.user.neighborhood || 'Barrio no asignado'}</span>
                </div>
              </div>

              {profileImageFile && (
                <button
                  onClick={handleImageUpload}
                  disabled={isSaving}
                  className="w-full mb-4 p-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Subiendo...' : 'Guardar Imagen'}
                </button>
              )}
            </div>
            {canManageIncidents && (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <FiShield className="w-5 h-5 mr-2 text-blue-400" />
                  Estadísticas de Administración
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-700/30 rounded-lg p-3 text-center">
                    <FiAlertTriangle className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">12</div>
                    <div className="text-xs text-gray-400">{t('pending')}</div>
                  </div>
                  <div className="bg-gray-700/30 rounded-lg p-3 text-center">
                    <FiCheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">45</div>
                    <div className="text-xs text-gray-400">{t('verified')}</div>
                  </div>
                  <div className="bg-gray-700/30 rounded-lg p-3 text-center">
                    <FiClock className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">2.3h</div>
                    <div className="text-xs text-gray-400">{t('averageTime')}</div>
                  </div>
                  <div className="bg-gray-700/30 rounded-lg p-3 text-center">
                    <FiUsers className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">156</div>
                    <div className="text-xs text-gray-400">{t('totalUsers')}</div>
                  </div>
                </div>
              </div>
            )}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <FiSettings className="w-5 h-5 mr-2 text-gray-400" />
                Configuración
              </h3>
              <div className="bg-gray-700/20 p-4 rounded-lg space-y-3">
                <button
                  onClick={toggleNotifications}
                  disabled={isSaving}
                  className="w-full flex items-center justify-between p-3 bg-gray-600/30 hover:bg-gray-600/50 rounded-lg transition-colors disabled:opacity-50"
                >
                  <span className="text-gray-300">Notificaciones</span>
                  <div className={`w-5 h-5 rounded-full ${notificationsEnabled ? 'bg-blue-500' : 'bg-gray-600'}`}></div>
                </button>
                <button
                  onClick={togglePrivacy}
                  disabled={isSaving}
                  className="w-full flex items-center justify-between p-3 bg-gray-600/30 hover:bg-gray-600/50 rounded-lg transition-colors disabled:opacity-50"
                >
                  <span className="text-gray-300">{t('publicProfile')}</span>
                  <div className={`w-5 h-5 rounded-full ${privacyPublic ? 'bg-blue-500' : 'bg-gray-600'}`}></div>
                </button>
                <button
                  onClick={toggleAutoLocation}
                  disabled={isSaving}
                  className="w-full flex items-center justify-between p-3 bg-gray-600/30 hover:bg-gray-600/50 rounded-lg transition-colors disabled:opacity-50"
                >
                  <span className="text-gray-300">Ubicación automática</span>
                  <div className={`w-5 h-5 rounded-full ${autoLocationEnabled ? 'bg-blue-500' : 'bg-gray-600'}`}></div>
                </button>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center space-x-2 p-4 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-xl transition-colors"
            >
              <FiLogOut className="w-5 h-5 text-red-400" />
              <span className="text-red-400 font-medium">Cerrar Sesión</span>
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <FiCheckCircle className="w-5 h-5 mr-2 text-blue-400" />
                {t('verificationQueue')}
              </h3>
              <IncidentQueue />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MobileProfileView;
