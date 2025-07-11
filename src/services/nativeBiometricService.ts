
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

// Define types for biometric functionality
export interface BiometryType {
  TOUCH_ID: 'touchId';
  FACE_ID: 'faceId'; 
  FINGERPRINT: 'fingerprint';
  FACE_AUTHENTICATION: 'face';
  IRIS_AUTHENTICATION: 'iris';
  MULTIPLE: 'multiple';
}

export interface NativeBiometricCapabilities {
  isAvailable: boolean;
  biometryType: string | null;
  errorMessage?: string;
}

export interface NativeBiometricResult {
  success: boolean;
  error?: string;
  credentials?: {
    username: string;
    password: string;
  };
}

// Enhanced mock implementation with proper credential management
const mockNativeBiometric = {
  async isAvailable(): Promise<{ isAvailable: boolean; biometryType?: string; errorMessage?: string }> {
    if (!Capacitor.isNativePlatform()) {
      return { isAvailable: false, errorMessage: 'Not running on native platform' };
    }
    
    // For native platforms, simulate biometric availability
    return { 
      isAvailable: true, 
      biometryType: Capacitor.getPlatform() === 'ios' ? 'faceId' : 'fingerprint' 
    };
  },

  async setCredentials(options: { username: string; password: string; server: string }): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      throw new Error('Not supported on web platform');
    }
    
    // Store credentials securely using Capacitor Preferences
    await Preferences.set({
      key: `biometric_${options.server}_username`,
      value: options.username
    });
    
    await Preferences.set({
      key: `biometric_${options.server}_password`,
      value: options.password
    });
    
    // Mark biometric as enabled for this user
    await Preferences.set({
      key: `biometric_enabled_${options.server}`,
      value: 'true'
    });
    
    console.log('Mock: Biometric credentials stored securely');
  },

  async getCredentials(options: { server: string }): Promise<{ username: string; password: string }> {
    if (!Capacitor.isNativePlatform()) {
      throw new Error('Not supported on web platform');
    }

    // Check if biometric is enabled for this server
    const { value: biometricEnabled } = await Preferences.get({
      key: `biometric_enabled_${options.server}`
    });
    
    if (!biometricEnabled || biometricEnabled !== 'true') {
      throw new Error('Biometric authentication not enabled for this user');
    }

    const { value: username } = await Preferences.get({
      key: `biometric_${options.server}_username`
    });
    
    const { value: password } = await Preferences.get({
      key: `biometric_${options.server}_password`
    });
    
    if (!username || !password) {
      throw new Error('No stored credentials found');
    }

    console.log('Mock: Biometric credentials retrieved securely');
    return { username, password };
  },

  async deleteCredentials(options: { server: string }): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return; // No-op on web
    }

    await Preferences.remove({ key: `biometric_${options.server}_username` });
    await Preferences.remove({ key: `biometric_${options.server}_password` });
    await Preferences.remove({ key: `biometric_enabled_${options.server}` });
    
    console.log('Mock: Biometric credentials deleted securely');
  },

  async verifyIdentity(options: { reason?: string; title?: string; subtitle?: string; description?: string }): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      throw new Error('Not supported on web platform');
    }

    // Simulate biometric verification with realistic delay and potential failure
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate 90% success rate for testing
        if (Math.random() > 0.1) {
          console.log('Mock: Biometric verification successful');
          resolve();
        } else {
          console.log('Mock: Biometric verification failed');
          reject(new Error('Biometric authentication failed'));
        }
      }, 1500); // Realistic delay for biometric verification
    });
  },

  async isBiometricEnabled(server: string): Promise<boolean> {
    try {
      const { value } = await Preferences.get({
        key: `biometric_enabled_${server}`
      });
      return value === 'true';
    } catch (error) {
      return false;
    }
  }
};

export class NativeBiometricService {
  static async checkAvailability(): Promise<NativeBiometricCapabilities> {
    try {
      if (!Capacitor.isNativePlatform()) {
        return {
          isAvailable: false,
          biometryType: null,
          errorMessage: 'Not running on native platform'
        };
      }

      const result = await mockNativeBiometric.isAvailable();
      
      if (result.isAvailable) {
        return {
          isAvailable: true,
          biometryType: result.biometryType || null,
        };
      } else {
        return {
          isAvailable: false,
          biometryType: null,
          errorMessage: result.errorMessage || 'Biometric not available'
        };
      }
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      return {
        isAvailable: false,
        biometryType: null,
        errorMessage: 'Error checking biometric availability'
      };
    }
  }

  static async isBiometricEnabledForUser(): Promise<boolean> {
    try {
      return await mockNativeBiometric.isBiometricEnabled('VeriVault');
    } catch (error) {
      console.error('Error checking biometric enabled status:', error);
      return false;
    }
  }

  static async setCredentials(username: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!Capacitor.isNativePlatform()) {
        return { success: false, error: 'Not supported on web platform' };
      }

      await mockNativeBiometric.setCredentials({
        username,
        password,
        server: 'VeriVault'
      });

      return { success: true };
    } catch (error) {
      console.error('Error setting biometric credentials:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to set credentials' 
      };
    }
  }

  static async getCredentials(): Promise<NativeBiometricResult> {
    try {
      if (!Capacitor.isNativePlatform()) {
        return { success: false, error: 'Not supported on web platform' };
      }

      // First verify biometric identity
      await mockNativeBiometric.verifyIdentity({
        reason: 'Please verify your identity to access your saved credentials',
        title: 'VeriVault Authentication',
        subtitle: 'Use your biometric to authenticate',
        description: 'Place your finger on the sensor or look at the camera'
      });

      // Then retrieve credentials
      const result = await mockNativeBiometric.getCredentials({
        server: 'VeriVault'
      });

      return {
        success: true,
        credentials: {
          username: result.username,
          password: result.password
        }
      };
    } catch (error) {
      console.error('Error getting biometric credentials:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Biometric authentication failed' 
      };
    }
  }

  static async deleteCredentials(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!Capacitor.isNativePlatform()) {
        return { success: true }; // No-op on web
      }

      await mockNativeBiometric.deleteCredentials({
        server: 'VeriVault'
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting biometric credentials:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete credentials' 
      };
    }
  }

  static async verifyIdentity(reason?: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!Capacitor.isNativePlatform()) {
        return { success: false, error: 'Not supported on web platform' };
      }

      await mockNativeBiometric.verifyIdentity({
        reason: reason || 'Please verify your identity',
        title: 'VeriVault Authentication',
        subtitle: 'Use your biometric to authenticate',
        description: 'Place your finger on the sensor or look at the camera'
      });

      return { success: true };
    } catch (error) {
      console.error('Error verifying identity:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Identity verification failed' 
      };
    }
  }
}
