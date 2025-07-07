import React, { useState } from 'react';
import BiometricLogin from '@/components/BiometricLogin';
import Dashboard from '@/components/Dashboard';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string>('');

  const handleLogin = (authUserId: string) => {
    setUserId(authUserId);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserId('');
  };

  if (isAuthenticated) {
    return <Dashboard userId={userId} onLogout={handleLogout} />;
  }

  return <BiometricLogin onLogin={handleLogin} />;
};

export default Index;
