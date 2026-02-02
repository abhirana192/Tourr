import { useEffect, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface RealtimeSyncOptions {
  table: "tours" | "staff" | "assignments";
  onInsert?: (data: any) => void;
  onUpdate?: (data: any) => void;
  onDelete?: (data: any) => void;
}

/**
 * Hook to subscribe to real-time changes in Supabase
 * Automatically synchronizes data across multiple clients
 */
export function useRealtimeSync(options: RealtimeSyncOptions) {
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    // Subscribe to all changes on the specified table
    subscriptionRef.current = supabase
      .channel(`public:${options.table}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: options.table,
        },
        (payload) => {
          console.log(`[Realtime] New ${options.table} inserted:`, payload.new);
          options.onInsert?.(payload.new);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: options.table,
        },
        (payload) => {
          console.log(`[Realtime] ${options.table} updated:`, payload.new);
          options.onUpdate?.(payload.new);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: options.table,
        },
        (payload) => {
          console.log(`[Realtime] ${options.table} deleted:`, payload.old);
          options.onDelete?.(payload.old);
        }
      )
      .subscribe((status) => {
        console.log(`[Realtime] ${options.table} subscription status:`, status);
      });

    // Cleanup subscription on unmount
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [options.table, options.onInsert, options.onUpdate, options.onDelete]);
}

/**
 * Hook to fetch data and subscribe to real-time changes
 */
export function useRealtimeTours() {
  return { supabase };
}

/**
 * Hook to refetch tours from server (for manual refresh)
 */
export function useRefreshTours() {
  const refetch = useCallback(async (dateFrom?: string, dateTo?: string, invoice?: string, name?: string) => {
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);
      if (invoice) params.append("invoice", invoice);
      if (name) params.append("name", name);

      const response = await fetch(`/api/tours?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch tours");
      return await response.json();
    } catch (error) {
      console.error("Error refreshing tours:", error);
      throw error;
    }
  }, []);

  return { refetch };
}
