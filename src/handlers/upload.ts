import { User, Image, UploadResponse } from '../types';

const KV_USER_PREFIX = 'user:';
const KV_IMAGE_PREFIX = 'image:';

export async function handleUpload(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, message: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const formData = await request.formData();
    const userId = parseInt(formData.get('userId') as string, 10);
    const file = formData.get('file') as File;

    if (isNaN(userId) || userId < 1 || userId > 59) {
      return new Response(JSON.stringify({ success: false, message: 'Invalid user ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!file) {
      return new Response(JSON.stringify({ success: false, message: 'No file uploaded' }), {
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

    if (user.uploadedImage) {
      return new Response(JSON.stringify({ success: false, message: 'User has already uploaded an image' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const imageId = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const imageUrl = `https://your-image-hosting-service.com/${imageId}`; // Replace with actual image hosting service
    const image: Image = {
      id: imageId,
      url: imageUrl,
      uploaderId: userId,
      votes: 0,
      uploadDate: new Date().toISOString(),
    };

    await WALLPOLL_DATA.put(`${KV_IMAGE_PREFIX}${imageId}`, JSON.stringify(image));
    user.uploadedImage = imageId;
    await WALLPOLL_DATA.put(userKey, JSON.stringify(user));

    return new Response(JSON.stringify({ success: true, image }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return new Response(JSON.stringify({ success: false, message: 'Upload failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
