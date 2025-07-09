import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import BiometricLogin from '@/components/BiometricLogin';
import SignupForm from '@/components/SignupForm';
import BiometricSetupWizard from '@/components/BiometricSetupWizard';
import Dashboard from '@/components/Dashboard';
import { Card } from '@/components/ui/card';
import { Shield } from 'lucide-react';

type AuthFlow = 'login' | 'signup' | 'biometric-setup';

const Index = () => {
  const { user, userProfile, loading } = useAuth();
  const [currentFlow, setCurrentFlow] = useState<AuthFlow>('login');
  const [needsBiometricSetup, setNeedsBiometricSetup] = useState(false);

  useEffect(() => {
    // Check if user needs biometric setup after registration
    if (user && userProfile && !userProfile.biometric_enabled) {
      const isNewUser = new Date(userProfile.created_at) > new Date(Date.now() - 5 * 60 * 1000); // 5 minutes
      if (isNewUser) {
        setNeedsBiometricSetup(true);
        setCurrentFlow('biometric-setup');
      }
    }
  }, [user, userProfile]);

  const handleSignupSuccess = () => {
    // After signup, user will be automatically logged in via auth state change
    setNeedsBiometricSetup(true);
    setCurrentFlow('biometric-setup');
  };

  const handleBiometricSetupComplete = () => {
    setNeedsBiometricSetup(false);
  };

  const handleSkipBiometricSetup = () => {
    setNeedsBiometricSetup(false);
  };

  const handleSwitchToSignup = () => {
    setCurrentFlow('signup');
  };

  const handleBackToLogin = () => {
    setCurrentFlow('login');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-surface flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-0 bg-card/95 backdrop-blur-sm p-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="p-3 bg-gradient-security rounded-full animate-pulse">
              <Shield className="h-8 w-8 text-primary-foreground" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-semibold">Loading VeriVault...</h2>
              <p className="text-muted-foreground">Initializing secure authentication</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // If user is authenticated and doesn't need biometric setup, show dashboard
  if (user && !needsBiometricSetup) {
    return <Dashboard />;
  }

  // If user needs biometric setup, show wizard
  if (user && needsBiometricSetup && currentFlow === 'biometric-setup') {
    return (
      <BiometricSetupWizard
        onSetupComplete={handleBiometricSetupComplete}
        onSkip={handleSkipBiometricSetup}
      />
    );
  }

  // Show appropriate auth flow for non-authenticated users
  switch (currentFlow) {
    case 'signup':
      return (
        <SignupForm 
          onSignupSuccess={handleSignupSuccess}
          onBackToLogin={handleBackToLogin}
        />
      );
    
    default:
      return (
        <BiometricLogin 
          onSwitchToSignup={handleSwitchToSignup}
        />
      );
  }
};

export default Index;
