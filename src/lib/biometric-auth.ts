import { Preferences } from '@capacitor/preferences';
import { Device } from '@capacitor/device';

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  errorCode?: string;
}

export interface BiometricCapabilities {
  isAvailable: boolean;
  biometryType: 'fingerprint' | 'face' | 'iris' | 'none';
  hasEnrolledBiometrics: boolean;
}

export class BiometricAuthService {
  private static readonly TOKEN_KEY = 'biometric_token';
  private static readonly USER_KEY = 'biometric_user';
  private static readonly EXPIRY_KEY = 'biometric_expiry';
  private static readonly ENABLED_KEY = 'biometric_enabled';
  
  // Simulate biometric authentication for web demo
  static async authenticate(): Promise<BiometricAuthResult> {
    try {
      // In a real app, this would use native biometric APIs
      // For web demo, we'll simulate the process
      const isEnabled = await this.isBiometricEnabled();
      if (!isEnabled) {
        return { success: false, error: 'Biometric authentication not enabled' };
      }

      // Simulate biometric prompt
      return new Promise((resolve) => {
        // Show a mock biometric dialog
        const result = window.confirm(
          '🔐 Biometric Authentication\n\nPlace your finger on the sensor or look at the camera to authenticate.'
        );
        
        setTimeout(() => {
          if (result) {
            resolve({ success: true });
          } else {
            resolve({ success: false, error: 'Authentication cancelled' });
          }
        }, 1500); // Simulate authentication delay
      });
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  static async checkBiometricCapabilities(): Promise<BiometricCapabilities> {
    try {
      const info = await Device.getInfo();
      
      // For web/mobile demo, assume capabilities are available
      return {
        isAvailable: true,
        biometryType: info.platform === 'ios' ? 'face' : 'fingerprint',
        hasEnrolledBiometrics: true
      };
    } catch (error) {
      return {
        isAvailable: false,
        biometryType: 'none',
        hasEnrolledBiometrics: false
      };
    }
  }

  static async enableBiometricAuth(userId: string, token: string): Promise<boolean> {
    try {
      const expiryTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
      
      await Promise.all([
        Preferences.set({ key: this.TOKEN_KEY, value: token }),
        Preferences.set({ key: this.USER_KEY, value: userId }),
        Preferences.set({ key: this.EXPIRY_KEY, value: expiryTime.toString() }),
        Preferences.set({ key: this.ENABLED_KEY, value: 'true' })
      ]);
      
      return true;
    } catch (error) {
      console.error('Failed to enable biometric auth:', error);
      return false;
    }
  }

  static async disableBiometricAuth(): Promise<void> {
    try {
      await Promise.all([
        Preferences.remove({ key: this.TOKEN_KEY }),
        Preferences.remove({ key: this.USER_KEY }),
        Preferences.remove({ key: this.EXPIRY_KEY }),
        Preferences.set({ key: this.ENABLED_KEY, value: 'false' })
      ]);
    } catch (error) {
      console.error('Failed to disable biometric auth:', error);
    }
  }

  static async isBiometricEnabled(): Promise<boolean> {
    try {
      const { value } = await Preferences.get({ key: this.ENABLED_KEY });
      return value === 'true';
    } catch {
      return false;
    }
  }

  static async getStoredCredentials(): Promise<{ userId: string; token: string } | null> {
    try {
      const [tokenResult, userResult, expiryResult] = await Promise.all([
        Preferences.get({ key: this.TOKEN_KEY }),
        Preferences.get({ key: this.USER_KEY }),
        Preferences.get({ key: this.EXPIRY_KEY })
      ]);

      if (!tokenResult.value || !userResult.value || !expiryResult.value) {
        return null;
      }

      const expiryTime = parseInt(expiryResult.value);
      if (Date.now() > expiryTime) {
        // Token expired, clear stored data
        await this.disableBiometricAuth();
        return null;
      }

      return {
        userId: userResult.value,
        token: tokenResult.value
      };
    } catch (error) {
      console.error('Failed to get stored credentials:', error);
      return null;
    }
  }

  static async clearSession(): Promise<void> {
    await this.disableBiometricAuth();
  }
}