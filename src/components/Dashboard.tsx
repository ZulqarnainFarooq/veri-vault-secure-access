
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { enhancedBiometricService } from '@/services/biometricService';
import { useAuth } from '@/hooks/useAuth';
import FileUpload from './FileUpload';
import FileManager from './FileManager';
import { 
  Shield, 
  LogOut, 
  Settings, 
  Eye, 
  Fingerprint,
  Lock,
  CheckCircle2,
  Smartphone,
  Upload,
  FolderOpen
} from 'lucide-react';

interface DashboardProps {}

const Dashboard: React.FC<DashboardProps> = () => {
  const { user, userProfile, signOut, updateProfile } = useAuth();
  const [refreshFiles, setRefreshFiles] = useState(0);

  const handleLogout = async () => {
    await signOut();
  };

  const handleDisableBiometric = async () => {
    if (!user || !confirm('Are you sure you want to disable biometric authentication?')) {
      return;
    }

    const result = await enhancedBiometricService.disableBiometric(user.id);
    if (result.success) {
      await updateProfile({ 
        biometric_enabled: false,
        fingerprint_enabled: false,
        face_id_enabled: false 
      });
    }
  };

  const handleFileUploadComplete = (fileId: string) => {
    console.log('File uploaded:', fileId);
    setRefreshFiles(prev => prev + 1);
  };

  const securityFeatures = [
    {
      icon: <Fingerprint className="h-6 w-6" />,
      title: "Fingerprint Authentication",
      description: "Secure login with your unique fingerprint",
      status: userProfile?.fingerprint_enabled ? "Active" : "Inactive",
      color: userProfile?.fingerprint_enabled ? "biometric" : "muted"
    },
    {
      icon: <Eye className="h-6 w-6" />,
      title: "Face Recognition",
      description: "Advanced facial recognition technology",
      status: userProfile?.face_id_enabled ? "Active" : "Inactive",
      color: userProfile?.face_id_enabled ? "biometric" : "muted"
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
      status: userProfile?.device_id ? "Verified" : "Not Set",
      color: userProfile?.device_id ? "primary" : "muted"
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
                <p className="text-primary-foreground/80">
                  Welcome back, {userProfile?.display_name || user?.email}
                </p>
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
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Security Status Card */}
            <Card className="bg-gradient-to-r from-card to-card/50 border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lock className="h-5 w-5 text-biometric" />
                  <span>Security Status</span>
                </CardTitle>
                <CardDescription>
                  Your account security overview
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {securityFeatures.map((feature, index) => (
                    <div key={index} className="p-4 bg-muted/30 rounded-lg border">
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${
                          feature.color === 'biometric' ? 'bg-biometric/10 text-biometric' : 
                          feature.color === 'primary' ? 'bg-primary/10 text-primary' :
                          'bg-muted text-muted-foreground'
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
                                ? 'border-biometric/30 text-biometric' : 
                              feature.color === 'primary'
                                ? 'border-primary/30 text-primary'
                                : 'border-muted text-muted-foreground'
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

            {/* Quick Stats */}
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Account Status</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-biometric">Secure</div>
                  <p className="text-xs text-muted-foreground">
                    All security measures active
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Last Login</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {userProfile?.last_biometric_login ? 'Biometric' : 'Password'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date().toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Security Level</CardTitle>
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-biometric">Maximum</div>
                  <p className="text-xs text-muted-foreground">
                    Enhanced protection enabled
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="files" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <FileUpload 
                onUploadComplete={handleFileUploadComplete}
                maxSizeMB={50}
              />
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>File management shortcuts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Bulk Upload
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Create Folder
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Shield className="h-4 w-4 mr-2" />
                    Encrypt Files
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            <FileManager key={refreshFiles} />
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Biometric Settings</CardTitle>
                  <CardDescription>Manage your biometric authentication</CardDescription>
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

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>Your secure vault details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Email:</span>
                      <p className="text-muted-foreground">{user?.email}</p>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">User ID:</span>
                      <p className="text-muted-foreground font-mono text-xs break-all">{user?.id}</p>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Member Since:</span>
                      <p className="text-muted-foreground">
                        {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
