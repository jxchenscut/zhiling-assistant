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
    // 支持多模态messages（基于官方示例）
    const requestBody = { 
      model: model || 'doubao-seed-1-6-250615', // 官方示例模型
      messages: messages.map(msg => ({
        role: msg.role,
        content: Array.isArray(msg.content) ? msg.content : [{ text: msg.content, type: 'text' }] // 兼容数组/字符串
      })),
      stream: stream ?? true // 默认true，支持流式
    };
    console.log('Proxy: Calling API with body:', JSON.stringify(requestBody));
    const apiResponse = await fetch(DOUBAO_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
      body: JSON.stringify(requestBody)
    });
    console.log('Proxy: API status:', apiResponse.status);
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('Proxy Error Details:', errorText);
      throw new Error(`API Error: ${apiResponse.status} - ${errorText}`);
    }
    const responseBody = await (requestBody.stream ? apiResponse.blob() : apiResponse.text());
    console.log('Proxy: Response content preview:', (await responseBody.text()).slice(0, 100)); // 日志预览
    if (requestBody.stream) {
      return new Response(apiResponse.body, {
        status: apiResponse.status,
        headers: apiResponse.headers
      });
    } else {
      return new Response(responseBody, { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
  } catch (error) {
    console.error('Proxy Server Error:', error);
    return new Response(JSON.stringify({ error: '服务器错误', message: error.message }), { status: 500 });
  }
} 