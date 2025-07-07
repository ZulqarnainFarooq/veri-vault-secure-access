import React, { useState } from 'react';
import BiometricLogin from '@/components/BiometricLogin';
import SignupForm from '@/components/SignupForm';
import BiometricSetupWizard from '@/components/BiometricSetupWizard';
import Dashboard from '@/components/Dashboard';

type AuthFlow = 'login' | 'signup' | 'biometric-setup' | 'authenticated';

const Index = () => {
  const [currentFlow, setCurrentFlow] = useState<AuthFlow>('login');
  const [userId, setUserId] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');

  const handleLogin = (authUserId: string) => {
    setUserId(authUserId);
    setCurrentFlow('authenticated');
  };

  const handleSignupSuccess = (authUserId: string, email: string) => {
    setUserId(authUserId);
    setUserEmail(email);
    setCurrentFlow('biometric-setup');
  };

  const handleBiometricSetupComplete = () => {
    setCurrentFlow('authenticated');
  };

  const handleSkipBiometricSetup = () => {
    setCurrentFlow('authenticated');
  };

  const handleLogout = () => {
    setCurrentFlow('login');
    setUserId('');
    setUserEmail('');
  };

  const handleSwitchToSignup = () => {
    setCurrentFlow('signup');
  };

  const handleBackToLogin = () => {
    setCurrentFlow('login');
  };

  switch (currentFlow) {
    case 'signup':
      return (
        <SignupForm 
          onSignupSuccess={handleSignupSuccess}
          onBackToLogin={handleBackToLogin}
        />
      );
    
    case 'biometric-setup':
      return (
        <BiometricSetupWizard
          userId={userId}
          userEmail={userEmail}
          onSetupComplete={handleBiometricSetupComplete}
          onSkip={handleSkipBiometricSetup}
        />
      );
    
    case 'authenticated':
      return <Dashboard userId={userId} onLogout={handleLogout} />;
    
    default:
      return (
        <BiometricLogin 
          onLogin={handleLogin}
          onSwitchToSignup={handleSwitchToSignup}
        />
      );
  }
};

export default Index;
