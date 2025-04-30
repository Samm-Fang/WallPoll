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

import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

// 静态文件服务
router.get('*', async ({ url }, env) => {
  const path = new URL(url).pathname;
  try {
    const asset = await getAssetFromKV(env.ASSETS, path === '/' ? '/index.html' : path);
    const contentType = path.endsWith('.html') ? 'text/html' : 
                        path.endsWith('.css') ? 'text/css' : 
                        path.endsWith('.ts') || path.endsWith('.js') ? 'application/javascript' : 'text/plain';
    return new Response(asset.body, {
      headers: { 'Content-Type': contentType }
    });
  } catch (e) {
    return new Response('Not found', { status: 404 });
  }
});

export default {
  fetch: router.handle
};
