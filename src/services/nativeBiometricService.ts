
import { NativeBiometric, BiometryType } from '@capacitor-community/native-biometric';
import { Capacitor } from '@capacitor/core';

export interface NativeBiometricCapabilities {
  isAvailable: boolean;
  biometryType: BiometryType | null;
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

      const result = await NativeBiometric.isAvailable();
      
      if (result.isAvailable) {
        return {
          isAvailable: true,
          biometryType: result.biometryType,
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

      await NativeBiometric.setCredentials({
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

      const result = await NativeBiometric.getCredentials({
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

      await NativeBiometric.deleteCredentials({
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

      await NativeBiometric.verifyIdentity({
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
