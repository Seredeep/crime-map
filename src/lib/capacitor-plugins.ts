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

// Initialize plugins asynchronously on client side
let pluginsInitialized = false;

const initializePlugins = async () => {
  if (typeof window === 'undefined' || pluginsInitialized) return;

  try {
    const [
      { App: AppPlugin },
      camera,
      { Capacitor: CapacitorPlugin },
      { Geolocation: GeolocationPlugin },
      { Keyboard: KeyboardPlugin },
      { LocalNotifications: LocalNotificationsPlugin },
      { SplashScreen: SplashScreenPlugin },
      { StatusBar: StatusBarPlugin }
    ] = await Promise.all([
      import('@capacitor/app'),
      import('@capacitor/camera'),
      import('@capacitor/core'),
      import('@capacitor/geolocation'),
      import('@capacitor/keyboard'),
      import('@capacitor/local-notifications'),
      import('@capacitor/splash-screen'),
      import('@capacitor/status-bar')
    ]);

    App = AppPlugin;
    Camera = camera;
    Capacitor = CapacitorPlugin;
    Geolocation = GeolocationPlugin;
    Keyboard = KeyboardPlugin;
    LocalNotifications = LocalNotificationsPlugin;
    SplashScreen = SplashScreenPlugin;
    StatusBar = StatusBarPlugin;

    pluginsInitialized = true;
  } catch (error) {
    console.warn('Capacitor plugins not available:', error);
  }
};

// Initialize plugins on client side
if (typeof window !== 'undefined') {
  initializePlugins();
}

// Helper function to ensure plugins are loaded
const ensurePluginsLoaded = async () => {
  if (!pluginsInitialized) {
    await initializePlugins();
  }
};

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

// #region Geolocation Configuration
export const getCurrentPosition = async () => {
  await ensurePluginsLoaded();

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

export const watchPosition = async (callback: (position: any) => void) => {
  await ensurePluginsLoaded();

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

// #region Camera Configuration
export const takePhoto = async () => {
  await ensurePluginsLoaded();

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
  await ensurePluginsLoaded();

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

// #region Status Bar Configuration
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

// #region Keyboard Configuration
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

// #region App Configuration
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

// #region Splash Screen Configuration
export const hideSplashScreen = async () => {
  if (!isNativePlatform() || !SplashScreen) return;

  try {
    await SplashScreen.hide();
  } catch (error) {
    console.error('Error ocultando splash screen:', error);
  }
};
// #endregion

// #region Local Notifications Configuration
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

// #region Initialization Function
export const initializeCapacitorPlugins = async () => {
  // Ensure plugins are loaded first
  await initializePlugins();

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
