import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl && !import.meta.env.SSR) {
    console.warn('Supabase URL is missing. Check your .env file.');
}

if (!supabaseAnonKey && !import.meta.env.SSR) {
    console.warn('Supabase Anon Key is missing. Check your .env file.');
}

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder'
);
