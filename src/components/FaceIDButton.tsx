import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { BiometricAuthService } from '@/lib/biometric-auth';

interface FaceIDButtonProps {
  onSuccess: () => void;
  onError: (error: string) => void;
}

const FaceIDButton: React.FC<FaceIDButtonProps> = ({ onSuccess, onError }) => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleAuthenticate = async () => {
    setIsAuthenticating(true);
    
    try {
      const result = await BiometricAuthService.authenticate('face');
      
      if (result.success) {
        onSuccess();
      } else {
        onError(result.error || 'Face ID authentication failed');
      }
    } catch (error) {
      onError('Face ID authentication error');
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
      <Eye className={`h-8 w-8 ${isAuthenticating ? 'animate-pulse' : ''}`} />
      <span className="text-sm">
        {isAuthenticating ? 'Authenticating...' : 'Login with Face ID'}
      </span>
    </Button>
  );
};

export default FaceIDButton;