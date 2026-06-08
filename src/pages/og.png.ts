import type { APIRoute } from "astro";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import config from "@/config";

export const GET: APIRoute = async () => {
  const imageBuffer = await readFile(
    join(process.cwd(), "public", config.site.ogImage)
  );

  return new Response(new Uint8Array(imageBuffer), {
    headers: { "Content-Type": "image/jpeg" },
  });
};
