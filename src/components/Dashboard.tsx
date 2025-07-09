import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BiometricAuthService } from '@/lib/biometric-auth';
import { useAuth } from '@/hooks/useAuth';
import { 
  Shield, 
  LogOut, 
  Settings, 
  Eye, 
  Fingerprint,
  Lock,
  CheckCircle2,
  Smartphone
} from 'lucide-react';

interface DashboardProps {}

const Dashboard: React.FC<DashboardProps> = () => {
  const { user, userProfile, signOut, updateProfile } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  const handleDisableBiometric = async () => {
    await BiometricAuthService.disableBiometricAuth();
    await updateProfile({ 
      biometric_enabled: false,
      fingerprint_enabled: false,
      face_id_enabled: false 
    });
  };

  const securityFeatures = [
    {
      icon: <Fingerprint className="h-6 w-6" />,
      title: "Fingerprint Authentication",
      description: "Secure login with your unique fingerprint",
      status: "Active",
      color: "biometric"
    },
    {
      icon: <Eye className="h-6 w-6" />,
      title: "Face Recognition",
      description: "Advanced facial recognition technology",
      status: "Active",
      color: "biometric"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "End-to-End Encryption",
      description: "Your data is protected with military-grade encryption",
      status: "Enabled",
      color: "primary"
    },
    {
      icon: <Smartphone className="h-6 w-6" />,
      title: "Device Binding",
      description: "Securely bound to your trusted device",
      status: "Verified",
      color: "primary"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-surface">
      {/* Header */}
      <div className="bg-gradient-security text-primary-foreground">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary-foreground/20 rounded-lg">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">VeriVault Dashboard</h1>
                <p className="text-primary-foreground/80">Welcome back, secure user</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="border-primary-foreground/30 text-primary-foreground">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Authenticated
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Security Status Card */}
          <Card className="md:col-span-2 lg:col-span-3 bg-gradient-to-r from-card to-card/50 border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lock className="h-5 w-5 text-biometric" />
                <span>Security Status</span>
              </CardTitle>
              <CardDescription>
                Your account security is at maximum protection level
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {securityFeatures.map((feature, index) => (
                  <div key={index} className="p-4 bg-muted/30 rounded-lg border">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${
                        feature.color === 'biometric' ? 'bg-biometric/10 text-biometric' : 'bg-primary/10 text-primary'
                      }`}>
                        {feature.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{feature.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
                        <Badge 
                          variant="outline" 
                          className={`mt-2 text-xs ${
                            feature.color === 'biometric' 
                              ? 'border-biometric/30 text-biometric' 
                              : 'border-primary/30 text-primary'
                          }`}
                        >
                          {feature.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage your security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Security Settings
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                size="sm"
                onClick={handleDisableBiometric}
              >
                <Fingerprint className="h-4 w-4 mr-2" />
                Disable Biometric
              </Button>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Your secure vault details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">User ID:</span>
                  <p className="text-muted-foreground font-mono text-xs break-all">{user?.id}</p>
                </div>
                <div className="text-sm">
                  <span className="font-medium">Last Login:</span>
                  <p className="text-muted-foreground">{new Date().toLocaleString()}</p>
                </div>
                <div className="text-sm">
                  <span className="font-medium">Security Level:</span>
                  <Badge className="ml-2 bg-biometric text-biometric-foreground">Maximum</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Demo Info */}
          <Card className="shadow-lg border-biometric/20">
            <CardHeader>
              <CardTitle className="text-biometric">Demo Information</CardTitle>
              <CardDescription>This is a demonstration of biometric authentication</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm space-y-2">
                <p><strong>Features demonstrated:</strong></p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 text-xs">
                  <li>Biometric authentication simulation</li>
                  <li>Secure token storage</li>
                  <li>Device capability detection</li>
                  <li>Fallback authentication</li>
                  <li>Session management</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;