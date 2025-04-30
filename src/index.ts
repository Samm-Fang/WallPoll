import { Router } from 'itty-router';
import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
import { handleUpload } from './handlers/upload.js';
import { handleVote } from './handlers/vote.js';
import { handleGallery } from './handlers/gallery.js';
import { handleDownload } from './handlers/download.js';
import { handleAuth } from './handlers/auth.js';

const router = Router();

router.post('/api/auth', handleAuth);
router.post('/api/upload', handleUpload);
router.post('/api/vote', handleVote);
router.get('/api/gallery', handleGallery);
router.get('/api/download/:id', handleDownload);

// 静态文件服务
router.get('*', async (request, env, ctx) => {
  try {
    return await getAssetFromKV({
      request,
      waitUntil: (promise) => ctx.waitUntil(promise),
    }, {
      ASSET_NAMESPACE: env.__STATIC_CONTENT,
      ASSET_MANIFEST: env.__STATIC_CONTENT_MANIFEST,
    });
  } catch (e) {
    try {
      let notFoundResponse = await getAssetFromKV({
          request,
          waitUntil: (promise) => ctx.waitUntil(promise),
        }, {
          ASSET_NAMESPACE: env.__STATIC_CONTENT,
          ASSET_MANIFEST: env.__STATIC_CONTENT_MANIFEST,
          mapRequestToAsset: (req) => new Request(`${new URL(req.url).origin}/index.html`, req),
        });
      return new Response(notFoundResponse.body, { ...notFoundResponse, status: 200 });
    } catch (e) {}
    return new Response('Not Found', { status: 404 });
  }
});

export default {
  fetch: router.handle as unknown as (request: Request, env: Env, ctx: ExecutionContext) => Promise<Response>
};