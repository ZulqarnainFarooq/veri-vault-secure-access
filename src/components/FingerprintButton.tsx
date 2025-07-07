import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Fingerprint } from 'lucide-react';
import { BiometricAuthService } from '@/lib/biometric-auth';

interface FingerprintButtonProps {
  onSuccess: () => void;
  onError: (error: string) => void;
}

const FingerprintButton: React.FC<FingerprintButtonProps> = ({ onSuccess, onError }) => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleAuthenticate = async () => {
    setIsAuthenticating(true);
    
    try {
      const result = await BiometricAuthService.authenticate('fingerprint');
      
      if (result.success) {
        onSuccess();
      } else {
        onError(result.error || 'Fingerprint authentication failed');
      }
    } catch (error) {
      onError('Fingerprint authentication error');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <Button
      variant="biometric"
      size="biometric"
      onClick={handleAuthenticate}
      disabled={isAuthenticating}
      className="flex flex-col items-center justify-center space-y-2 w-full h-20"
    >
      <Fingerprint className={`h-8 w-8 ${isAuthenticating ? 'animate-pulse' : ''}`} />
      <span className="text-sm">
        {isAuthenticating ? 'Authenticating...' : 'Login with Touch ID'}
      </span>
    </Button>
  );
};

export default FingerprintButton;