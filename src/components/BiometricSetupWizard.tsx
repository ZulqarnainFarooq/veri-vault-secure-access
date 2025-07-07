import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Fingerprint, Eye, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { BiometricAuthService, BiometricCapabilities } from '@/lib/biometric-auth';
import { useToast } from '@/hooks/use-toast';

interface BiometricSetupWizardProps {
  userId: string;
  userEmail: string;
  onSetupComplete: () => void;
  onSkip: () => void;
}

type SetupStep = 'welcome' | 'choose-type' | 'setup-fingerprint' | 'setup-face' | 'complete';
type BiometricType = 'fingerprint' | 'face' | 'both' | 'none';

const BiometricSetupWizard: React.FC<BiometricSetupWizardProps> = ({
  userId,
  userEmail,
  onSetupComplete,
  onSkip
}) => {
  const [currentStep, setCurrentStep] = useState<SetupStep>('welcome');
  const [capabilities, setCapabilities] = useState<BiometricCapabilities | null>(null);
  const [selectedType, setSelectedType] = useState<BiometricType>('none');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkCapabilities();
  }, []);

  const checkCapabilities = async () => {
    const caps = await BiometricAuthService.checkBiometricCapabilities();
    setCapabilities(caps);
  };

  const handleSetupBiometric = async (type: 'fingerprint' | 'face') => {
    setIsLoading(true);
    
    try {
      const result = await BiometricAuthService.setupBiometric(userId, type);
      
      if (result.success) {
        toast({
          title: "Biometric Setup Successful",
          description: `${type === 'face' ? 'Face ID' : 'Touch ID'} has been enabled for your account.`,
        });
        
        setSelectedType(type);
        setCurrentStep('complete');
      } else {
        toast({
          variant: "destructive",
          title: "Setup Failed",
          description: result.error || 'Failed to setup biometric authentication',
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Setup Error",
        description: 'An error occurred during biometric setup',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderWelcomeStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-4 bg-gradient-biometric rounded-full animate-biometric-glow">
            <Shield className="h-12 w-12 text-biometric-foreground" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Secure Your Account</h2>
          <p className="text-muted-foreground mt-2">
            Add biometric authentication for enhanced security and convenience
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-start space-x-3">
            <CheckCircle2 className="h-5 w-5 text-biometric mt-0.5" />
            <div>
              <p className="font-medium">Enhanced Security</p>
              <p className="text-sm text-muted-foreground">Your biometric data never leaves your device</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-start space-x-3">
            <CheckCircle2 className="h-5 w-5 text-biometric mt-0.5" />
            <div>
              <p className="font-medium">Quick Access</p>
              <p className="text-sm text-muted-foreground">Login instantly without typing passwords</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Button
          variant="security"
          className="w-full"
          onClick={() => setCurrentStep('choose-type')}
        >
          Setup Biometric Login
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
        
        <Button
          variant="ghost"
          className="w-full"
          onClick={onSkip}
        >
          Skip for Now
        </Button>
      </div>
    </div>
  );

  const renderChooseTypeStep = () => {
    if (!capabilities?.isAvailable) {
      return (
        <div className="space-y-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Biometric authentication is not available on this device.
            </AlertDescription>
          </Alert>
          
          <Button variant="ghost" className="w-full" onClick={onSkip}>
            Continue without Biometrics
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground">Choose Authentication Method</h2>
          <p className="text-muted-foreground mt-2">
            Select how you'd like to secure your account
          </p>
        </div>

        <div className="space-y-3">
          {capabilities.biometryType === 'fingerprint' && (
            <Button
              variant="outline"
              className="w-full h-20 flex-col space-y-2"
              onClick={() => {
                setCurrentStep('setup-fingerprint');
                handleSetupBiometric('fingerprint');
              }}
              disabled={isLoading}
            >
              <Fingerprint className="h-8 w-8" />
              <span>Setup Fingerprint</span>
            </Button>
          )}

          {capabilities.biometryType === 'face' && (
            <Button
              variant="outline"
              className="w-full h-20 flex-col space-y-2"
              onClick={() => {
                setCurrentStep('setup-face');
                handleSetupBiometric('face');
              }}
              disabled={isLoading}
            >
              <Eye className="h-8 w-8" />
              <span>Setup Face ID</span>
            </Button>
          )}
        </div>

        <Button
          variant="ghost"
          className="w-full"
          onClick={onSkip}
          disabled={isLoading}
        >
          Skip for Now
        </Button>
      </div>
    );
  };

  const renderCompleteStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-4 bg-gradient-biometric rounded-full">
            <CheckCircle2 className="h-12 w-12 text-biometric-foreground" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Setup Complete!</h2>
          <p className="text-muted-foreground mt-2">
            {selectedType === 'face' ? 'Face ID' : 'Touch ID'} is now enabled for your account
          </p>
        </div>
      </div>

      <div className="p-4 bg-biometric/10 rounded-lg border border-biometric/20">
        <div className="flex items-center space-x-3">
          {selectedType === 'face' ? (
            <Eye className="h-6 w-6 text-biometric" />
          ) : (
            <Fingerprint className="h-6 w-6 text-biometric" />
          )}
          <div>
            <p className="font-medium">Biometric Login Active</p>
            <p className="text-sm text-muted-foreground">
              You can now use {selectedType === 'face' ? 'Face ID' : 'Touch ID'} to login
            </p>
          </div>
        </div>
      </div>

      <Button
        variant="security"
        className="w-full"
        onClick={onSetupComplete}
      >
        Continue to App
      </Button>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'welcome':
        return renderWelcomeStep();
      case 'choose-type':
        return renderChooseTypeStep();
      case 'setup-fingerprint':
      case 'setup-face':
        return (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className={`p-4 rounded-full ${isLoading ? 'animate-pulse' : ''}`}>
                {currentStep === 'setup-face' ? (
                  <Eye className="h-12 w-12 text-biometric" />
                ) : (
                  <Fingerprint className="h-12 w-12 text-biometric" />
                )}
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {isLoading ? 'Setting up...' : 'Setup in Progress'}
              </h2>
              <p className="text-muted-foreground mt-2">
                {isLoading ? 'Please follow the device prompts' : 'Complete the biometric setup'}
              </p>
            </div>
          </div>
        );
      case 'complete':
        return renderCompleteStep();
      default:
        return renderWelcomeStep();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-surface flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-card/95 backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl bg-gradient-security bg-clip-text text-transparent">
            VeriVault Setup
          </CardTitle>
          <CardDescription>
            Account: {userEmail}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {renderCurrentStep()}
        </CardContent>
      </Card>
    </div>
  );
};

export default BiometricSetupWizard;