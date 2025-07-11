
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Shield, Fingerprint, Eye, Mail, Lock, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { BiometricAuthService } from '@/lib/biometric-auth';
import { AuthMethodService, AuthMethods } from '@/services/authMethodService';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EnhancedBiometricLoginProps {
  onSwitchToSignup: () => void;
}

type AuthStep = 'email' | 'auth-method';

const EnhancedBiometricLogin: React.FC<EnhancedBiometricLoginProps> = ({ onSwitchToSignup }) => {
  const { signIn, signInWithBiometric } = useAuth();
  
  const [currentStep, setCurrentStep] = useState<AuthStep>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMethods, setAuthMethods] = useState<AuthMethods | null>(null);
  const [loading, setLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const methods = await AuthMethodService.checkAuthMethodsForEmail(email);
      
      if (!methods.hasPassword && !methods.hasBiometric) {
        setError('No account found with this email address');
        return;
      }

      setAuthMethods(methods);
      setCurrentStep('auth-method');
    } catch (error) {
      setError('Failed to check authentication methods');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
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
      
      if (result.success && result.sessionToken) {
        const { error } = await signInWithBiometric(result.sessionToken);
        
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

  const handleBackToEmail = () => {
    setCurrentStep('email');
    setAuthMethods(null);
    setError('');
    setPassword('');
  };

  const renderEmailStep = () => (
    <form onSubmit={handleEmailSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
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

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        className="w-full bg-gradient-security hover:opacity-90"
        disabled={loading}
      >
        {loading ? 'Checking...' : 'Continue'}
      </Button>
    </form>
  );

  const renderAuthMethodStep = () => (
    <div className="space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleBackToEmail}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to email
      </Button>

      {/* User email display */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Signing in as: <span className="font-medium text-foreground">{email}</span>
        </p>
      </div>

      {/* Biometric authentication options */}
      {authMethods?.hasBiometric && (
        <>
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-center">Use Biometric Authentication</h3>
            <div className="grid grid-cols-2 gap-3">
              {authMethods.biometricTypes.includes('fingerprint') && (
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
              {authMethods.biometricTypes.includes('face') && (
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
              <span className="bg-card px-2 text-muted-foreground">Or use password</span>
            </div>
          </div>
        </>
      )}

      {/* Password authentication */}
      <form onSubmit={handlePasswordLogin} className="space-y-4">
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
    </div>
  );

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
              {currentStep === 'email' 
                ? 'Enter your email to continue' 
                : 'Choose your authentication method'}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {currentStep === 'email' ? renderEmailStep() : renderAuthMethodStep()}

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
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedBiometricLogin;
