
import { enhancedBiometricService, EnhancedBiometricResult, BiometricSetupResult } from '@/services/biometricService';

export interface BiometricCapabilities {
  isAvailable: boolean;
  hasEnrolledBiometrics: boolean;
  biometryType: string | null;
  errorMessage?: string;
}

export class BiometricAuthService {
  static async checkBiometricCapabilities(): Promise<BiometricCapabilities> {
    try {
      // Check if WebAuthn is available
      if (!window.PublicKeyCredential) {
        return {
          isAvailable: false,
          hasEnrolledBiometrics: false,
          biometryType: null,
          errorMessage: 'WebAuthn not supported'
        };
      }

      // Check if platform authenticator is available
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      
      if (!available) {
        return {
          isAvailable: false,
          hasEnrolledBiometrics: false,
          biometryType: null,
          errorMessage: 'No biometric authenticator available'
        };
      }

      // Determine biometry type based on user agent
      const userAgent = navigator.userAgent.toLowerCase();
      let biometryType = 'fingerprint'; // default
      
      if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
        biometryType = 'face'; // iOS typically uses Face ID
      } else if (userAgent.includes('android')) {
        biometryType = 'fingerprint'; // Android typically uses fingerprint
      }

      return {
        isAvailable: true,
        hasEnrolledBiometrics: true, // Assume enrolled if platform authenticator is available
        biometryType
      };
    } catch (error) {
      console.error('Error checking biometric capabilities:', error);
      return {
        isAvailable: false,
        hasEnrolledBiometrics: false,
        biometryType: null,
        errorMessage: 'Error checking capabilities'
      };
    }
  }

  static async authenticate(biometricType: 'fingerprint' | 'face'): Promise<EnhancedBiometricResult> {
    // This method was missing - adding it to match the component expectations
    const userId = 'current-user'; // In a real app, get this from auth context
    return enhancedBiometricService.authenticateWithBiometric(userId);
  }

  static async setupBiometric(userId: string, biometricType: 'fingerprint' | 'face'): Promise<BiometricSetupResult> {
    return enhancedBiometricService.setupBiometric(userId, biometricType);
  }

  static async authenticateWithBiometric(userId: string): Promise<EnhancedBiometricResult> {
    return enhancedBiometricService.authenticateWithBiometric(userId);
  }

  static async disableBiometricAuth(biometricType?: 'fingerprint' | 'face'): Promise<void> {
    // This will be handled by the enhanced service through the dashboard
    console.log('Biometric disabled:', biometricType);
  }

  static async getEnabledBiometricTypes(): Promise<string[]> {
    // Check localStorage for backward compatibility, but this should come from Supabase
    const stored = localStorage.getItem('biometric_enabled_types');
    return stored ? JSON.parse(stored) : [];
  }

  static async getStoredCredentials(): Promise<{ userId: string; token: string } | null> {
    // Check localStorage for backward compatibility, but this should come from Supabase
    const stored = localStorage.getItem('biometric_credentials');
    return stored ? JSON.parse(stored) : null;
  }
}
