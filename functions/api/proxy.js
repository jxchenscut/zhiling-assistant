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
      messages: messages.map(msg => {
        console.log('Processing message:', JSON.stringify(msg, null, 2));
        // 确保消息格式正确
        return {
          role: msg.role,
          content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
        };
      }),
      stream: false  // 强制禁用流式输出
    };

    console.log('发送到豆包的请求:', JSON.stringify(requestBody, null, 2));

    // 使用Bearer认证（和OpenAI SDK一致）
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    };

    console.log('使用的认证头:', JSON.stringify(authHeaders, null, 2));

    // 转发请求到豆包API
    const apiResponse = await fetch(ARK_API_URL, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(requestBody)
    });

    console.log('豆包API响应状态:', apiResponse.status);
    
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('豆包API错误:', errorText);
      return new Response(
        JSON.stringify({
          error: 'API Error',
          status: apiResponse.status,
          message: errorText,
          requestBody: requestBody,
          headers: authHeaders
        }, null, 2),
        {
          status: apiResponse.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    // 非流式响应
    const responseData = await apiResponse.json();
    return new Response(
      JSON.stringify(responseData),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );

  } catch (error) {
    console.error('代理服务器错误:', error);
    return new Response(
      JSON.stringify({
        error: '服务器内部错误',
        message: error.message,
        stack: error.stack
      }, null, 2),
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