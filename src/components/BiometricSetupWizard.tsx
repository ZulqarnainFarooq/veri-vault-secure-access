
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Shield, Fingerprint, Eye, CheckCircle, AlertCircle, ArrowRight, SkipForward } from 'lucide-react';
import { BiometricAuthService } from '@/lib/biometric-auth';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BiometricSetupWizardProps {
  onSetupComplete: () => void;
  onSkip: () => void;
}

type SetupStep = 'welcome' | 'capability-check' | 'biometric-setup' | 'complete';

const BiometricSetupWizard: React.FC<BiometricSetupWizardProps> = ({ onSetupComplete, onSkip }) => {
  const { user, updateProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState<SetupStep>('welcome');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [biometricCapabilities, setBiometricCapabilities] = useState<any>(null);
  const [selectedBiometricType, setSelectedBiometricType] = useState<'fingerprint' | 'face' | null>(null);
  const [setupResult, setSetupResult] = useState<any>(null);

  useEffect(() => {
    if (currentStep === 'capability-check') {
      checkCapabilities();
    }
  }, [currentStep]);

  const checkCapabilities = async () => {
    setLoading(true);
    try {
      const capabilities = await BiometricAuthService.checkBiometricCapabilities();
      setBiometricCapabilities(capabilities);
      
      if (capabilities.isAvailable) {
        setCurrentStep('biometric-setup');
      } else {
        setError(capabilities.errorMessage || 'Biometric authentication not available');
      }
    } catch (error) {
      setError('Failed to check biometric capabilities');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricSetup = async (biometricType: 'fingerprint' | 'face') => {
    if (!user) return;
    
    setLoading(true);
    setError('');
    setSelectedBiometricType(biometricType);

    try {
      const result = await BiometricAuthService.setupBiometric(user.id, biometricType);
      
      if (result.success) {
        setSetupResult(result);
        setCurrentStep('complete');
      } else {
        setError(result.error || 'Failed to setup biometric authentication');
      }
    } catch (error) {
      setError('Setup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    if (user) {
      // Mark initial setup as complete even if skipped
      await updateProfile({ initial_setup_complete: true });
    }
    onSkip();
  };

  const handleComplete = () => {
    onSetupComplete();
  };

  const getStepProgress = () => {
    switch (currentStep) {
      case 'welcome': return 25;
      case 'capability-check': return 50;
      case 'biometric-setup': return 75;
      case 'complete': return 100;
      default: return 0;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-surface flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-xl border-0 bg-card/95 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto p-3 bg-gradient-security rounded-full w-fit">
            <Shield className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Secure Your Account</CardTitle>
            <CardDescription>
              Set up biometric authentication for enhanced security
            </CardDescription>
          </div>
          <Progress value={getStepProgress()} className="w-full" />
        </CardHeader>

        <CardContent className="space-y-6">
          {currentStep === 'welcome' && (
            <div className="space-y-6">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold">Welcome to VeriVault</h3>
                <p className="text-muted-foreground">
                  Let's set up biometric authentication to keep your account secure and make logging in faster.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm">Enhanced security protection</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm">Quick and convenient access</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm">Your data stays on your device</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setCurrentStep('capability-check')}
                  className="flex-1 bg-gradient-security hover:opacity-90"
                >
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={handleSkip}>
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {currentStep === 'capability-check' && (
            <div className="space-y-6">
              <div className="text-center space-y-4">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                <h3 className="text-lg font-semibold">Checking Device Capabilities</h3>
                <p className="text-muted-foreground">
                  We're checking what biometric options are available on your device...
                </p>
              </div>
            </div>
          )}

          {currentStep === 'biometric-setup' && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Choose Your Biometric Method</h3>
                <p className="text-muted-foreground">
                  Select how you'd like to authenticate
                </p>
              </div>

              {biometricCapabilities && (
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full h-16 flex items-center justify-between p-4"
                    onClick={() => handleBiometricSetup('fingerprint')}
                    disabled={loading}
                  >
                    <div className="flex items-center gap-3">
                      <Fingerprint className="h-6 w-6" />
                      <div className="text-left">
                        <div className="font-medium">Fingerprint</div>
                        <div className="text-sm text-muted-foreground">Touch sensor authentication</div>
                      </div>
                    </div>
                    <Badge variant="secondary">Recommended</Badge>
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full h-16 flex items-center justify-between p-4"
                    onClick={() => handleBiometricSetup('face')}
                    disabled={loading}
                  >
                    <div className="flex items-center gap-3">
                      <Eye className="h-6 w-6" />
                      <div className="text-left">
                        <div className="font-medium">Face Recognition</div>
                        <div className="text-sm text-muted-foreground">Camera-based authentication</div>
                      </div>
                    </div>
                  </Button>
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button variant="ghost" onClick={handleSkip} className="w-full">
                Skip for now
              </Button>
            </div>
          )}

          {currentStep === 'complete' && (
            <div className="space-y-6">
              <div className="text-center space-y-4">
                <div className="mx-auto p-3 bg-green-500/10 rounded-full w-fit">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="text-lg font-semibold">Setup Complete!</h3>
                <p className="text-muted-foreground">
                  {selectedBiometricType === 'fingerprint' ? 'Fingerprint' : 'Face recognition'} authentication 
                  has been successfully configured for your account.
                </p>
              </div>

              <div className="p-4 bg-secondary/50 rounded-lg">
                <h4 className="font-medium mb-2">What's Next?</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Use your {selectedBiometricType} to log in quickly</li>
                  <li>• Your biometric data stays secure on your device</li>
                  <li>• You can always use your password as backup</li>
                </ul>
              </div>

              <Button onClick={handleComplete} className="w-full bg-gradient-security hover:opacity-90">
                Continue to VeriVault
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BiometricSetupWizard;
