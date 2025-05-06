import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client with fallback values
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://aqdzmfhakqdwquszaqle.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxZHptZmhha3Fkd3F1c3phcWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE0MDgyNTAsImV4cCI6MjA0Njk4NDI1MH0.4euPXQKyddaJuGhf5Etqdla8LF-h-p-gs1uVxw6dutQ';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found in environment variables. Using fallback values.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 