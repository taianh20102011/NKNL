// api/analyze.js
export default async function handler(req, res) {
  try {
    const { summary } = await req.json();
    if (!summary) {
      return res.status(400).json({ error: "Missing summary" });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Bạn là AI chuyên phân tích dữ liệu biểu đồ năng lực cá nhân." },
          { role: "user", content: `Phân tích dữ liệu:\n${summary}` }
        ]
      })
    });

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || "Không phân tích được dữ liệu.";
    res.status(200).json({ result });
  } catch (err) {
    console.error("Error in analyze API:", err);
    res.status(500).json({ error: err.message });
  }
}
