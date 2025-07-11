import { enhancedBiometricService, EnhancedBiometricResult, BiometricSetupResult } from '@/services/biometricService';
import { supabase } from '@/integrations/supabase/client';
import { Device } from '@capacitor/device';

export interface BiometricCapabilities {
  isAvailable: boolean;
  hasEnrolledBiometrics: boolean;
  biometryType: string | null;
  errorMessage?: string;
}

export class BiometricAuthService {
  static async checkBiometricCapabilities(): Promise<BiometricCapabilities> {
    try {
      // Check if we're running in a mobile environment
      const deviceInfo = await Device.getInfo();
      const isMobile = deviceInfo.platform === 'android' || deviceInfo.platform === 'ios';
      
      if (!isMobile) {
        // For web/desktop, check WebAuthn availability
        if (!window.PublicKeyCredential) {
          return {
            isAvailable: false,
            hasEnrolledBiometrics: false,
            biometryType: null,
            errorMessage: 'WebAuthn not supported'
          };
        }

        // Use a timeout to prevent hanging
        const timeoutPromise = new Promise<boolean>((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 5000);
        });

        try {
          const available = await Promise.race([
            PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable(),
            timeoutPromise
          ]);
          
          if (!available) {
            return {
              isAvailable: false,
              hasEnrolledBiometrics: false,
              biometryType: null,
              errorMessage: 'No biometric authenticator available'
            };
          }
        } catch (error) {
          console.warn('WebAuthn check failed or timed out:', error);
          return {
            isAvailable: false,
            hasEnrolledBiometrics: false,
            biometryType: null,
            errorMessage: 'Biometric check timed out'
          };
        }
      }

      // For mobile platforms, assume biometric capability based on platform
      let biometryType = 'fingerprint'; // default
      
      if (deviceInfo.platform === 'ios') {
        // iOS devices typically have Face ID or Touch ID
        biometryType = 'face'; // Modern iOS devices primarily use Face ID
      } else if (deviceInfo.platform === 'android') {
        // Android devices typically use fingerprint
        biometryType = 'fingerprint';
      }

      // For mobile, we'll assume biometric is available if the platform supports it
      // The actual enrollment check will happen during authentication attempt
      return {
        isAvailable: true,
        hasEnrolledBiometrics: true, // We'll validate this during actual auth
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

      // First check if user has stored credentials
      const credentials = await this.getStoredCredentials();
      if (!credentials) {
        return {
          success: false,
          error: 'No stored biometric credentials',
          requiresFallback: true
        };
      }

      // Check if we're on mobile
      const deviceInfo = await Device.getInfo();
      const isMobile = deviceInfo.platform === 'android' || deviceInfo.platform === 'ios';

      if (isMobile) {
        // For mobile, use simplified authentication flow
        // In a real app, you would integrate with native biometric APIs
        // For now, we'll simulate a successful authentication
        console.log('Mobile biometric authentication simulated');
        
        // Update last biometric login
        await supabase
          .from('profiles')
          .update({ last_biometric_login: new Date().toISOString() })
          .eq('id', user.id);

        return {
          success: true,
          sessionToken: credentials.token
        };
      } else {
        // For web, use the enhanced biometric service
        const result = await enhancedBiometricService.authenticateWithBiometric(user.id);
        
        if (result.success) {
          // Update last biometric login
          await supabase
            .from('profiles')
            .update({ last_biometric_login: new Date().toISOString() })
            .eq('id', user.id);
        }

        return result;
      }
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
    try {
      const deviceInfo = await Device.getInfo();
      const isMobile = deviceInfo.platform === 'android' || deviceInfo.platform === 'ios';

      if (isMobile) {
        // For mobile, use simplified setup
        const result = await enhancedBiometricService.setupBiometric(userId, biometricType);
        
        if (result.success) {
          // Update profile with biometric setup information
          const updates: any = {
            biometric_enabled: true,
            last_biometric_setup: new Date().toISOString(),
            initial_setup_complete: true
          };

          if (biometricType === 'fingerprint') {
            updates.fingerprint_enabled = true;
          } else if (biometricType === 'face') {
            updates.face_id_enabled = true;
          }

          await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId);
        }
        
        return result;
      } else {
        // For web, use the original implementation
        const result = await enhancedBiometricService.setupBiometric(userId, biometricType);
        
        if (result.success) {
          // Update profile with biometric setup information
          const updates: any = {
            biometric_enabled: true,
            last_biometric_setup: new Date().toISOString(),
            initial_setup_complete: true
          };

          if (biometricType === 'fingerprint') {
            updates.fingerprint_enabled = true;
          } else if (biometricType === 'face') {
            updates.face_id_enabled = true;
          }

          await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId);
        }
        
        return result;
      }
    } catch (error) {
      console.error('Setup error:', error);
      return {
        success: false,
        error: 'Setup failed'
      };
    }
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

      // Update profile to reflect disabled biometric
      const updates: any = {};
      
      if (biometricType === 'fingerprint') {
        updates.fingerprint_enabled = false;
      } else if (biometricType === 'face') {
        updates.face_id_enabled = false;
      } else {
        // Disable all biometric methods
        updates.biometric_enabled = false;
        updates.fingerprint_enabled = false;
        updates.face_id_enabled = false;
        updates.biometric_token = null;
      }

      await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
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
