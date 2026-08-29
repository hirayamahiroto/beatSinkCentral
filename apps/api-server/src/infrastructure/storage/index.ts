import { createClient, SupabaseClient } from "@supabase/supabase-js";

export const getStorageClient = (() => {
  let client: SupabaseClient | null = null;

  return (): SupabaseClient => {
    if (!client) {
      const supabaseUrl = process.env.SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error("SUPABASE_URL is not defined");
      }
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!serviceRoleKey) {
        throw new Error("SUPABASE_SERVICE_ROLE_KEY is not defined");
      }
      client = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false },
      });
    }
    return client;
  };
})();
