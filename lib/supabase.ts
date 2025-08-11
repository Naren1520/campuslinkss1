import { createClient } from '@supabase/supabase-js';
import type { Database } from './types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
  realtime: {
    enabled: true,
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      'X-Application-Name': 'Campus Link',
    },
  },
});

// Storage buckets
export const STORAGE_BUCKETS = {
  AVATARS: 'avatars',
  DOCUMENTS: 'documents',
  CONTENT_FILES: 'content-files',
  EXAM_FILES: 'exam-files',
} as const;

// Helper function to upload file
export async function uploadFile(
  bucket: string,
  path: string,
  file: File,
  options?: { upsert?: boolean; cacheControl?: string }
) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      upsert: options?.upsert || false,
      cacheControl: options?.cacheControl || '3600',
    });

  if (error) {
    console.error('Upload error:', error);
    throw error;
  }

  return data;
}

// Helper function to get file URL
export function getFileUrl(bucket: string, path: string) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

// Helper function to delete file
export async function deleteFile(bucket: string, path: string) {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  
  if (error) {
    console.error('Delete error:', error);
    throw error;
  }
}

// Real-time subscriptions helper
export function createRealtimeChannel(channelName: string) {
  return supabase.channel(channelName, {
    config: {
      broadcast: { self: true },
      presence: { key: channelName },
    },
  });
}

// Analytics helper
export async function trackEvent(
  eventType: string,
  eventData?: Record<string, any>,
  userId?: string
) {
  if (typeof window === 'undefined') return;

  try {
    await supabase.from('analytics').insert({
      user_id: userId || null,
      event_type: eventType,
      event_data: eventData || {},
      page_url: window.location.href,
      user_agent: navigator.userAgent,
      session_id: sessionStorage.getItem('session-id') || crypto.randomUUID(),
    });
  } catch (error) {
    console.error('Analytics tracking error:', error);
  }
}

// Initialize session ID
if (typeof window !== 'undefined' && !sessionStorage.getItem('session-id')) {
  sessionStorage.setItem('session-id', crypto.randomUUID());
}

export default supabase;