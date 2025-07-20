// controllers/bookAIController.js
const axios = require("axios");
require("dotenv").config();

const COHERE_API_KEY = process.env.COHERE_API_KEY;

/**
 * Helper function to get AI response from Cohere API.
 */
async function getAIResponse(message) {
  try {
    const response = await axios.post(
      "https://api.cohere.ai/v1/chat",
      {
        message,
        chat_history: [
          {
            role: "user",
            message:
              "You are a helpful assistant that only recommends books and answers only about books or book genres.",
          },
        ],
        max_tokens: 40,
        temperature: 0.4,
        model: "command-r-plus",
      },
      {
        headers: {
          Authorization: `Bearer ${COHERE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = response.data;
    return data.text || "No response from AI.";
  } catch (error) {
    console.error("Cohere API ERROR:", error.response?.data || error);
    return "❌ Error communicating with Cohere AI.";
  }
}

/**
 * Controller for AI chat
 */
exports.chatWithAI = async (req, res) => {
  const userMessage = req.body.message;

  if (!userMessage || userMessage.trim() === "") {
    return res.status(400).json({ reply: "Message cannot be empty." });
  }

  try {
    const aiReply = await getAIResponse(userMessage);
    res.json({ reply: aiReply });
  } catch (err) {
    console.error("Controller Error:", err);
    res.status(500).json({ reply: "Something went wrong." });
  }
};
