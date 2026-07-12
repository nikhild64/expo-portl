export const env = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  razorpayKeyId: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID!,
} as const;
