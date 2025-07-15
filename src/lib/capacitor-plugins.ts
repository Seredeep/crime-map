/**
 * CONFIGURACIÓN DE PLUGINS NATIVOS DE CAPACITOR
 * ============================================
 *
 * Este archivo centraliza la configuración y uso de plugins nativos
 * de Capacitor para la aplicación Claridad.
 */

import { App } from '@capacitor/app';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { Keyboard } from '@capacitor/keyboard';
import { LocalNotifications } from '@capacitor/local-notifications';

import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

// #region Utilidades de Plataforma
export const isNativePlatform = () => {
  return Capacitor.isNativePlatform();
};

export const getPlatform = () => {
  return Capacitor.getPlatform();
};

export const isAndroid = () => {
  return Capacitor.getPlatform() === 'android';
};

export const isIOS = () => {
  return Capacitor.getPlatform() === 'ios';
};
// #endregion

// #region Configuración de Geolocalización
export const getCurrentPosition = async () => {
  try {
    const permissions = await Geolocation.checkPermissions();

    if (permissions.location !== 'granted') {
      const requestResult = await Geolocation.requestPermissions();
      if (requestResult.location !== 'granted') {
        throw new Error('Permisos de geolocalización denegados');
      }
    }

    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
    });

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
    };
  } catch (error) {
    console.error('Error obteniendo ubicación:', error);
    throw error;
  }
};

export const watchPosition = (callback: (position: any) => void) => {
  return Geolocation.watchPosition({
    enableHighAccuracy: true,
    timeout: 10000,
  }, callback);
};
// #endregion

// #region Configuración de Cámara
export const takePhoto = async () => {
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
    });

    return image;
  } catch (error) {
    console.error('Error tomando foto:', error);
    throw error;
  }
};

export const pickImage = async () => {
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Photos,
    });

    return image;
  } catch (error) {
    console.error('Error seleccionando imagen:', error);
    throw error;
  }
};
// #endregion

// #region Configuración de Status Bar
export const configureStatusBar = async () => {
  if (isNativePlatform()) {
    try {
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#040910' });
    } catch (error) {
      console.error('Error configurando status bar:', error);
    }
  }
};
// #endregion

// #region Configuración de Teclado
export const configureKeyboard = () => {
  if (isNativePlatform()) {
    Keyboard.addListener('keyboardWillShow', (info) => {
      document.body.style.setProperty('--keyboard-height', `${info.keyboardHeight}px`);
    });

    Keyboard.addListener('keyboardWillHide', () => {
      document.body.style.setProperty('--keyboard-height', '0px');
    });
  }
};
// #endregion

// #region Configuración de App
export const configureApp = () => {
  if (isNativePlatform()) {
    App.addListener('appStateChange', ({ isActive }) => {
      console.log('App state changed. Is active?', isActive);
    });

    App.addListener('backButton', ({ canGoBack }) => {
      if (!canGoBack) {
        App.exitApp();
      } else {
        window.history.back();
      }
    });
  }
};
// #endregion

// #region Configuración de Splash Screen
export const hideSplashScreen = async () => {
  if (isNativePlatform()) {
    try {
      await SplashScreen.hide();
    } catch (error) {
      console.error('Error ocultando splash screen:', error);
    }
  }
};
// #endregion

// #region Configuración de Notificaciones Locales
export const scheduleLocalNotification = async (title: string, body: string, id: number = 1) => {
  if (isNativePlatform()) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id,
            schedule: { at: new Date(Date.now() + 1000 * 5) }, // 5 segundos
            sound: 'beep.wav',
            attachments: undefined,
            actionTypeId: '',
            extra: null,
          },
        ],
      });
    } catch (error) {
      console.error('Error programando notificación local:', error);
    }
  }
};

export const configureLocalNotifications = async () => {
  if (isNativePlatform()) {
    try {
      const permissions = await LocalNotifications.checkPermissions();
      if (permissions.display !== 'granted') {
        await LocalNotifications.requestPermissions();
      }
    } catch (error) {
      console.error('Error configurando notificaciones locales:', error);
    }
  }
};
// #endregion


// #endregion

// #region Función de Inicialización
export const initializeCapacitorPlugins = async () => {
  if (isNativePlatform()) {
    try {
      await configureStatusBar();
      configureKeyboard();
      configureApp();
      await configureLocalNotifications();
      await hideSplashScreen();

      console.log('Plugins de Capacitor inicializados correctamente');
    } catch (error) {
      console.error('Error inicializando plugins de Capacitor:', error);
    }
  }
};
// #endregion
