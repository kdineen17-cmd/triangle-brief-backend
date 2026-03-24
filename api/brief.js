import fetch from "node-fetch";

// Load environment variables (safer than hardcoding keys!)
const NEWS_API_KEY = process.env.NEWSDATA_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export default async function handler(req, res) {
  try {
    // 1. Fetch latest news
    const newsResponse = await fetch(
      `https://newsdata.io/api/1/news?apikey=${NEWS_API_KEY}&language=en`
    );
    const newsData = await newsResponse.json();

    if (!newsData.results || newsData.results.length === 0) {
      return res.status(404).json({ error: "No news found" });
    }

    // Pick top 1–3 articles
    const topArticles = newsData.results.slice(0, 3);

    // 2. Generate write-up via OpenAI
    const prompt = `Write a short marketing-style summary for these news headlines in alignment with my brand messaging:\n\n${topArticles
      .map((a, i) => `${i + 1}. ${a.title} - ${a.link}`)
      .join("\n")}`;

    const openAIResponse = await fetch("https://api.openai.com/v1/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "text-davinci-003",
        prompt,
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    const openAIData = await openAIResponse.json();

    const writeUp = openAIData.choices?.[0]?.text?.trim() || "";

    // 3. Return JSON to frontend
    res.status(200).json({
      news: topArticles,
      writeUp,
    });
  } catch (error) {
    console.error("Error in brief.js:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
