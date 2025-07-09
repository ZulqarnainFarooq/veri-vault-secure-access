
-- Phase 1: Enhanced biometric authentication schema
ALTER TABLE public.profiles 
ADD COLUMN biometric_token TEXT,
ADD COLUMN device_id TEXT,
ADD COLUMN last_biometric_login TIMESTAMP WITH TIME ZONE,
ADD COLUMN biometric_failures INTEGER DEFAULT 0,
ADD COLUMN biometric_locked_until TIMESTAMP WITH TIME ZONE;

-- Add indexes for biometric lookups
CREATE INDEX idx_profiles_biometric_token ON public.profiles(biometric_token) WHERE biometric_token IS NOT NULL;
CREATE INDEX idx_profiles_device_id ON public.profiles(device_id) WHERE device_id IS NOT NULL;

-- Phase 2: File storage setup
-- Create storage bucket for user files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-files', 'user-files', false);

-- Create file metadata table
CREATE TABLE public.user_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_accessed TIMESTAMP WITH TIME ZONE,
  is_encrypted BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS on user_files
ALTER TABLE public.user_files ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_files
CREATE POLICY "Users can view their own files" 
  ON public.user_files 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own files" 
  ON public.user_files 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own files" 
  ON public.user_files 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own files" 
  ON public.user_files 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Storage policies for user-files bucket
CREATE POLICY "Users can upload their own files"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'user-files' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own files"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'user-files' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own files"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'user-files' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own files"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'user-files' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create indexes for performance
CREATE INDEX idx_user_files_user_id ON public.user_files(user_id);
CREATE INDEX idx_user_files_upload_date ON public.user_files(upload_date DESC);
