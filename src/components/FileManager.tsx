
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  File, 
  Download, 
  Trash2, 
  FileText, 
  Image, 
  FileVideo, 
  FileAudio,
  Archive,
  RefreshCw
} from 'lucide-react';
import { fileService, UserFile } from '@/services/fileService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const FileManager: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [files, setFiles] = useState<UserFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchFiles = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const userFiles = await fileService.getUserFiles(user.id);
      setFiles(userFiles);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast({
        title: "Error",
        description: "Failed to load files",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [user]);

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (fileType.startsWith('video/')) return <FileVideo className="h-4 w-4" />;
    if (fileType.startsWith('audio/')) return <FileAudio className="h-4 w-4" />;
    if (fileType.includes('zip') || fileType.includes('rar')) return <Archive className="h-4 w-4" />;
    if (fileType.includes('text') || fileType.includes('document')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const handleDownload = async (file: UserFile) => {
    setActionLoading(file.id);
    try {
      const result = await fileService.downloadFile(file.storage_path);
      
      if (result.success && result.url) {
        const link = document.createElement('a');
        link.href = result.url;
        link.download = file.file_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "Download Started",
          description: `${file.file_name} is downloading`,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: "Could not download the file",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (file: UserFile) => {
    if (!confirm(`Are you sure you want to delete "${file.file_name}"?`)) {
      return;
    }

    setActionLoading(file.id);
    try {
      const result = await fileService.deleteFile(file.id, file.storage_path);
      
      if (result.success) {
        setFiles(prev => prev.filter(f => f.id !== file.id));
        toast({
          title: "File Deleted",
          description: `${file.file_name} has been deleted`,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Delete Failed",
        description: "Could not delete the file",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Loading files...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>My Files</CardTitle>
            <CardDescription>
              Manage your uploaded files securely
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchFiles}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {files.length === 0 ? (
          <Alert>
            <File className="h-4 w-4" />
            <AlertDescription>
              No files uploaded yet. Use the upload area above to get started.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            {files.map((file) => (
              <div 
                key={file.id} 
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {getFileIcon(file.file_type)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.file_name}</p>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>{fileService.formatFileSize(file.file_size)}</span>
                      <span>{new Date(file.upload_date).toLocaleDateString()}</span>
                      {file.is_encrypted && (
                        <Badge variant="secondary" className="text-xs">
                          Encrypted
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(file)}
                    disabled={actionLoading === file.id}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(file)}
                    disabled={actionLoading === file.id}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FileManager;
