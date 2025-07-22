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
    
    // 豆包API配置
    const ARK_API_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
    const API_KEY = '60db0a4b-6261-4b00-8727-34890003e8d1';

    // 硬编码一个简单的测试请求（和你本地测试完全一样）
    const testRequestBody = {
      model: 'doubao-seed-1-6-250615',
      messages: [
        {
          role: 'user',
          content: '你好'
        }
      ],
      stream: false
    };

    console.log('测试请求体:', JSON.stringify(testRequestBody, null, 2));

    // 使用和 OpenAI SDK 完全一样的认证方式
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    };

    console.log('认证头:', JSON.stringify(headers, null, 2));

    // 发送请求
    const apiResponse = await fetch(ARK_API_URL, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(testRequestBody)
    });

    console.log('API响应状态:', apiResponse.status);
    console.log('API响应头:', JSON.stringify(Object.fromEntries(apiResponse.headers.entries()), null, 2));

    const responseText = await apiResponse.text();
    console.log('API响应内容:', responseText);

    if (!apiResponse.ok) {
      return new Response(
        JSON.stringify({
          error: 'Cloudflare网络测试',
          status: apiResponse.status,
          response: responseText,
          testRequestBody: testRequestBody,
          headers: headers,
          message: '这是在Cloudflare环境下的测试，和本地Python测试完全相同的请求'
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

    // 成功的话返回结果
    return new Response(responseText, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('代理服务器错误:', error);
    return new Response(
      JSON.stringify({
        error: '网络请求失败',
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