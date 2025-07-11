
import { enhancedBiometricService, EnhancedBiometricResult, BiometricSetupResult } from '@/services/biometricService';
import { NativeBiometricService, NativeBiometricCapabilities } from '@/services/nativeBiometricService';
import { supabase } from '@/integrations/supabase/client';
import { Device } from '@capacitor/device';
import { Capacitor } from '@capacitor/core';

export interface BiometricCapabilities {
  isAvailable: boolean;
  hasEnrolledBiometrics: boolean;
  biometryType: string | null;
  errorMessage?: string;
}

export class BiometricAuthService {
  static async checkBiometricCapabilities(): Promise<BiometricCapabilities> {
    try {
      // Check if we're running on a native platform
      if (Capacitor.isNativePlatform()) {
        const nativeCapabilities = await NativeBiometricService.checkAvailability();
        
        return {
          isAvailable: nativeCapabilities.isAvailable,
          hasEnrolledBiometrics: nativeCapabilities.isAvailable,
          biometryType: nativeCapabilities.biometryType || null,
          errorMessage: nativeCapabilities.errorMessage
        };
      }

      // Fallback to web implementation for non-native platforms
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
        biometryType = 'face'; // Modern iOS devices primarily use Face ID
      } else if (deviceInfo.platform === 'android') {
        biometryType = 'fingerprint';
      }

      return {
        isAvailable: true,
        hasEnrolledBiometrics: true,
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

      // Use native biometric service on mobile platforms
      if (Capacitor.isNativePlatform()) {
        console.log('Using native biometric authentication');
        
        const credentialsResult = await NativeBiometricService.getCredentials();
        
        if (credentialsResult.success && credentialsResult.credentials) {
          // Update last biometric login
          await supabase
            .from('profiles')
            .update({ last_biometric_login: new Date().toISOString() })
            .eq('id', user.id);

          return {
            success: true,
            sessionToken: 'native-biometric-success'
          };
        } else {
          return {
            success: false,
            error: credentialsResult.error || 'Native biometric authentication failed',
            requiresFallback: true
          };
        }
      } else {
        // Fallback to enhanced biometric service for web
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

  static async authenticateWithEmail(email: string, biometricType: 'fingerprint' | 'face'): Promise<EnhancedBiometricResult> {
    try {
      // Use native biometric service on mobile platforms
      if (Capacitor.isNativePlatform()) {
        console.log('Using native biometric authentication for email:', email);
        
        const credentialsResult = await NativeBiometricService.getCredentials();
        
        if (credentialsResult.success && credentialsResult.credentials) {
          // Verify the stored email matches
          if (credentialsResult.credentials.username === email) {
            // Get user profile by email
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('id')
              .eq('email', email)
              .maybeSingle();

            if (error || !profile) {
              return {
                success: false,
                error: 'User not found',
                requiresFallback: true
              };
            }

            // Update last biometric login
            await supabase
              .from('profiles')
              .update({ last_biometric_login: new Date().toISOString() })
              .eq('id', profile.id);

            return {
              success: true,
              sessionToken: 'native-biometric-success'
            };
          } else {
            return {
              success: false,
              error: 'Stored credentials do not match this email',
              requiresFallback: true
            };
          }
        } else {
          return {
            success: false,
            error: credentialsResult.error || 'Native biometric authentication failed',
            requiresFallback: true
          };
        }
      } else {
        // Fallback to enhanced biometric service for web
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id, biometric_token, device_id, biometric_failures, biometric_locked_until')
          .eq('email', email)
          .maybeSingle();

        if (error || !profile) {
          return {
            success: false,
            error: 'User not found or biometric not set up',
            requiresFallback: true
          };
        }

        if (!profile.biometric_token) {
          return {
            success: false,
            error: 'Biometric not set up for this user',
            requiresFallback: true
          };
        }

        // Check if account is temporarily locked
        if (profile.biometric_locked_until && new Date(profile.biometric_locked_until) > new Date()) {
          return { 
            success: false, 
            error: 'Biometric authentication temporarily locked', 
            requiresFallback: true 
          };
        }

        const result = await enhancedBiometricService.authenticateWithBiometric(profile.id);
        
        if (result.success) {
          // Update last biometric login
          await supabase
            .from('profiles')
            .update({ last_biometric_login: new Date().toISOString() })
            .eq('id', profile.id);
        }
        
        return result;
      }
    } catch (error) {
      console.error('Email-based biometric authentication error:', error);
      return {
        success: false,
        error: 'Authentication failed',
        requiresFallback: true
      };
    }
  }

  private static generateSecureToken(): string {
    try {
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      // Fallback for environments where crypto is not available
      return Math.random().toString(36).substring(2, 34);
    }
  }

  static async setupBiometric(userId: string, biometricType: 'fingerprint' | 'face'): Promise<BiometricSetupResult> {
    try {
      // Use native biometric service on mobile platforms
      if (Capacitor.isNativePlatform()) {
        console.log('Setting up native biometric authentication');
        
        // Get user profile to get email
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', userId)
          .single();

        if (profileError || !profile) {
          return {
            success: false,
            error: 'User profile not found'
          };
        }

        // For native setup, we'll store the user's email as username
        // In a real implementation, you might want to store an encrypted token instead
        const setupResult = await NativeBiometricService.setCredentials(
          profile.email,
          'biometric-token-' + userId
        );

        if (setupResult.success) {
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

          return {
            success: true,
            biometricToken: 'native-biometric-setup'
          };
        } else {
          return {
            success: false,
            error: setupResult.error
          };
        }
      } else {
        // Fallback to enhanced biometric service for web
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

      // Delete native credentials if on mobile
      if (Capacitor.isNativePlatform()) {
        await NativeBiometricService.deleteCredentials();
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
      // Check native credentials first on mobile
      if (Capacitor.isNativePlatform()) {
        const credentialsResult = await NativeBiometricService.getCredentials();
        if (credentialsResult.success && credentialsResult.credentials) {
          return {
            userId: credentialsResult.credentials.username,
            token: credentialsResult.credentials.password
          };
        }
      }

      // Fallback to Supabase credentials
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
