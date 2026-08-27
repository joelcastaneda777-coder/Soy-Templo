import { NextResponse } from "next/server";

const URLS = [
  "https://esbiblia.net/api/versions/",
  "https://esbiblia.net/api/books/",
  "https://esbiblia.net/api/view/NUM/1/",
];

export async function GET() {
  const results = [];

  for (const url of URLS) {
    try {
      const response = await fetch(url, {
        cache: "no-store",
        redirect: "follow",
        headers: {
          Accept: "application/json",
          "User-Agent": "SoyTemplo/1.0",
        },
      });

      const text = await response.text();
      let parsed: unknown = null;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = null;
      }

      results.push({
        url,
        status: response.status,
        ok: response.ok,
        finalUrl: response.url,
        contentType: response.headers.get("content-type"),
        parsedType: Array.isArray(parsed) ? "array" : parsed === null ? "non-json" : typeof parsed,
        topLevelKeys:
          parsed && typeof parsed === "object" && !Array.isArray(parsed)
            ? Object.keys(parsed as Record<string, unknown>).slice(0, 20)
            : [],
        sample:
          parsed && typeof parsed === "object"
            ? JSON.stringify(parsed).slice(0, 3000)
            : text.slice(0, 1200),
      });
    } catch (error) {
      results.push({
        url,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return NextResponse.json({ results });
}
