'use client';
import { createClient } from '@supabase/supabase-js';

// For client-side usage, we need to use NEXT_PUBLIC_ prefixed env variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Default values to prevent errors when Supabase is not configured
const defaultUrl = 'https://placeholder.supabase.co';
const defaultKey = 'placeholder-key';

// Create a Supabase client for client-side usage
// Ensure we have valid values and provide more helpful error messages
if (!supabaseUrl) {
  console.warn('NEXT_PUBLIC_SUPABASE_URL is not defined in environment variables. Using placeholder.');
}

if (!supabaseAnonKey) {
  console.warn('NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined in environment variables. Using placeholder.');
}

// Create the client with additional options for better compatibility
const supabase = createClient(
  supabaseUrl || defaultUrl,
  supabaseAnonKey || defaultKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      headers: {
        'X-Client-Info': 'supabase-js-web',
      },
    },
  }
);

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey &&
           supabaseUrl !== defaultUrl &&
           supabaseAnonKey !== defaultKey);
};

export default supabase;
