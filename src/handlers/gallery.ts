import { Image, GalleryResponse } from '../types';

const KV_IMAGE_PREFIX = 'image:';

export async function handleGallery(request: Request): Promise<Response> {
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ success: false, message: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const images: Image[] = [];
    const keys = await WALLPOLL_DATA.list({ prefix: KV_IMAGE_PREFIX });

    for (const key of keys.keys) {
      const image: Image | null = await WALLPOLL_DATA.get(key.name, { type: 'json' });
      if (image) {
        images.push(image);
      }
    }

    images.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());

    return new Response(JSON.stringify({ success: true, images }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Gallery error:', error);
    return new Response(JSON.stringify({ success: false, message: 'Failed to load gallery' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
