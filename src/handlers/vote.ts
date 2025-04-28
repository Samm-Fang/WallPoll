import { User, Image, VoteResponse } from '../types';

const KV_USER_PREFIX = 'user:';
const KV_IMAGE_PREFIX = 'image:';

export async function handleVote(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, message: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const userId = parseInt(body.userId, 10);
    const imageId = body.imageId as string;

    if (isNaN(userId) || userId < 1 || userId > 59) {
      return new Response(JSON.stringify({ success: false, message: 'Invalid user ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!imageId) {
      return new Response(JSON.stringify({ success: false, message: 'No image ID provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userKey = `${KV_USER_PREFIX}${userId}`;
    const user: User | null = await WALLPOLL_DATA.get(userKey, { type: 'json' });

    if (!user) {
      return new Response(JSON.stringify({ success: false, message: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (user.uploadedImage === imageId) {
      return new Response(JSON.stringify({ success: false, message: 'Cannot vote for own image' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (user.votes.length >= 2) {
      return new Response(JSON.stringify({ success: false, message: 'Maximum votes reached' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (user.votes.includes(imageId)) {
      return new Response(JSON.stringify({ success: false, message: 'Already voted for this image' }), {
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

    image.votes += 1;
    user.votes.push(imageId);

    await WALLPOLL_DATA.put(imageKey, JSON.stringify(image));
    await WALLPOLL_DATA.put(userKey, JSON.stringify(user));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Vote error:', error);
    return new Response(JSON.stringify({ success: false, message: 'Vote failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
