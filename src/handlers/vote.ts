export async function handleVote(request: Request, env: any): Promise<Response> {
  // 这里实现投票逻辑
  // 用户最多投两票，不能投给自己
  return new Response(JSON.stringify({ message: 'Vote functionality not implemented yet' }), {
    status: 501,
    headers: { 'Content-Type': 'application/json' }
  });
}
