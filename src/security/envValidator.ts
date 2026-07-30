import { z } from 'zod';

const backendEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().or(z.number()).default(3000),
  GEMINI_API_KEY: z.string().optional(),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  DATABASE_URL: z.string().optional(),
});

export type ValidatedBackendEnv = z.infer<typeof backendEnvSchema>;

/**
 * Validates backend server environment variables using process.env
 */
export function validateStartupEnv(): ValidatedBackendEnv {
  const env = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    SUPABASE_URL: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
  };

  const missing: string[] = [];
  if (!env.SUPABASE_URL) missing.push('SUPABASE_URL');
  if (!env.SUPABASE_ANON_KEY && !env.SUPABASE_SERVICE_ROLE_KEY) {
    missing.push('SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY');
  }

  if (missing.length > 0) {
    console.warn(`⚠️ [BACKEND ENV DIAGNOSTIC] Backend operating without database keys: ${missing.join(', ')}. Local memory DB active.`);
  } else {
    console.log('🔒 [BACKEND ENV DIAGNOSTIC] Backend Supabase & Server environment variables validated successfully.');
  }

  const parsed = backendEnvSchema.safeParse(env);
  if (!parsed.success) {
    console.warn('⚠️ Environment variable warning during backend startup:', parsed.error.format());
    return backendEnvSchema.parse({ NODE_ENV: 'development', PORT: 3000 });
  }

  return parsed.data;
}

