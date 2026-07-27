import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().or(z.number()).default(3000),
  GEMINI_API_KEY: z.string().optional(),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  DATABASE_URL: z.string().optional(),
});

export type ValidatedEnv = z.infer<typeof envSchema>;

export function validateStartupEnv(): ValidatedEnv {
  const env = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    SUPABASE_URL: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
  };

  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    console.warn('⚠️ Environment variable warning during startup:', parsed.error.format());
    return envSchema.parse({ NODE_ENV: 'development', PORT: 3000 });
  }

  console.log('🔒 Production Environment Validation: OK (NODE_ENV = ' + parsed.data.NODE_ENV + ')');
  return parsed.data;
}
