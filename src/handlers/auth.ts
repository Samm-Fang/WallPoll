import { User, AuthResponse } from '../types';

const KV_USER_PREFIX = 'user:';

export async function handleAuth(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, message: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json() as { userId: string };
    const userId = parseInt(body.userId, 10);

    if (isNaN(userId) || userId < 1 || userId > 59) {
      return new Response(JSON.stringify({ success: false, message: 'Invalid user ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userKey = `${KV_USER_PREFIX}${userId}`;
    let user: User | null = await WALLPOLL_DATA.get(userKey, { type: 'json' });

    if (!user) {
      user = { id: userId, votes: [] };
      await WALLPOLL_DATA.put(userKey, JSON.stringify(user));
    }

    return new Response(JSON.stringify({ success: true, user }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, message: 'Authentication failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
