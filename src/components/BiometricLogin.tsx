import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import FingerprintButton from './FingerprintButton';
import FaceIDButton from './FaceIDButton';
import { BiometricAuthService, BiometricCapabilities } from '@/lib/biometric-auth';
import { useToast } from '@/hooks/use-toast';
import { Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface BiometricLoginProps {
  onLogin: (userId: string) => void;
  onSwitchToSignup?: () => void;
}

const BiometricLogin: React.FC<BiometricLoginProps> = ({ onLogin, onSwitchToSignup }) => {
  const [capabilities, setCapabilities] = useState<BiometricCapabilities | null>(null);
  const [enabledBiometricTypes, setEnabledBiometricTypes] = useState<('fingerprint' | 'face')[]>([]);
  const [showTraditionalLogin, setShowTraditionalLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [storedCredentials, setStoredCredentials] = useState<{ userId: string; token: string } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    initializeBiometrics();
  }, []);

  const initializeBiometrics = async () => {
    // Check biometric capabilities
    const caps = await BiometricAuthService.checkBiometricCapabilities();
    setCapabilities(caps);

    // Check enabled biometric types
    const types = await BiometricAuthService.getEnabledBiometricTypes();
    const validTypes = types.filter(type => type === 'fingerprint' || type === 'face') as ('fingerprint' | 'face')[];
    setEnabledBiometricTypes(validTypes);

    // Check for stored credentials
    if (validTypes.length > 0) {
      const creds = await BiometricAuthService.getStoredCredentials();
      setStoredCredentials(creds);
    }
  };

  const handleBiometricSuccess = () => {
    if (storedCredentials) {
      onLogin(storedCredentials.userId);
    } else {
      toast({
        variant: "destructive",
        title: "No Stored Credentials",
        description: "Please log in traditionally first to enable biometric authentication.",
      });
      setShowTraditionalLogin(true);
    }
  };

  const handleBiometricError = (error: string) => {
    console.error('Biometric authentication error:', error);
    setShowTraditionalLogin(true);
  };

  const handleTraditionalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulate authentication
      if (email && password) {
        const userId = `user_${Date.now()}`;
        const token = `token_${Math.random().toString(36).substr(2, 9)}`;
        
        // Enable biometric auth if available
        if (capabilities?.isAvailable && capabilities.hasEnrolledBiometrics) {
          const biometricType = capabilities.biometryType === 'face' ? 'face' : 'fingerprint';
          await BiometricAuthService.enableBiometricAuth(userId, token, biometricType);
          toast({
            title: "Biometric Authentication Enabled",
            description: "You can now use biometric authentication for future logins.",
          });
        }

        onLogin(userId);
      } else {
        throw new Error('Please enter both email and password');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error instanceof Error ? error.message : 'Login failed',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricToggle = async (biometricType: 'fingerprint' | 'face', enabled: boolean) => {
    if (!enabled) {
      await BiometricAuthService.disableBiometricAuth(biometricType);
      const updatedTypes = enabledBiometricTypes.filter(type => type !== biometricType);
      setEnabledBiometricTypes(updatedTypes);
      
      if (updatedTypes.length === 0) {
        setStoredCredentials(null);
      }
      
      toast({
        title: "Biometric Authentication Disabled",
        description: `${biometricType === 'face' ? 'Face ID' : 'Touch ID'} has been disabled.`,
      });
    }
  };

  const getBiometricStatus = () => {
    if (!capabilities?.isAvailable) {
      return {
        icon: <AlertTriangle className="h-4 w-4 text-destructive" />,
        message: "Biometric authentication is not available on this device",
        variant: "destructive" as const
      };
    }
    
    if (!capabilities.hasEnrolledBiometrics) {
      return {
        icon: <AlertTriangle className="h-4 w-4 text-destructive" />,
        message: "No biometrics enrolled. Please set up fingerprint or face recognition in your device settings.",
        variant: "destructive" as const
      };
    }

    if (enabledBiometricTypes.length > 0 && storedCredentials) {
      return {
        icon: <CheckCircle2 className="h-4 w-4 text-biometric" />,
        message: "Biometric authentication is ready to use",
        variant: "default" as const
      };
    }

    return null;
  };

  const status = getBiometricStatus();

  return (
    <div className="min-h-screen bg-gradient-surface flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-card/95 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 bg-gradient-security rounded-full">
              <Shield className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-security bg-clip-text text-transparent">
              VeriVault
            </CardTitle>
            <CardDescription className="text-base">
              Secure Biometric Authentication
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Biometric Status */}
          {status && (
            <Alert variant={status.variant}>
              <div className="flex items-center space-x-2">
                {status.icon}
                <AlertDescription>{status.message}</AlertDescription>
              </div>
            </Alert>
          )}

          {/* Biometric Authentication Buttons */}
          {capabilities?.isAvailable && capabilities.hasEnrolledBiometrics && storedCredentials && !showTraditionalLogin && (
            <div className="text-center space-y-4">
              {enabledBiometricTypes.includes('fingerprint') && (
                <FingerprintButton
                  onSuccess={handleBiometricSuccess}
                  onError={handleBiometricError}
                />
              )}
              
              {enabledBiometricTypes.includes('face') && (
                <FaceIDButton
                  onSuccess={handleBiometricSuccess}
                  onError={handleBiometricError}
                />
              )}
              
              <div className="flex items-center space-x-2">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground">OR</span>
                <Separator className="flex-1" />
              </div>

              <Button
                variant="outline"
                onClick={() => setShowTraditionalLogin(true)}
                className="w-full"
              >
                Use Email & Password
              </Button>
            </div>
          )}

          {/* Traditional Login Form */}
          {(showTraditionalLogin || !storedCredentials) && (
            <form onSubmit={handleTraditionalLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                variant="security"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>

              {onSwitchToSignup && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onSwitchToSignup}
                  className="w-full"
                >
                  Don't have an account? Sign Up
                </Button>
              )}

              {showTraditionalLogin && storedCredentials && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowTraditionalLogin(false)}
                  className="w-full"
                >
                  Back to Biometric Login
                </Button>
              )}
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BiometricLogin;