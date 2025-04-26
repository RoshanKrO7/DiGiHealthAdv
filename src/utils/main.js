// src/utils/main.js
import { supabase } from './supabaseClient';

// Deprecation warning
console.warn('Importing supabase from utils/main.js is deprecated. Please import directly from utils/supabaseClient.js');

// Remove the duplicate Supabase client initialization
export { supabase };
