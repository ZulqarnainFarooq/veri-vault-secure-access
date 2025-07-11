
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { BiometricAuthService } from '@/lib/biometric-auth';
import { NativeBiometricService } from '@/services/nativeBiometricService';
import { Capacitor } from '@capacitor/core';
import { useToast } from '@/hooks/use-toast';

export interface MobileAuthCapabilities {
  isNativePlatform: boolean;
  biometricAvailable: boolean;
  biometricType: string | null;
  hasStoredCredentials: boolean;
}

export const useMobileAuth = () => {
  const { signIn, signInWithBiometric } = useAuth();
  const { toast } = useToast();
  const [capabilities, setCapabilities] = useState<MobileAuthCapabilities>({
    isNativePlatform: false,
    biometricAvailable: false,
    biometricType: null,
    hasStoredCredentials: false
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkCapabilities();
  }, []);

  const checkCapabilities = async () => {
    try {
      const isNative = Capacitor.isNativePlatform();
      const biometricCaps = await BiometricAuthService.checkBiometricCapabilities();
      const hasCredentials = await BiometricAuthService.hasStoredCredentialsForUser();

      setCapabilities({
        isNativePlatform: isNative,
        biometricAvailable: biometricCaps.isAvailable,
        biometricType: biometricCaps.biometryType,
        hasStoredCredentials: hasCredentials
      });
    } catch (error) {
      console.error('Error checking auth capabilities:', error);
    }
  };

  const authenticateWithBiometric = async (biometricType: 'fingerprint' | 'face') => {
    setLoading(true);
    try {
      const result = await BiometricAuthService.authenticate(biometricType);
      
      if (result.success) {
        if (capabilities.isNativePlatform) {
          // For native platforms, we need to handle the session differently
          // since we're using stored credentials
          const credentials = await NativeBiometricService.getCredentials();
          if (credentials.success && credentials.credentials) {
            const { error } = await signIn(
              credentials.credentials.username,
              credentials.credentials.password
            );
            
            if (error) {
              toast({
                variant: "destructive",
                title: "Authentication Failed",
                description: "Stored credentials are invalid. Please sign in with password.",
              });
              return { success: false, error: error.message };
            }
          }
        } else {
          // For web platforms, use the existing session token approach
          const { error } = await signInWithBiometric(result.sessionToken!);
          if (error) {
            toast({
              variant: "destructive",
              title: "Authentication Failed",
              description: error.message,
            });
            return { success: false, error: error.message };
          }
        }

        toast({
          title: "Authentication Successful",
          description: "You have been authenticated using biometrics.",
        });
        return { success: true };
      } else {
        toast({
          variant: "destructive",
          title: "Biometric Authentication Failed",
          description: result.error || "Please try again or use password.",
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: errorMessage,
      });
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const setupBiometric = async (email: string, password: string, biometricType: 'fingerprint' | 'face') => {
    setLoading(true);
    try {
      // First, authenticate with email/password to get user
      const { error: signInError } = await signIn(email, password);
      if (signInError) {
        return { success: false, error: signInError.message };
      }

      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'No authenticated user' };
      }

      // Setup biometric authentication
      const result = await BiometricAuthService.setupBiometric(user.id, biometricType);
      
      if (result.success) {
        // For native platforms, store the credentials securely
        if (capabilities.isNativePlatform) {
          await NativeBiometricService.setCredentials(email, password);
        }

        await checkCapabilities(); // Refresh capabilities
        
        toast({
          title: "Biometric Setup Complete",
          description: `${biometricType === 'face' ? 'Face ID' : 'Fingerprint'} authentication is now enabled.`,
        });
        return { success: true };
      } else {
        toast({
          variant: "destructive",
          title: "Biometric Setup Failed",
          description: result.error || "Failed to setup biometric authentication.",
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Setup failed';
      toast({
        variant: "destructive",
        title: "Setup Error",
        description: errorMessage,
      });
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    capabilities,
    loading,
    authenticateWithBiometric,
    setupBiometric,
    refreshCapabilities: checkCapabilities
  };
};
