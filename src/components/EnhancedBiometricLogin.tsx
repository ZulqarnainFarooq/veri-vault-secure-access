
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Shield, Fingerprint, Eye, Mail, Lock, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
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
      console.log('Submitting email:', email);
      const methods = await AuthMethodService.checkAuthMethodsForEmail(email);
      console.log('Retrieved auth methods:', methods);
      
      if (!methods.hasPassword && !methods.hasBiometric) {
        setError('No account found with this email address. Please check your email or sign up for a new account.');
        return;
      }

      setAuthMethods(methods);
      setCurrentStep('auth-method');
    } catch (error) {
      console.error('Email submit error:', error);
      setError('Unable to verify email address. Please try again or contact support if the problem persists.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Attempting password login for:', email);
      const { error } = await signIn(email, password);
      
      if (error) {
        console.error('Password login error:', error);
        if (error.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please check your credentials and try again.');
        } else if (error.message.includes('Email not confirmed')) {
          setError('Please confirm your email address before signing in. Check your inbox for a confirmation email.');
        } else {
          setError(error.message);
        }
      }
    } catch (error) {
      console.error('Unexpected password login error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async (biometricType: 'fingerprint' | 'face') => {
    setBiometricLoading(true);
    setError('');

    try {
      console.log('Attempting biometric login:', biometricType, 'for email:', email);
      const result = await BiometricAuthService.authenticateWithEmail(email, biometricType);
      
      if (result.success && result.sessionToken) {
        const { error } = await signInWithBiometric(result.sessionToken);
        
        if (error) {
          console.error('Biometric session error:', error);
          setError('Biometric authentication succeeded but login failed. Please try password login.');
        }
      } else {
        console.error('Biometric authentication failed:', result.error);
        if (result.requiresFallback) {
          setError('Biometric authentication failed. Please use your password to sign in.');
        } else {
          setError(result.error || 'Biometric authentication failed');
        }
      }
    } catch (error) {
      console.error('Biometric login error:', error);
      setError('Biometric authentication failed. Please use your password to sign in.');
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
            disabled={loading}
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
        disabled={loading || !email.trim()}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Checking...
          </>
        ) : (
          'Continue'
        )}
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
        disabled={loading || biometricLoading}
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
                  disabled={biometricLoading || loading}
                >
                  {biometricLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Fingerprint className="h-5 w-5" />
                  )}
                  <span className="text-xs">Fingerprint</span>
                </Button>
              )}
              {authMethods.biometricTypes.includes('face') && (
                <Button
                  variant="outline"
                  className="h-12 flex flex-col gap-1"
                  onClick={() => handleBiometricLogin('face')}
                  disabled={biometricLoading || loading}
                >
                  {biometricLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
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
              disabled={loading || biometricLoading}
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
          disabled={loading || biometricLoading || !password.trim()}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing In...
            </>
          ) : (
            'Sign In'
          )}
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
                disabled={loading || biometricLoading}
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
