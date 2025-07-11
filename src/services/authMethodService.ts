
import { supabase } from '@/integrations/supabase/client';

export interface AuthMethods {
  hasPassword: boolean;
  hasBiometric: boolean;
  biometricTypes: string[];
  userId?: string;
}

export class AuthMethodService {
  static async checkAuthMethodsForEmail(email: string): Promise<AuthMethods> {
    try {
      // First check if user exists by attempting to get profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, biometric_enabled, fingerprint_enabled, face_id_enabled')
        .eq('email', email)
        .maybeSingle();

      if (error || !profile) {
        return {
          hasPassword: false,
          hasBiometric: false,
          biometricTypes: []
        };
      }

      const biometricTypes: string[] = [];
      if (profile.fingerprint_enabled) biometricTypes.push('fingerprint');
      if (profile.face_id_enabled) biometricTypes.push('face');

      return {
        hasPassword: true, // Assume password exists if profile exists
        hasBiometric: profile.biometric_enabled && biometricTypes.length > 0,
        biometricTypes,
        userId: profile.id
      };
    } catch (error) {
      console.error('Error checking auth methods:', error);
      return {
        hasPassword: false,
        hasBiometric: false,
        biometricTypes: []
      };
    }
  }
}
