export async function handleAuth(request: Request, env: any): Promise<Response> {
  const body = await request.json();
  const userId = body.userId;

  if (!userId || userId < 1 || userId > 59) {
    return new Response(JSON.stringify({ error: 'Invalid user ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 这里可以添加更多的认证逻辑，如果需要的话
  return new Response(JSON.stringify({ userId }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
