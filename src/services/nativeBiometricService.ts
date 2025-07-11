
import { Capacitor } from '@capacitor/core';

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

// Mock implementation for development and web platforms
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
    
    // Store credentials in local storage as fallback for development
    localStorage.setItem(`biometric_${options.server}_username`, options.username);
    localStorage.setItem(`biometric_${options.server}_password`, options.password);
    console.log('Mock: Biometric credentials stored');
  },

  async getCredentials(options: { server: string }): Promise<{ username: string; password: string }> {
    if (!Capacitor.isNativePlatform()) {
      throw new Error('Not supported on web platform');
    }

    const username = localStorage.getItem(`biometric_${options.server}_username`);
    const password = localStorage.getItem(`biometric_${options.server}_password`);
    
    if (!username || !password) {
      throw new Error('No stored credentials found');
    }

    console.log('Mock: Biometric credentials retrieved');
    return { username, password };
  },

  async deleteCredentials(options: { server: string }): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return; // No-op on web
    }

    localStorage.removeItem(`biometric_${options.server}_username`);
    localStorage.removeItem(`biometric_${options.server}_password`);
    console.log('Mock: Biometric credentials deleted');
  },

  async verifyIdentity(options: { reason?: string; title?: string; subtitle?: string; description?: string }): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      throw new Error('Not supported on web platform');
    }

    // For development, simulate successful verification
    console.log('Mock: Biometric verification successful');
    return Promise.resolve();
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
