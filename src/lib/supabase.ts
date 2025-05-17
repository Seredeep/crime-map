'use client';
import { createClient } from '@supabase/supabase-js';

// For client-side usage, we need to use NEXT_PUBLIC_ prefixed env variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create a Supabase client for client-side usage
// Ensure we have valid values and provide more helpful error messages
if (!supabaseUrl) {
  console.error('NEXT_PUBLIC_SUPABASE_URL is not defined in environment variables');
}

if (!supabaseAnonKey) {
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined in environment variables');
}

// Create the client
const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

export default supabase;