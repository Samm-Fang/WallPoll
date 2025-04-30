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

// 静态文件服务 - 使用@cloudflare/kv-asset-handler
// 将静态文件服务路由移到最后
router.get('*', async (request, env, ctx) => { // 确保包含 ctx 参数
  try {
    // 使用Cloudflare Workers Sites推荐的方式
    // @ts-ignore - 忽略类型检查，因为env.__STATIC_CONTENT等是运行时注入的
    return await getAssetFromKV({
      request,
      waitUntil: (promise) => ctx.waitUntil(promise), // 使用 ctx.waitUntil
    }, {
      // @ts-ignore
      ASSET_NAMESPACE: env.__STATIC_CONTENT,
      // @ts-ignore
      ASSET_MANIFEST: env.__STATIC_CONTENT_MANIFEST,
    });
  } catch (e) {
    // 如果找不到资源，尝试返回 index.html (适用于SPA)
    try {
      // @ts-ignore
      let notFoundResponse = await getAssetFromKV({
          request,
          waitUntil: (promise) => ctx.waitUntil(promise), // 使用 ctx.waitUntil
        }, {
          // @ts-ignore
          ASSET_NAMESPACE: env.__STATIC_CONTENT,
          // @ts-ignore
          ASSET_MANIFEST: env.__STATIC_CONTENT_MANIFEST,
          mapRequestToAsset: (req: Request) => new Request(`${new URL(req.url).origin}/index.html`, req),
        });

      return new Response(notFoundResponse.body, { ...notFoundResponse, status: 200 });
    } catch (e) {}

    return new Response('Not Found', { status: 404 });
  }
});

export default {
  fetch: router.handle as unknown as (request: Request, env: Env, ctx: ExecutionContext) => Promise<Response>
};
