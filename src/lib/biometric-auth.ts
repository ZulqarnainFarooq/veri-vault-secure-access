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

export interface BiometricSetupResult {
  success: boolean;
  error?: string;
  biometricType?: 'fingerprint' | 'face';
}

export type BiometricType = 'fingerprint' | 'face' | 'none';

export class BiometricAuthService {
  private static readonly TOKEN_KEY = 'biometric_token';
  private static readonly USER_KEY = 'biometric_user';
  private static readonly EXPIRY_KEY = 'biometric_expiry';
  private static readonly FINGERPRINT_ENABLED_KEY = 'biometric_fingerprint_enabled';
  private static readonly FACE_ENABLED_KEY = 'biometric_face_enabled';
  private static readonly TYPES_ENROLLED_KEY = 'biometric_types_enrolled';
  private static readonly FAILURE_COUNT_KEY = 'biometric_failures';
  private static readonly LOCKOUT_KEY = 'biometric_lockout';
  private static readonly MAX_FAILURES = 3;
  
  static async authenticate(biometricType: BiometricType): Promise<BiometricAuthResult> {
    try {
      // Check if locked out
      const isLockedOut = await this.isLockedOut();
      if (isLockedOut) {
        return { success: false, error: 'Too many failed attempts. Please use email/password.' };
      }

      const isEnabled = await this.isBiometricTypeEnabled(biometricType);
      if (!isEnabled) {
        return { success: false, error: `${biometricType === 'face' ? 'Face ID' : 'Touch ID'} not enabled` };
      }

      // Simulate biometric prompt based on type
      return new Promise((resolve) => {
        const typeText = biometricType === 'face' ? 'Face ID' : 'Touch ID';
        const instruction = biometricType === 'face' ? 'look at the camera' : 'place your finger on the sensor';
        
        const result = window.confirm(
          `🔐 ${typeText} Authentication\n\nPlease ${instruction} to authenticate.`
        );
        
        setTimeout(async () => {
          if (result) {
            await this.clearFailureCount();
            resolve({ success: true });
          } else {
            await this.incrementFailureCount();
            const failureCount = await this.getFailureCount();
            
            if (failureCount >= this.MAX_FAILURES) {
              await this.setLockout();
              resolve({ 
                success: false, 
                error: 'Too many failed attempts. Account locked for security.' 
              });
            } else {
              resolve({ 
                success: false, 
                error: `Authentication failed. ${this.MAX_FAILURES - failureCount} attempts remaining.` 
              });
            }
          }
        }, 1500);
      });
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  static async setupBiometric(userId: string, biometricType: 'fingerprint' | 'face'): Promise<BiometricSetupResult> {
    try {
      const capabilities = await this.checkBiometricCapabilities();
      
      if (!capabilities.isAvailable || !capabilities.hasEnrolledBiometrics) {
        return { 
          success: false, 
          error: 'Biometric authentication not available on this device' 
        };
      }

      // Simulate biometric enrollment
      return new Promise((resolve) => {
        const typeText = biometricType === 'face' ? 'Face ID' : 'Touch ID';
        const instruction = biometricType === 'face' ? 'look directly at the camera' : 'place your finger on the sensor';
        
        const result = window.confirm(
          `🔐 Setup ${typeText}\n\nPlease ${instruction} to complete setup.`
        );
        
        setTimeout(async () => {
          if (result) {
            const token = `token_${Math.random().toString(36).substr(2, 9)}`;
            const success = await this.enableBiometricAuth(userId, token, biometricType);
            
            if (success) {
              resolve({ success: true, biometricType });
            } else {
              resolve({ success: false, error: 'Failed to save biometric data' });
            }
          } else {
            resolve({ success: false, error: 'Setup cancelled' });
          }
        }, 2000);
      });
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Setup failed' 
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

  static async enableBiometricAuth(userId: string, token: string, biometricType: BiometricType = 'fingerprint'): Promise<boolean> {
    try {
      const expiryTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
      
      // Get current enabled types
      const currentTypes = await this.getEnabledBiometricTypes();
      const updatedTypes = currentTypes.includes(biometricType) ? currentTypes : [...currentTypes, biometricType];
      
      const enabledKey = biometricType === 'face' ? this.FACE_ENABLED_KEY : this.FINGERPRINT_ENABLED_KEY;
      
      await Promise.all([
        Preferences.set({ key: this.TOKEN_KEY, value: token }),
        Preferences.set({ key: this.USER_KEY, value: userId }),
        Preferences.set({ key: this.EXPIRY_KEY, value: expiryTime.toString() }),
        Preferences.set({ key: enabledKey, value: 'true' }),
        Preferences.set({ key: this.TYPES_ENROLLED_KEY, value: JSON.stringify(updatedTypes) })
      ]);
      
      return true;
    } catch (error) {
      console.error('Failed to enable biometric auth:', error);
      return false;
    }
  }

  static async disableBiometricAuth(biometricType?: BiometricType): Promise<void> {
    try {
      if (biometricType) {
        // Disable specific biometric type
        const enabledKey = biometricType === 'face' ? this.FACE_ENABLED_KEY : this.FINGERPRINT_ENABLED_KEY;
        const currentTypes = await this.getEnabledBiometricTypes();
        const updatedTypes = currentTypes.filter(type => type !== biometricType);
        
        await Promise.all([
          Preferences.set({ key: enabledKey, value: 'false' }),
          Preferences.set({ key: this.TYPES_ENROLLED_KEY, value: JSON.stringify(updatedTypes) })
        ]);
        
        // If no biometric types left, clear all data
        if (updatedTypes.length === 0) {
          await this.clearAllBiometricData();
        }
      } else {
        // Disable all biometric authentication
        await this.clearAllBiometricData();
      }
    } catch (error) {
      console.error('Failed to disable biometric auth:', error);
    }
  }

  private static async clearAllBiometricData(): Promise<void> {
    await Promise.all([
      Preferences.remove({ key: this.TOKEN_KEY }),
      Preferences.remove({ key: this.USER_KEY }),
      Preferences.remove({ key: this.EXPIRY_KEY }),
      Preferences.set({ key: this.FINGERPRINT_ENABLED_KEY, value: 'false' }),
      Preferences.set({ key: this.FACE_ENABLED_KEY, value: 'false' }),
      Preferences.set({ key: this.TYPES_ENROLLED_KEY, value: '[]' }),
      this.clearFailureCount(),
      this.clearLockout()
    ]);
  }

  static async isBiometricEnabled(): Promise<boolean> {
    try {
      const types = await this.getEnabledBiometricTypes();
      return types.length > 0;
    } catch {
      return false;
    }
  }

  static async isBiometricTypeEnabled(biometricType: BiometricType): Promise<boolean> {
    try {
      const enabledKey = biometricType === 'face' ? this.FACE_ENABLED_KEY : this.FINGERPRINT_ENABLED_KEY;
      const { value } = await Preferences.get({ key: enabledKey });
      return value === 'true';
    } catch {
      return false;
    }
  }

  static async getEnabledBiometricTypes(): Promise<BiometricType[]> {
    try {
      const { value } = await Preferences.get({ key: this.TYPES_ENROLLED_KEY });
      if (!value) return [];
      
      const types = JSON.parse(value) as BiometricType[];
      return types.filter(type => type !== 'none');
    } catch {
      return [];
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

  static async getBiometricType(): Promise<BiometricType> {
    try {
      const types = await this.getEnabledBiometricTypes();
      return types.length > 0 ? types[0] : 'none';
    } catch {
      return 'none';
    }
  }

  private static async getFailureCount(): Promise<number> {
    try {
      const { value } = await Preferences.get({ key: this.FAILURE_COUNT_KEY });
      return value ? parseInt(value) : 0;
    } catch {
      return 0;
    }
  }

  private static async incrementFailureCount(): Promise<void> {
    try {
      const count = await this.getFailureCount();
      await Preferences.set({ key: this.FAILURE_COUNT_KEY, value: (count + 1).toString() });
    } catch (error) {
      console.error('Failed to increment failure count:', error);
    }
  }

  private static async clearFailureCount(): Promise<void> {
    try {
      await Preferences.remove({ key: this.FAILURE_COUNT_KEY });
    } catch (error) {
      console.error('Failed to clear failure count:', error);
    }
  }

  private static async isLockedOut(): Promise<boolean> {
    try {
      const { value } = await Preferences.get({ key: this.LOCKOUT_KEY });
      if (!value) return false;
      
      const lockoutTime = parseInt(value);
      const now = Date.now();
      const lockoutDuration = 15 * 60 * 1000; // 15 minutes
      
      if (now - lockoutTime > lockoutDuration) {
        await this.clearLockout();
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }

  private static async setLockout(): Promise<void> {
    try {
      await Preferences.set({ key: this.LOCKOUT_KEY, value: Date.now().toString() });
    } catch (error) {
      console.error('Failed to set lockout:', error);
    }
  }

  private static async clearLockout(): Promise<void> {
    try {
      await Promise.all([
        Preferences.remove({ key: this.LOCKOUT_KEY }),
        Preferences.remove({ key: this.FAILURE_COUNT_KEY })
      ]);
    } catch (error) {
      console.error('Failed to clear lockout:', error);
    }
  }
}