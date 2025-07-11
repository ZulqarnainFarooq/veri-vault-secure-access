
import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { BiometricAuthService } from '@/lib/biometric-auth';
import { supabase } from '@/integrations/supabase/client';

export interface MobileAuthState {
  isNativePlatform: boolean;
  deviceInfo: any;
  biometricCapabilities: {
    isAvailable: boolean;
    hasEnrolledBiometrics: boolean;
    biometryType: string | null;
    errorMessage?: string;
  } | null;
  isLoading: boolean;
  error: string | null;
}

export interface MobileAuthActions {
  checkBiometricCapabilities: () => Promise<void>;
  authenticateWithBiometric: (biometricType: 'fingerprint' | 'face') => Promise<boolean>;
  setupBiometric: (userId: string, biometricType: 'fingerprint' | 'face') => Promise<boolean>;
  disableBiometric: (biometricType?: 'fingerprint' | 'face') => Promise<void>;
  refreshDeviceInfo: () => Promise<void>;
}

export function useMobileAuth(): MobileAuthState & MobileAuthActions {
  const [state, setState] = useState<MobileAuthState>({
    isNativePlatform: false,
    deviceInfo: null,
    biometricCapabilities: null,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    initializeMobileAuth();
  }, []);

  const initializeMobileAuth = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const isNative = Capacitor.isNativePlatform();
      const deviceInfo = await Device.getInfo();
      
      setState(prev => ({
        ...prev,
        isNativePlatform: isNative,
        deviceInfo
      }));

      // Check biometric capabilities
      await checkBiometricCapabilities();
    } catch (error) {
      console.error('Error initializing mobile auth:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to initialize mobile authentication',
        isLoading: false
      }));
    }
  };

  const checkBiometricCapabilities = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const capabilities = await BiometricAuthService.checkBiometricCapabilities();
      
      setState(prev => ({
        ...prev,
        biometricCapabilities: capabilities,
        isLoading: false
      }));
    } catch (error) {
      console.error('Error checking biometric capabilities:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to check biometric capabilities',
        isLoading: false
      }));
    }
  };

  const authenticateWithBiometric = async (biometricType: 'fingerprint' | 'face'): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const result = await BiometricAuthService.authenticate(biometricType);
      
      setState(prev => ({ ...prev, isLoading: false }));
      
      if (!result.success) {
        setState(prev => ({ ...prev, error: result.error || 'Authentication failed' }));
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error authenticating with biometric:', error);
      setState(prev => ({
        ...prev,
        error: 'Biometric authentication failed',
        isLoading: false
      }));
      return false;
    }
  };

  const setupBiometric = async (userId: string, biometricType: 'fingerprint' | 'face'): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const result = await BiometricAuthService.setupBiometric(userId, biometricType);
      
      setState(prev => ({ ...prev, isLoading: false }));
      
      if (!result.success) {
        setState(prev => ({ ...prev, error: result.error || 'Setup failed' }));
        return false;
      }
      
      // Refresh capabilities after successful setup
      await checkBiometricCapabilities();
      
      return true;
    } catch (error) {
      console.error('Error setting up biometric:', error);
      setState(prev => ({
        ...prev,
        error: 'Biometric setup failed',
        isLoading: false
      }));
      return false;
    }
  };

  const disableBiometric = async (biometricType?: 'fingerprint' | 'face') => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      await BiometricAuthService.disableBiometricAuth(biometricType);
      
      // Refresh capabilities after disabling
      await checkBiometricCapabilities();
      
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      console.error('Error disabling biometric:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to disable biometric',
        isLoading: false
      }));
    }
  };

  const refreshDeviceInfo = async () => {
    try {
      const deviceInfo = await Device.getInfo();
      setState(prev => ({ ...prev, deviceInfo }));
    } catch (error) {
      console.error('Error refreshing device info:', error);
    }
  };

  return {
    ...state,
    checkBiometricCapabilities,
    authenticateWithBiometric,
    setupBiometric,
    disableBiometric,
    refreshDeviceInfo
  };
}
