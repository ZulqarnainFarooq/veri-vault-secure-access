
import { supabase } from '@/integrations/supabase/client';

export interface FileUpload {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface UserFile {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  storage_path: string;
  upload_date: string;
  last_accessed?: string;
  is_encrypted: boolean;
  metadata: any;
}

class FileService {
  async uploadFile(file: File, userId: string): Promise<{ success: boolean; error?: string; fileId?: string }> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('user-files')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Save file metadata to database
      const { data: fileData, error: dbError } = await supabase
        .from('user_files')
        .insert({
          user_id: userId,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          storage_path: filePath,
          metadata: {
            originalName: file.name,
            uploadedAt: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (dbError) {
        // Clean up storage if database insert fails
        await supabase.storage.from('user-files').remove([filePath]);
        throw dbError;
      }

      return { success: true, fileId: fileData.id };
    } catch (error) {
      console.error('File upload error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      };
    }
  }

  async getUserFiles(userId: string): Promise<UserFile[]> {
    try {
      const { data, error } = await supabase
        .from('user_files')
        .select('*')
        .eq('user_id', userId)
        .order('upload_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user files:', error);
      return [];
    }
  }

  async downloadFile(filePath: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const { data, error } = await supabase.storage
        .from('user-files')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) throw error;

      return { success: true, url: data.signedUrl };
    } catch (error) {
      console.error('Error downloading file:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Download failed' 
      };
    }
  }

  async deleteFile(fileId: string, filePath: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('user-files')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('user_files')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;

      return { success: true };
    } catch (error) {
      console.error('Error deleting file:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Delete failed' 
      };
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const fileService = new FileService();
