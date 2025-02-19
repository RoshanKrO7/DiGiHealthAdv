// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://aqdzmfhakqdwquszaqle.supabase.co';
const SUPABASE_PUBLIC_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxZHptZmhha3Fkd3F1c3phcWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE0MDgyNTAsImV4cCI6MjA0Njk4NDI1MH0.4euPXQKyddaJuGhf5Etqdla8LF-h-p-gs1uVxw6dutQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
