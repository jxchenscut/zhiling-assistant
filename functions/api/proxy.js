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

    // 获取 Cloudflare 环境信息
    const cfInfo = {
      country: request.cf?.country,
      city: request.cf?.city,
      ip: request.headers.get('cf-connecting-ip'),
      colo: request.cf?.colo,
      userAgent: request.headers.get('user-agent')
    };
    
    console.log('Cloudflare环境信息:', JSON.stringify(cfInfo, null, 2));

    // 完全模拟 Python OpenAI SDK 的请求
    const testRequestBody = {
      model: 'doubao-seed-1-6-250615',
      messages: [
        {
          role: 'user', 
          content: '你好'
        }
      ]
    };

    // 尝试多种认证方式
    const authMethods = [
      { name: 'Bearer Token', headers: { 'Authorization': `Bearer ${API_KEY}` } },
      { name: 'Direct Key', headers: { 'Authorization': API_KEY } },
      { name: 'API Key Header', headers: { 'Api-Key': API_KEY } },
      { name: 'X-API-Key Header', headers: { 'X-API-Key': API_KEY } }
    ];

    let allResults = [];

    for (const method of authMethods) {
      try {
        console.log(`尝试认证方式: ${method.name}`);
        
        const headers = {
          'Content-Type': 'application/json',
          'User-Agent': 'openai-python/1.0.0',
          ...method.headers
        };

        const response = await fetch(ARK_API_URL, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(testRequestBody)
        });

        const responseText = await response.text();
        
        allResults.push({
          method: method.name,
          status: response.status,
          success: response.ok,
          response: response.ok ? JSON.parse(responseText) : responseText,
          headers: Object.fromEntries(response.headers.entries())
        });

        // 如果成功就返回结果
        if (response.ok) {
          console.log(`认证成功: ${method.name}`);
          return new Response(responseText, {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }

      } catch (error) {
        allResults.push({
          method: method.name,
          error: error.message
        });
      }
    }

    // 如果所有方法都失败，返回详细信息
    return new Response(
      JSON.stringify({
        error: 'All authentication methods failed',
        cloudflareInfo: cfInfo,
        testResults: allResults,
        message: '在Cloudflare环境中测试了多种认证方式，但都失败了。这可能是IP限制或网络环境问题。'
      }, null, 2),
      {
        status: 401,
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