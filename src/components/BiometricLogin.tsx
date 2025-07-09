
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Shield, Fingerprint, Eye, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { BiometricAuthService } from '@/lib/biometric-auth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

interface BiometricLoginProps {
  onSwitchToSignup: () => void;
}

const BiometricLogin: React.FC<BiometricLoginProps> = ({ onSwitchToSignup }) => {
  const { signIn, signInWithBiometric } = useAuth();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [error, setError] = useState('');
  const [biometricCapabilities, setBiometricCapabilities] = useState<any>(null);
  const [enabledBiometricTypes, setEnabledBiometricTypes] = useState<string[]>([]);
  const [hasStoredCredentials, setHasStoredCredentials] = useState(false);

  useEffect(() => {
    initializeBiometric();
  }, []);

  const initializeBiometric = async () => {
    try {
      const capabilities = await BiometricAuthService.checkBiometricCapabilities();
      const enabledTypes = await BiometricAuthService.getEnabledBiometricTypes();
      const hasCredentials = await BiometricAuthService.hasStoredCredentialsForUser();
      
      setBiometricCapabilities(capabilities);
      setEnabledBiometricTypes(enabledTypes);
      setHasStoredCredentials(hasCredentials);
      
      console.log('Biometric initialization:', {
        capabilities,
        enabledTypes,
        hasCredentials
      });
    } catch (error) {
      console.error('Error initializing biometric:', error);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        setError(error.message);
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async (biometricType: 'fingerprint' | 'face') => {
    setBiometricLoading(true);
    setError('');

    try {
      const result = await BiometricAuthService.authenticate(biometricType);
      
      if (result.success && result.token) {
        const { error } = await signInWithBiometric(result.token);
        
        if (error) {
          setError(error.message);
        }
      } else {
        setError(result.error || 'Biometric authentication failed');
      }
    } catch (error) {
      console.error('Biometric login error:', error);
      setError('Biometric authentication failed');
    } finally {
      setBiometricLoading(false);
    }
  };

  const canUseBiometric = biometricCapabilities?.isAvailable && hasStoredCredentials && enabledBiometricTypes.length > 0;

  return (
    <div className="min-h-screen bg-gradient-surface flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-card/95 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto p-3 bg-gradient-security rounded-full w-fit">
            <Shield className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Welcome to VeriVault</CardTitle>
            <CardDescription className="text-muted-foreground">
              Secure authentication with biometric protection
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Biometric Login Section */}
          {canUseBiometric && (
            <>
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-center">Quick Access</h3>
                <div className="grid grid-cols-2 gap-3">
                  {enabledBiometricTypes.includes('fingerprint') && (
                    <Button
                      variant="outline"
                      className="h-12 flex flex-col gap-1"
                      onClick={() => handleBiometricLogin('fingerprint')}
                      disabled={biometricLoading}
                    >
                      <Fingerprint className="h-5 w-5" />
                      <span className="text-xs">Fingerprint</span>
                    </Button>
                  )}
                  {enabledBiometricTypes.includes('face') && (
                    <Button
                      variant="outline"
                      className="h-12 flex flex-col gap-1"
                      onClick={() => handleBiometricLogin('face')}
                      disabled={biometricLoading}
                    >
                      <Eye className="h-5 w-5" />
                      <span className="text-xs">Face ID</span>
                    </Button>
                  )}
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
                </div>
              </div>
            </>
          )}

          {/* Email Login Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-security hover:opacity-90"
              disabled={loading || biometricLoading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <button
                onClick={onSwitchToSignup}
                className="text-primary hover:underline font-medium"
              >
                Sign up
              </button>
            </p>
          </div>

          {/* Biometric Status */}
          {!canUseBiometric && biometricCapabilities && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                {!biometricCapabilities.isAvailable
                  ? 'Biometric authentication not available on this device'
                  : !hasStoredCredentials
                  ? 'Sign up to enable biometric authentication'
                  : 'No biometric methods enabled'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BiometricLogin;
