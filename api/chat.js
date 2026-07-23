export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { messages, system } = req.body || {};
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      res.status(500).json({ error: 'חסר OPENAI_API_KEY בהגדרות הפרויקט ב-Vercel' });
      return;
    }

    const openaiMessages = [
      { role: 'system', content: system || 'את/ה עוזר/ת מקצועי/ת.' },
      ...(Array.isArray(messages) ? messages : []).map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: String(m.content || '')
      }))
    ];

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: openaiMessages,
        max_tokens: 700,
        temperature: 0.6
      })
    });

    const data = await r.json();

    if (data.error) {
      res.status(500).json({ error: data.error.message || 'שגיאה מ-OpenAI' });
      return;
    }

    const text = data.choices && data.choices[0] && data.choices[0].message
      ? data.choices[0].message.content
      : '';

    res.status(200).json({ text });
  } catch (err) {
    res.status(500).json({ error: String(err && err.message ? err.message : err) });
  }
}
