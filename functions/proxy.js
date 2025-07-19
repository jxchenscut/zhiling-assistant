export async function onRequest(context) {
  const { request } = context;
  // 复制原有proxy.js逻辑
  // 设置CORS头
  const response = new Response();
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200 });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const body = await request.json();
    const { model, messages, stream } = body;
    const DOUBAO_API_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
    const API_KEY = '60db0a4b-6261-4b00-8727-34890003e8d1';
    const requestBody = { model: model || 'doubao-seed-1-6-250615', messages, stream: stream || true }; // 默认stream true
    console.log('Proxy: Calling API with model:', model); // 日志
    const apiResponse = await fetch(DOUBAO_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
      body: JSON.stringify(requestBody)
    });
    if (!apiResponse.ok) {
      console.error('Proxy Error:', apiResponse.status);
      throw new Error(`API Error: ${apiResponse.status}`);
    }
    console.log('Proxy: API response OK'); // 日志
    if (stream) {
      // 直接pipe body以保持SSE格式
      return new Response(apiResponse.body, {
        status: apiResponse.status,
        headers: apiResponse.headers
      });
    } else {
      const data = await apiResponse.json();
      return new Response(JSON.stringify(data), { status: 200 });
    }
  } catch (error) {
    console.error('Proxy Server Error:', error);
    return new Response(JSON.stringify({ error: '服务器错误', message: error.message }), { status: 500 });
  }
} 