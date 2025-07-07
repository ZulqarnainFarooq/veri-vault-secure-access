import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Fingerprint, Eye } from 'lucide-react';
import { BiometricAuthService, BiometricCapabilities } from '@/lib/biometric-auth';
import { useToast } from '@/hooks/use-toast';

interface BiometricButtonProps {
  onSuccess: () => void;
  onError: (error: string) => void;
  disabled?: boolean;
  capabilities?: BiometricCapabilities;
}

const BiometricButton: React.FC<BiometricButtonProps> = ({
  onSuccess,
  onError,
  disabled = false,
  capabilities
}) => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { toast } = useToast();

  const handleBiometricAuth = async () => {
    if (isAuthenticating || disabled) return;

    setIsAuthenticating(true);
    
    try {
      const biometricType = capabilities?.biometryType === 'face' ? 'face' : 'fingerprint';
      const result = await BiometricAuthService.authenticate(biometricType);
      
      if (result.success) {
        toast({
          title: "Authentication Successful",
          description: "You have been authenticated using biometrics.",
        });
        onSuccess();
      } else {
        toast({
          variant: "destructive",
          title: "Authentication Failed",
          description: result.error || "Biometric authentication failed",
        });
        onError(result.error || 'Authentication failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: errorMessage,
      });
      onError(errorMessage);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const getBiometricIcon = () => {
    if (capabilities?.biometryType === 'face') {
      return <Eye className="h-8 w-8" />;
    }
    return <Fingerprint className="h-8 w-8" />;
  };

  const getBiometricLabel = () => {
    if (capabilities?.biometryType === 'face') {
      return isAuthenticating ? 'Scanning Face...' : 'Face ID';
    }
    return isAuthenticating ? 'Scanning Fingerprint...' : 'Touch ID';
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <Button
        variant="biometric"
        size="biometric"
        onClick={handleBiometricAuth}
        disabled={disabled || isAuthenticating}
        className={`
          relative overflow-hidden
          ${isAuthenticating ? 'animate-pulse-security' : ''}
        `}
      >
        {getBiometricIcon()}
        {isAuthenticating && (
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-biometric-glow/20 to-transparent animate-scan-line" />
        )}
      </Button>
      
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">
          {getBiometricLabel()}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {isAuthenticating ? 'Please wait...' : 'Tap to authenticate'}
        </p>
      </div>
    </div>
  );
};

export default BiometricButton;