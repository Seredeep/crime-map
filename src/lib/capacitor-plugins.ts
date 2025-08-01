/**
 * CONFIGURACIÓN DE PLUGINS NATIVOS DE CAPACITOR
 * ============================================
 *
 * Este archivo centraliza la configuración y uso de plugins nativos
 * de Capacitor para la aplicación Claridad.
 */

// Importaciones condicionales para evitar errores en el servidor
let App: any;
let Camera: any;
let Capacitor: any;
let Geolocation: any;
let Keyboard: any;
let LocalNotifications: any;
let SplashScreen: any;
let StatusBar: any;

// Solo importar en el cliente
if (typeof window !== 'undefined') {
  try {
    App = require('@capacitor/app').App;
    Camera = require('@capacitor/camera');
    Capacitor = require('@capacitor/core').Capacitor;
    Geolocation = require('@capacitor/geolocation').Geolocation;
    Keyboard = require('@capacitor/keyboard').Keyboard;
    LocalNotifications = require('@capacitor/local-notifications').LocalNotifications;
    SplashScreen = require('@capacitor/splash-screen').SplashScreen;
    StatusBar = require('@capacitor/status-bar').StatusBar;
  } catch (error) {
    console.warn('Capacitor plugins not available:', error);
  }
}

// #region Utilidades de Plataforma
export const isNativePlatform = () => {
  if (!Capacitor) return false;
  return Capacitor.isNativePlatform();
};

export const getPlatform = () => {
  if (!Capacitor) return 'web';
  return Capacitor.getPlatform();
};

export const isAndroid = () => {
  if (!Capacitor) return false;
  return Capacitor.getPlatform() === 'android';
};

export const isIOS = () => {
  if (!Capacitor) return false;
  return Capacitor.getPlatform() === 'ios';
};
// #endregion

// #region Configuración de Geolocalización
export const getCurrentPosition = async () => {
  if (!Geolocation) {
    throw new Error('Geolocation not available');
  }

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
  if (!Geolocation) {
    console.warn('Geolocation not available');
    return null;
  }

  return Geolocation.watchPosition({
    enableHighAccuracy: true,
    timeout: 10000,
  }, callback);
};
// #endregion

// #region Configuración de Cámara
export const takePhoto = async () => {
  if (!Camera) {
    throw new Error('Camera not available');
  }

  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: Camera.CameraResultType.Uri,
      source: Camera.CameraSource.Camera,
    });

    return image;
  } catch (error) {
    console.error('Error tomando foto:', error);
    throw error;
  }
};

export const pickImage = async () => {
  if (!Camera) {
    throw new Error('Camera not available');
  }

  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: Camera.CameraResultType.Uri,
      source: Camera.CameraSource.Photos,
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
  if (!isNativePlatform() || !StatusBar) return;

  try {
    await StatusBar.setStyle({ style: StatusBar.Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#040910' });
  } catch (error) {
    console.error('Error configurando status bar:', error);
  }
};
// #endregion

// #region Configuración de Teclado
export const configureKeyboard = () => {
  if (!isNativePlatform() || !Keyboard) return;

  Keyboard.addListener('keyboardWillShow', (info: any) => {
    document.body.style.setProperty('--keyboard-height', `${info.keyboardHeight}px`);
  });

  Keyboard.addListener('keyboardWillHide', () => {
    document.body.style.setProperty('--keyboard-height', '0px');
  });
};
// #endregion

// #region Configuración de App
export const configureApp = () => {
  if (!isNativePlatform() || !App) return;

  App.addListener('appStateChange', ({ isActive }: any) => {
    console.log('App state changed. Is active?', isActive);
  });

  App.addListener('backButton', ({ canGoBack }: any) => {
    if (!canGoBack) {
      App.exitApp();
    } else {
      window.history.back();
    }
  });
};
// #endregion

// #region Configuración de Splash Screen
export const hideSplashScreen = async () => {
  if (!isNativePlatform() || !SplashScreen) return;

  try {
    await SplashScreen.hide();
  } catch (error) {
    console.error('Error ocultando splash screen:', error);
  }
};
// #endregion

// #region Configuración de Notificaciones Locales
export const scheduleLocalNotification = async (title: string, body: string, id: number = 1) => {
  if (!isNativePlatform() || !LocalNotifications) return;

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
};

export const configureLocalNotifications = async () => {
  if (!isNativePlatform() || !LocalNotifications) return;

  try {
    const permissions = await LocalNotifications.checkPermissions();
    if (permissions.display !== 'granted') {
      await LocalNotifications.requestPermissions();
    }
  } catch (error) {
    console.error('Error configurando notificaciones locales:', error);
  }
};
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
