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
    const DOUBAO_API_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
    const API_KEY = '60db0a4b-6261-4b00-8727-34890003e8d1'; // 已更新为用户提供的Key

    // 构建请求体（支持多模态）
    const requestBody = {
      model: model || 'doubao-seed-1-6-250615',
      messages: messages,
      stream: stream || false
    };

    // 转发请求到豆包API
    const response = await fetch(DOUBAO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`豆包API错误: ${response.status} ${response.statusText}`);
    }

    // 如果是流式响应
    if (stream) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const reader = response.body.getReader();
      const encoder = new TextEncoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = new TextDecoder().decode(value);
        res.write(chunk);
      }
      
      res.end();
    } else {
      // 非流式响应
      const data = await response.json();
      res.json(data);
    }

  } catch (error) {
    console.error('代理服务器错误:', error);
    res.status(500).json({ 
      error: '服务器内部错误',
      message: error.message 
    });
  }
} 