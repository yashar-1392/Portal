import { handleApiRequest } from '../server/appRouter.ts';
import type { SchoolKVStore } from '../server/kv/kvStore.ts';

export interface CloudflareEnv {
  SCHOOL_KV?: SchoolKVStore;
  MEMORY?: SchoolKVStore;
  GEMINI_API_KEY?: string;
  AI_SERVER_URL?: string;
  AUTH_SERVER_URL?: string;
  SESSION_SECRET?: string;
  ADMIN_SETUP_KEY?: string;
  APP_ORIGIN?: string;
  ASSETS?: {
    fetch(request: Request): Promise<Response>;
  };
}

export default {
  async fetch(request: Request, env: CloudflareEnv): Promise<Response> {
    const url = new URL(request.url);
    const kv = env.SCHOOL_KV ?? env.MEMORY;

    if (url.pathname.startsWith('/api/')) {
      if (!kv) {
        return new Response(JSON.stringify({ error: 'فضای ذخیره‌سازی KV به Worker متصل نشده است.' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        });
      }
      return handleApiRequest(request, {
        SCHOOL_KV: kv,
        GEMINI_API_KEY: env.GEMINI_API_KEY,
        AI_SERVER_URL: env.AI_SERVER_URL,
        AUTH_SERVER_URL: env.AUTH_SERVER_URL,
        SESSION_SECRET: env.SESSION_SECRET,
        ADMIN_SETUP_KEY: env.ADMIN_SETUP_KEY,
        APP_ORIGIN: env.APP_ORIGIN,
      });
    }

    if (env.ASSETS) {
      const assetRes = await env.ASSETS.fetch(request);
      if (assetRes.status !== 404) {
        return assetRes;
      }
      // SPA fallback to index.html
      const indexUrl = new URL('/index.html', url.origin);
      return env.ASSETS.fetch(new Request(indexUrl.toString(), request));
    }

    return new Response('سامانه دبیرستان استعدادهای درخشان استاد شهریار - Cloudflare Worker آماده است.', {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  },
};
