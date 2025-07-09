-- Create profiles table for user data and biometric preferences
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  biometric_enabled BOOLEAN DEFAULT false,
  fingerprint_enabled BOOLEAN DEFAULT false,
  face_id_enabled BOOLEAN DEFAULT false,
  device_fingerprint TEXT,
  last_biometric_setup TIMESTAMP WITH TIME ZONE,
  security_level TEXT DEFAULT 'standard' CHECK (security_level IN ('standard', 'enhanced', 'maximum')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update profile timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create table for authentication logs
CREATE TABLE public.auth_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('login', 'logout', 'biometric_setup', 'biometric_auth', 'password_reset', 'failed_attempt')),
  device_info JSONB,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on auth_logs
ALTER TABLE public.auth_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for auth logs (users can only see their own logs)
CREATE POLICY "Users can view their own auth logs"
  ON public.auth_logs
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_auth_logs_user_id_created_at ON public.auth_logs(user_id, created_at DESC);
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_device_fingerprint ON public.profiles(device_fingerprint) WHERE device_fingerprint IS NOT NULL;