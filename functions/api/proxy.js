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
    console.log('收到前端请求:', JSON.stringify(body, null, 2));
    
    const { model, messages, stream } = body;
    
    // 豆包API配置
    const ARK_API_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
    const API_KEY = '60db0a4b-6261-4b00-8727-34890003e8d1';

    // 构建请求体
    const requestBody = {
      model: model || 'doubao-seed-1-6-250615',
      messages: messages,
      stream: stream || false
    };

    console.log('发送到豆包的请求:', JSON.stringify(requestBody, null, 2));

    // 转发请求到豆包API
    const apiResponse = await fetch(ARK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': API_KEY  // 直接使用 API Key，不需要任何前缀
      },
      body: JSON.stringify(requestBody)
    });

    console.log('豆包API响应状态:', apiResponse.status);
    
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('豆包API错误:', errorText);
      return new Response(errorText, {
        status: apiResponse.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // 流式或普通响应直接透传
    const response = new Response(apiResponse.body, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': stream ? 'text/event-stream' : 'application/json',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

    console.log('返回给前端的响应状态:', response.status);
    return response;

  } catch (error) {
    console.error('代理服务器错误:', error);
    return new Response(
      JSON.stringify({ error: '服务器内部错误', message: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
} 