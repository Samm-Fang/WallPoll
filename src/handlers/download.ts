import { Image } from '../types';

const KV_IMAGE_PREFIX = 'image:';

export async function handleDownload(request: Request): Promise<Response> {
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ success: false, message: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const url = new URL(request.url);
    const imageId = url.searchParams.get('id');

    if (!imageId) {
      return new Response(JSON.stringify({ success: false, message: 'No image ID provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const imageKey = `${KV_IMAGE_PREFIX}${imageId}`;
    const image: Image | null = await WALLPOLL_DATA.get(imageKey, { type: 'json' });

    if (!image) {
      return new Response(JSON.stringify({ success: false, message: 'Image not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // In a real implementation, you would fetch the image from storage or CDN
    // For now, we'll just return a redirect to the image URL
    return Response.redirect(image.url, 302);
  } catch (error) {
    console.error('Download error:', error);
    return new Response(JSON.stringify({ success: false, message: 'Download failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
