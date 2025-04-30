/**
 * Welcome to Cloudflare Workers!
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

// Define interfaces for Cloudflare bindings (KV, R2)
// These will be properly typed after running `npm run cf-typegen` once bindings are added in wrangler.jsonc
export interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace;
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	// MY_BUCKET: R2Bucket;
	// Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
	// MY_SERVICE: Fetcher;
	// Example binding to a Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace;

    // We will define our bindings here later
    WALLPOLL_KV: KVNamespace;
    WALLPOLL_IMAGES: R2Bucket;
    ASSETS: Fetcher; // Added for static asset serving
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

		// Basic Router
		try {
			if (url.pathname === '/' && request.method === 'GET') {
                // Serve the frontend HTML using the ASSETS binding
                // Cloudflare Workers automatically maps '/' to '/index.html' for asset fetching
                // if the directory option is used in wrangler.jsonc, so we can just pass the original request.
                try {
                    // Assuming env.ASSETS is bound via wrangler.jsonc { "binding": "ASSETS", "directory": "./public" }
                    return env.ASSETS.fetch(request);
                } catch (e) {
                    // If ASSETS binding is not configured or fails, return a fallback
                    console.error('Failed to fetch from ASSETS:', e);
                    return new Response('Frontend not available.', { status: 500 });
                }
			}

            if (url.pathname.startsWith('/api/')) {
                // API Routes
                if (url.pathname === '/api/login' && request.method === 'POST') {
                    // Handle login
                    return handleLogin(request, env);
                }
                if (url.pathname === '/api/upload' && request.method === 'POST') {
                    // Handle image upload
                    return handleUpload(request, env);
                }
                if (url.pathname === '/api/vote' && request.method === 'POST') {
                    // Handle voting
                    return handleVote(request, env);
                }
                if (url.pathname === '/api/gallery' && request.method === 'GET') {
                    // Handle getting gallery data
                    return handleGetGallery(request, env);
                }
                 if (url.pathname.startsWith('/images/') && request.method === 'GET') {
                    // Handle serving images from R2
                    return handleGetImage(request, env);
                }
            }

            // If the request is not for the root path or an API endpoint,
            // try fetching it as a static asset (e.g., CSS, JS)
            if (request.method === 'GET') {
                try {
                    return env.ASSETS.fetch(request);
                } catch (e) {
                    // If asset not found or ASSETS binding fails, continue to 404
                    console.warn(`Failed to fetch asset ${url.pathname}:`, e);
                }
            }

			// Fallback for other routes
			return new Response('Not Found', { status: 404 });
		} catch (e: any) {
			console.error('Error handling request:', e);
			return new Response(`Internal Server Error: ${e.message}`, { status: 500 });
		}
	},
} satisfies ExportedHandler<Env>;

// --- API Handler Functions ---

async function handleLogin(request: Request, env: Env): Promise<Response> {
    // Placeholder: Implement user ID validation (1-59)
    const { userId } = await request.json<{ userId: string }>();
    const id = parseInt(userId, 10);
    if (isNaN(id) || id < 1 || id > 59) {
        return new Response(JSON.stringify({ success: false, message: 'Invalid User ID' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    // In a real app, you might generate a session token here
    return new Response(JSON.stringify({ success: true, userId: id }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

async function handleUpload(request: Request, env: Env): Promise<Response> {
    console.log('Upload request received');
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('multipart/form-data')) {
        return new Response(JSON.stringify({ success: false, message: 'Invalid Content-Type. Expected multipart/form-data.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    try {
        const formData = await request.formData();
        const userIdStr = formData.get('userId') as string;
        const file = formData.get('image') as File; // Assuming the file input name is 'image'

        if (!userIdStr || !file) {
            return new Response(JSON.stringify({ success: false, message: 'Missing userId or image file in form data.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        const userId = parseInt(userIdStr, 10);
        if (isNaN(userId) || userId < 1 || userId > 59) {
             return new Response(JSON.stringify({ success: false, message: 'Invalid User ID in form data.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        // --- KV/R2 Operations ---

        // 1. Check if user already uploaded (using KV)
        const userDataKey = `user:${userId}`;
        const existingUserData = await env.WALLPOLL_KV.get<UserData>(userDataKey, 'json');
        if (existingUserData?.uploadedImageId) {
            return new Response(JSON.stringify({ success: false, message: 'User has already uploaded an image.' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
        }

        // 2. Generate unique image ID and R2 key
        const imageId = `img-${userId}-${Date.now()}`;
        // Sanitize file name for R2 key (optional, but good practice)
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const r2Key = `${imageId}-${sanitizedFileName}`;

        // 3. Upload to R2
        console.log(`Uploading ${r2Key} to R2...`);
        await env.WALLPOLL_IMAGES.put(r2Key, file.stream(), {
            httpMetadata: { contentType: file.type },
        });
        console.log(`Upload successful: ${r2Key}`);

        // 4. Store image metadata in KV
        const imageData: ImageData = {
            imageId: imageId,
            uploaderId: userId,
            r2Key: r2Key,
            uploadTimestamp: Date.now(),
            votes: 0,
        };
        const imageMetaKey = `image:${imageId}`;
        await env.WALLPOLL_KV.put(imageMetaKey, JSON.stringify(imageData));

        // 5. Update user data in KV
        const updatedUserData: UserData = { ...(existingUserData || { userId, votesCast: {} }), uploadedImageId: imageId };
        await env.WALLPOLL_KV.put(userDataKey, JSON.stringify(updatedUserData));

        // --- End KV/R2 Operations ---

        console.log(`Upload logic for user ${userId}, image ${file.name} (ID: ${imageId}) completed.`);
        return new Response(JSON.stringify({ success: true, message: 'Upload successful!', imageId: imageId, r2Key: r2Key }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (e: any) {
        console.error('Error handling upload:', e);
        return new Response(JSON.stringify({ success: false, message: `Internal Server Error: ${e.message}` }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}

async function handleVote(request: Request, env: Env): Promise<Response> {
    console.log('Vote request received');
    try {
        const { userId, imageId } = await request.json<{ userId: number; imageId: string }>();

        if (!userId || !imageId || userId < 1 || userId > 59) {
            return new Response(JSON.stringify({ success: false, message: 'Invalid userId or imageId in request body.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        // --- KV Operations ---

        // 1. Get user data
        const userDataKey = `user:${userId}`;
        const userData = await env.WALLPOLL_KV.get<UserData>(userDataKey, 'json');
        // Initialize userData if it doesn't exist (e.g., first login/action)
        const currentUserData = userData || { userId, votesCast: {}, uploadedImageId: undefined };

        // 2. Get image data
        const imageMetaKey = `image:${imageId}`;
        const imageData = await env.WALLPOLL_KV.get<ImageData>(imageMetaKey, 'json');
        if (!imageData) {
            return new Response(JSON.stringify({ success: false, message: 'Image data not found.' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
        }

        // 3. Check rules
        if (imageData.uploaderId === userId) {
            return new Response(JSON.stringify({ success: false, message: 'Cannot vote for your own image.' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
        }
        const votesCastForThisImage = currentUserData.votesCast[imageId] || 0;
        const totalVotesCast = Object.values(currentUserData.votesCast).reduce((sum, count) => sum + count, 0);

        if (totalVotesCast >= 2) {
            return new Response(JSON.stringify({ success: false, message: 'You have already cast the maximum number of votes (2).' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
        }
        // This check prevents casting a 3rd vote if the user tries to vote twice for the same image when they have 1 vote left.
        // It's implicitly handled by the totalVotesCast >= 2 check above, but kept for clarity.
        // if (votesCastForThisImage >= 1 && totalVotesCast >= 2) { ... }

        // 4. Update vote counts (atomicity might need consideration in a high-contention scenario, but likely fine for this scale)
        imageData.votes += 1;
        currentUserData.votesCast[imageId] = votesCastForThisImage + 1;

        // 5. Put updated data back into KV
        await env.WALLPOLL_KV.put(imageMetaKey, JSON.stringify(imageData));
        await env.WALLPOLL_KV.put(userDataKey, JSON.stringify(currentUserData));

        // --- End KV Operations ---

        console.log(`Vote recorded for user ${userId} on image ${imageId}. New vote count: ${imageData.votes}`);
        return new Response(JSON.stringify({ success: true, message: 'Vote successful!', newVoteCount: imageData.votes }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (e: any) {
        console.error('Error handling vote:', e);
        if (e instanceof SyntaxError) { // Handle invalid JSON
             return new Response(JSON.stringify({ success: false, message: 'Invalid JSON in request body.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify({ success: false, message: `Internal Server Error: ${e.message}` }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}

async function handleGetGallery(request: Request, env: Env): Promise<Response> {
    console.log('Get gallery request received');
    try {
        // --- KV Operations ---

        // 1. List all image keys from KV
        const listResult = await env.WALLPOLL_KV.list({ prefix: 'image:' });
        const imageKeys = listResult.keys;

        // 2. Fetch data for each image key
        const galleryPromises = imageKeys.map(key => env.WALLPOLL_KV.get<ImageData>(key.name, 'json'));
        let galleryData = (await Promise.all(galleryPromises)).filter(data => data !== null) as ImageData[];

        // --- End KV Operations ---

        // Sort gallery by votes (descending), then by upload timestamp (descending)
        galleryData.sort((a, b) => b.votes - a.votes || b.uploadTimestamp - a.uploadTimestamp);

        console.log(`Fetched gallery data. Count: ${galleryData.length}`);
        return new Response(JSON.stringify({ success: true, gallery: galleryData }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (e: any) {
        console.error('Error handling get gallery:', e);
        return new Response(JSON.stringify({ success: false, message: `Internal Server Error: ${e.message}` }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}

async function handleGetImage(request: Request, env: Env): Promise<Response> {
    // Fetch image from R2 based on path
    const url = new URL(request.url);
    const objectKey = url.pathname.substring('/images/'.length);

    if (!objectKey) {
        return new Response('Object key missing', { status: 400 });
    }

    try {
        const object = await env.WALLPOLL_IMAGES.get(objectKey);

        if (object === null) {
            return new Response('Object Not Found', { status: 404 });
        }

        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);
        // Optional: Add cache control headers
        // headers.set('Cache-Control', 'public, max-age=3600');

        return new Response(object.body, {
            headers,
        });
    } catch (e: any) {
        console.error(`Error fetching image ${objectKey}:`, e);
        return new Response('Error fetching image', { status: 500 });
    }
}

// --- Helper Types ---
interface UserData {
    userId: number;
    uploadedImageId?: string;
    votesCast: { [imageId: string]: number }; // imageId -> count (1 or 2)
}

interface ImageData {
    imageId: string;
    uploaderId: number;
    r2Key: string;
    uploadTimestamp: number;
    votes: number;
}
