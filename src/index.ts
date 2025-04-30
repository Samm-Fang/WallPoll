import { Router } from 'itty-router';
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
router.get('*', async ({ url }) => {
  const path = new URL(url).pathname;
  if (path === '/' || path.startsWith('/index.html')) {
    return new Response(await fetchAsset('index.html'), {
      headers: { 'Content-Type': 'text/html' }
    });
  } else if (path.startsWith('/css/')) {
    return new Response(await fetchAsset(path.slice(1)), {
      headers: { 'Content-Type': 'text/css' }
    });
  } else if (path.startsWith('/ts/')) {
    return new Response(await fetchAsset(path.slice(1)), {
      headers: { 'Content-Type': 'application/javascript' }
    });
  }
  return new Response('Not found', { status: 404 });
});

async function fetchAsset(path: string): Promise<ArrayBuffer> {
  // 在实际部署中，静态文件会通过Cloudflare Pages或其他方式提供
  // 这里仅作示例
  return new ArrayBuffer(0);
}

export default {
  fetch: router.handle
};
