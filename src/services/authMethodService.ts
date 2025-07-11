
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
      console.log('Checking auth methods for email:', email);
      
      // Use the new database function that bypasses RLS
      const { data, error } = await supabase.rpc('check_auth_methods_for_email', {
        user_email: email
      });

      console.log('Database function response:', { data, error });

      if (error) {
        console.error('Database function error:', error);
        // Provide fallback - assume password login is available
        return {
          hasPassword: true,
          hasBiometric: false,
          biometricTypes: []
        };
      }

      // If no data returned, user doesn't exist
      if (!data || data.length === 0) {
        console.log('No user found for email:', email);
        return {
          hasPassword: false,
          hasBiometric: false,
          biometricTypes: []
        };
      }

      const userAuth = data[0];
      console.log('User auth data:', userAuth);

      return {
        hasPassword: userAuth.has_password,
        hasBiometric: userAuth.has_biometric,
        biometricTypes: userAuth.biometric_types || [],
        userId: userAuth.user_id
      };
    } catch (error) {
      console.error('Error checking auth methods:', error);
      // Provide fallback - assume password login is available
      return {
        hasPassword: true,
        hasBiometric: false,
        biometricTypes: []
      };
    }
  }
}
