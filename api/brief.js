module.exports = async function handler(req, res) { 
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const newsRes = await fetch(
      `https://newsdata.io/api/1/news?apikey=${process.env.NEWSDATA_API_KEY}&country=us&language=en&category=top`
    );

    const news = await newsRes.json();

    const articles = (news.results || []).slice(0, 5).map(a => ({
      title: a.title,
      description: a.description,
      source: a.source_id
    }));

    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content: `You are a broadcast news writer. Return ONLY JSON.`
          },
          {
            role: "user",
            content: `Here are today's headlines:\n${JSON.stringify(articles)}`
          }
        ]
      })
    });

    const aiData = await aiRes.json();
    const text = aiData.choices[0].message.content;

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch[0]);

    res.status(200).json(parsed);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
