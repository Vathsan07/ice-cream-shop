export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const webhookUrl = "https://hook.us2.make.com/fyext0qe7r45x69j2bkq6q9ic8qb26ta"; // your Make webhook
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: "Make webhook failed" });
    }

    const data = await response.text();
    return res.status(200).json({ success: true, response: data });
  } catch (err) {
    console.error("Error proxying to Make:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
