import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
import { handleAuth } from './handlers/auth';
import { handleUpload } from './handlers/upload';
import { handleVote } from './handlers/vote';
import { handleGallery } from './handlers/gallery';
import { handleDownload } from './handlers/download';

addEventListener('fetch', (event: FetchEvent) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  // API endpoints
  if (path.startsWith('/api/auth')) {
    return await handleAuth(request);
  } else if (path.startsWith('/api/upload')) {
    return await handleUpload(request);
  } else if (path.startsWith('/api/vote')) {
    return await handleVote(request);
  } else if (path.startsWith('/api/gallery')) {
    return await handleGallery(request);
  } else if (path.startsWith('/api/download')) {
    return await handleDownload(request);
  }

  // Serve static files
  try {
    return await getAssetFromKV({
      request,
      waitUntil(promise: Promise<any>) {
        return (self as any).waitUntil(promise);
      },
    });
  } catch (e) {
    return new Response('Not found', { status: 404 });
  }
}
