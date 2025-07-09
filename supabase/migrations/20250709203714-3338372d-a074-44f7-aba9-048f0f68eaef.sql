
-- Add initial_setup_complete field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN initial_setup_complete BOOLEAN DEFAULT false;

-- Update existing profiles to mark them as setup complete (for existing users)
UPDATE public.profiles 
SET initial_setup_complete = true 
WHERE created_at < NOW() - INTERVAL '1 hour';
