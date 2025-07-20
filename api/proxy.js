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
    const { model, messages, stream, apiKey } = req.body;
    
    // 通义千问API配置
    const QWEN_API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

    if (!apiKey) {
      res.status(400).json({ error: 'Bad Request', message: 'API key is missing in the request.' });
      return;
    }

    // 构建请求体（OpenAI兼容格式）
    const requestBody = {
      model: model || 'qwen-plus',
      messages: messages,
      stream: stream || false
    };

    // 转发请求到通义千问API
    const response = await fetch(QWEN_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`通义千问API错误: ${response.status} ${response.statusText} - ${errorText}`);
    }

    // 如果是流式响应
    if (stream) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const reader = response.body.getReader();

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