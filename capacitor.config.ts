
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.a8968f7559bc4d5799576b85a08e33e3',
  appName: 'VeriVault - Secure Biometric Login',
  webDir: 'dist',
  server: {
    url: 'https://a8968f75-59bc-4d57-9957-6b85a08e33e3.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1a1a1a',
      showSpinner: false,
    },
    NativeBiometric: {
      biometricTitle: "VeriVault Authentication",
      biometricSubTitle: "Use your biometric to authenticate",
      biometricDescription: "Place your finger on the sensor or look at the camera",
      fallbackTitle: "Use Password",
      fallbackButtonTitle: "Cancel",
    },
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    }
  },
  ios: {
    scheme: 'VeriVault'
  }
};

export default config;
