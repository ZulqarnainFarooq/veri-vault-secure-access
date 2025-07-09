
import { enhancedBiometricService, EnhancedBiometricResult, BiometricSetupResult } from '@/services/biometricService';
import { supabase } from '@/integrations/supabase/client';

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
    try {
      // Get current user from Supabase
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return {
          success: false,
          error: 'No authenticated user',
          requiresFallback: true
        };
      }

      return enhancedBiometricService.authenticateWithBiometric(user.id);
    } catch (error) {
      console.error('Authentication error:', error);
      return {
        success: false,
        error: 'Authentication failed',
        requiresFallback: true
      };
    }
  }

  static async setupBiometric(userId: string, biometricType: 'fingerprint' | 'face'): Promise<BiometricSetupResult> {
    return enhancedBiometricService.setupBiometric(userId, biometricType);
  }

  static async authenticateWithBiometric(userId: string): Promise<EnhancedBiometricResult> {
    return enhancedBiometricService.authenticateWithBiometric(userId);
  }

  static async disableBiometricAuth(biometricType?: 'fingerprint' | 'face'): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No authenticated user');
        return;
      }

      await enhancedBiometricService.disableBiometric(user.id, biometricType);
    } catch (error) {
      console.error('Error disabling biometric:', error);
    }
  }

  static async getEnabledBiometricTypes(): Promise<string[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return [];
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('fingerprint_enabled, face_id_enabled')
        .eq('id', user.id)
        .single();

      if (!profile) {
        return [];
      }

      const types: string[] = [];
      if (profile.fingerprint_enabled) types.push('fingerprint');
      if (profile.face_id_enabled) types.push('face');
      
      return types;
    } catch (error) {
      console.error('Error getting enabled biometric types:', error);
      return [];
    }
  }

  static async getStoredCredentials(): Promise<{ userId: string; token: string } | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return null;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('biometric_token')
        .eq('id', user.id)
        .single();

      if (!profile?.biometric_token) {
        return null;
      }

      return {
        userId: user.id,
        token: profile.biometric_token
      };
    } catch (error) {
      console.error('Error getting stored credentials:', error);
      return null;
    }
  }

  static async hasStoredCredentialsForUser(): Promise<boolean> {
    try {
      const credentials = await this.getStoredCredentials();
      return !!credentials;
    } catch (error) {
      console.error('Error checking stored credentials:', error);
      return false;
    }
  }
}
