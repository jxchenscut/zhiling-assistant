export async function onRequest(context) {
  const { request } = context;

  // 处理 CORS 预检
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }

  // 仅允许 POST
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    const { model, messages, stream, apiKey } = body;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key missing' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const QWEN_API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

    const requestBody = {
      model: model || 'qwen-plus',
      messages: messages,
      stream: stream ?? false
    };

    const apiResponse = await fetch(QWEN_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      return new Response(errorText, { status: apiResponse.status });
    }

    // 直接透传结果
    return new Response(apiResponse.body, {
      status: apiResponse.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        ...(stream ? { 'Content-Type': 'text/plain; charset=utf-8' } : { 'Content-Type': 'application/json' })
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error', message: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 