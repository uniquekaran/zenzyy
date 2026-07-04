import { createClient } from "@supabase/supabase-js";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "list_parks",
  title: "List water parks",
  description: "List all water parks available for booking on Zenzyy, including name, location, and price.",
  inputSchema: {
    search: z.string().optional().describe("Optional case-insensitive substring to filter by park name or location."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search }) => {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    let query = supabase.from("parks").select("id, name, location, price, image_url");
    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      query = query.or(`name.ilike.${q},location.ilike.${q}`);
    }
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { parks: data ?? [] },
    };
  },
});