import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.claridad.app',
  appName: 'Claridad',
  webDir: 'out',
  server: {
    androidScheme: 'http',
    url: 'http://192.168.0.97:3000',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#040910",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#B5CCF4",
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#040910"
    },
    Keyboard: {
      resizeOnFullScreen: true
    },
    App: {
      statusBarStyle: "DARK"
    },
    Geolocation: {
      permissions: {
        location: "always"
      }
    },
    Camera: {
      permissions: {
        camera: "required",
        photos: "required"
      }
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#B5CCF4",
      sound: "beep.wav"
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
    buildOptions: {
      keystorePath: 'C:/Users/sanch/OneDrive/Escritorio/Development/crime-map/android/app/my-release-key.keystore',
      keystorePassword: 'claridad123',
      keystoreAlias: 'claridad-key',
      keystoreAliasPassword: 'claridad123'
    }
  },
  ios: {
    contentInset: "automatic",
    scrollEnabled: true
  }
};

export default config;
