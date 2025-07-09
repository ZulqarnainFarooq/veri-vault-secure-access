
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, File, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { fileService, FileUpload } from '@/services/fileService';
import { useAuth } from '@/hooks/useAuth';

interface FileUploadProps {
  onUploadComplete?: (fileId: string) => void;
  acceptedTypes?: string;
  maxSizeMB?: number;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  onUploadComplete, 
  acceptedTypes = "*/*",
  maxSizeMB = 10 
}) => {
  const { user } = useAuth();
  const [uploads, setUploads] = useState<FileUpload[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  }, []);

  const handleFiles = async (files: File[]) => {
    if (!user) return;

    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    
    for (const file of files) {
      if (file.size > maxSizeBytes) {
        setUploads(prev => [...prev, {
          file,
          progress: 0,
          status: 'error',
          error: `File size exceeds ${maxSizeMB}MB limit`
        }]);
        continue;
      }

      const uploadItem: FileUpload = {
        file,
        progress: 0,
        status: 'uploading'
      };

      setUploads(prev => [...prev, uploadItem]);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploads(prev => prev.map(upload => 
          upload.file === file && upload.status === 'uploading'
            ? { ...upload, progress: Math.min(upload.progress + 10, 90) }
            : upload
        ));
      }, 200);

      try {
        const result = await fileService.uploadFile(file, user.id);
        
        clearInterval(progressInterval);
        
        if (result.success) {
          setUploads(prev => prev.map(upload => 
            upload.file === file 
              ? { ...upload, progress: 100, status: 'completed' }
              : upload
          ));
          
          if (onUploadComplete && result.fileId) {
            onUploadComplete(result.fileId);
          }
        } else {
          setUploads(prev => prev.map(upload => 
            upload.file === file 
              ? { ...upload, status: 'error', error: result.error }
              : upload
          ));
        }
      } catch (error) {
        clearInterval(progressInterval);
        setUploads(prev => prev.map(upload => 
          upload.file === file 
            ? { ...upload, status: 'error', error: 'Upload failed' }
            : upload
        ));
      }
    }
  };

  const removeUpload = (file: File) => {
    setUploads(prev => prev.filter(upload => upload.file !== file));
  };

  const clearCompleted = () => {
    setUploads(prev => prev.filter(upload => upload.status !== 'completed'));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Upload className="h-5 w-5" />
          <span>File Upload</span>
        </CardTitle>
        <CardDescription>
          Drag and drop files or click to browse. Max size: {maxSizeMB}MB
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium mb-2">Drop files here</p>
          <p className="text-muted-foreground mb-4">or</p>
          
          <label htmlFor="file-upload">
            <Button variant="outline" className="cursor-pointer">
              Browse Files
            </Button>
            <input
              id="file-upload"
              type="file"
              multiple
              accept={acceptedTypes}
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        </div>

        {/* Upload List */}
        {uploads.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Uploads</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={clearCompleted}
                disabled={!uploads.some(u => u.status === 'completed')}
              >
                Clear Completed
              </Button>
            </div>
            
            {uploads.map((upload, index) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <File className="h-4 w-4" />
                    <span className="text-sm font-medium truncate">
                      {upload.file.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {fileService.formatFileSize(upload.file.size)}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {upload.status === 'completed' && (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                    {upload.status === 'error' && (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeUpload(upload.file)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                {upload.status === 'uploading' && (
                  <Progress value={upload.progress} className="mb-2" />
                )}
                
                {upload.status === 'error' && upload.error && (
                  <Alert variant="destructive">
                    <AlertDescription className="text-xs">
                      {upload.error}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FileUpload;
