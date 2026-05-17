import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client with fallback values
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://eqcfweumpdaeataizgmq.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxY2Z3ZXVtcGRhZWF0YWl6Z21xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5Mzg2NTksImV4cCI6MjA5NDUxNDY1OX0.Gmi-GNbQPmctxQRhqQ3JanES6PNj3WctbUrTUkQHBcA';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found in environment variables. Using fallback values.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 