require('dotenv').config();
const cors = require('cors');

const express = require('express');
const axios = require('axios');
const { OpenAI } = require("openai");

const app = express();
app.use(cors());
app.use(express.json());
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MCP_BASE_URL = process.env.MCP_SERVER_URL || "http://localhost:3000";

const mcpFunction = {
  name: "get_ticket_context",
  description: "Returns customer or org context from Zendesk using a ticket ID, user ID, or organization ID",
  parameters: {
    type: "object",
    properties: {
      ticket_id: { type: "integer", description: "Zendesk ticket ID" },
      user_id: { type: "integer", description: "Zendesk user ID" },
      organization_id: { type: "integer", description: "Zendesk org ID" }
    },
    required: []
  }
};

app.post('/chat', async (req, res) => {
  const userMessage = req.body.message;
  if (!userMessage) return res.status(400).json({ error: "Missing 'message' in request body." });

  try {
    // Step 1: Ask GPT to decide what function to call
    const initialResponse = await openai.chat.completions.create({
      model: "gpt-4-0613",
      messages: [
        { role: "system", content: "You are an assistant that can fetch customer, user, and organization info from a Zendesk MCP server." },
        { role: "user", content: userMessage }
      ],
      functions: [mcpFunction],
      function_call: "auto"
    });

    const choice = initialResponse.choices[0].message;

    if (!choice.function_call) {
      return res.json({ response: choice.content });
    }

    // Step 2: Parse arguments and call MCP server
    const { name, arguments: rawArgs } = choice.function_call;
    const args = JSON.parse(rawArgs);

    const mcpRes = await axios.post(`${MCP_BASE_URL}/context`, args);

    // Step 3: Feed context result back to GPT-4
    const finalResponse = await openai.chat.completions.create({
      model: "gpt-4-0613",
      messages: [
        { role: "user", content: userMessage },
        choice,
        {
          role: "function",
          name,
          content: JSON.stringify(mcpRes.data)
        }
      ]
    });

    res.json({ response: finalResponse.choices[0].message.content });
  } catch (error) {
    console.error("Error in /chat:", error);
    res.status(500).json({ error: "Something went wrong.", details: error.message });
  }
});

const PORT = process.env.CHAT_PORT || 4000;
app.listen(PORT, () => {
  console.log(`🔁 Chat API running at http://localhost:${PORT}/chat`);
});
