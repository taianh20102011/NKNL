// /api/analyze.js
export default async function handler(req, res) {
  try {
    const { summary } = await req.json();

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Bạn là AI chuyên phân tích biểu đồ năng lực cá nhân." },
          { role: "user", content: `Phân tích dữ liệu biểu đồ năng lực:\n${summary}` }
        ]
      })
    });

    const data = await response.json();
    res.status(200).json({ result: data.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
