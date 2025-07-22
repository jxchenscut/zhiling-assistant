export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 只允许POST请求
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { model, messages, stream } = req.body;
    
    // 豆包API配置
    const ARK_API_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
    const API_KEY = '60db0a4b-6261-4b00-8727-34890003e8d1';

    // 硬编码测试请求
    const testRequestBody = {
      model: 'doubao-seed-1-6-250615',
      messages: [{ role: 'user', content: '你好' }],
      stream: false
    };

    console.log('Vercel代理 - 测试请求:', JSON.stringify(testRequestBody, null, 2));

    // 转发请求到豆包API
    const response = await fetch(ARK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(testRequestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('豆包API错误:', errorText);
      throw new Error(`豆包API错误: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('代理服务器错误:', error);
    res.status(500).json({ 
      error: '服务器内部错误',
      message: error.message 
    });
  }
} 