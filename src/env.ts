const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) throw new Error('Missing required environment variable: EXPO_PUBLIC_SUPABASE_URL');
if (!supabaseAnonKey) throw new Error('Missing required environment variable: EXPO_PUBLIC_SUPABASE_ANON_KEY');

export const env = {
  supabaseUrl,
  supabaseAnonKey,
  enableHindi: process.env.EXPO_PUBLIC_ENABLE_HINDI === 'true',
} as const;
