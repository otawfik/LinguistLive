import { GoogleGenAI } from "@google/genai";

// Live voice runs browser <-> Gemini over a WebSocket, so it can't be proxied like a normal
// request. Instead this mints a short-lived, single-use token locked to the one Live model
// this app uses — the real API key never leaves the server.
export const LIVE_MODEL = "gemini-2.5-flash-native-audio-preview-12-2025";

export async function POST(): Promise<Response> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return Response.json({ error: "GEMINI_API_KEY is not configured on the server." }, { status: 503 });
  try {
    const ai = new GoogleGenAI({ apiKey: key, httpOptions: { apiVersion: "v1alpha" } });
    const now = Date.now();
    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        expireTime: new Date(now + 30 * 60_000).toISOString(),
        newSessionExpireTime: new Date(now + 60_000).toISOString(),
        liveConnectConstraints: { model: LIVE_MODEL },
        httpOptions: { apiVersion: "v1alpha" },
      },
    });
    return Response.json({ token: token.name });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Could not create a session token." }, { status: 502 });
  }
}
