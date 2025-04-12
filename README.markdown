# Zendesk MCP Server (Model Context Protocol)

This project is a lightweight, AI-native MCP (Model Context Protocol) server that integrates with Zendesk's REST APIs. It allows GPT-based AI agents (e.g. OpenAI, LangChain) to fetch real-time customer and organization context dynamically.

---

## Features

- Accepts `ticket_id`, `user_id`, or `organization_id`
- Fetches user, org, and ticket context from Zendesk
- Returns:
  - `summary`: human-readable LLM-friendly summary
  - `prompt_context`: single-line LLM embedding string
  - `context`: structured blocks (text, list)
  - `prompt_guidance`: usage instructions and few-shot examples
- Exposes:
  - `/context`: main context API
  - `/meta`: MCP schema metadata
  - `/function-schema`: OpenAI function-compatible definition
- Fully Dockerized and deployable
- Compatible with GPT-4 function calling

---

## Getting Started

### 1. Clone and install dependencies

```bash
git clone https://github.com/your-repo/zendesk-mcp-server
cd zendesk-mcp-server
npm install
```

### 2. Set up `.env`

```env
ZENDESK_DOMAIN=your-subdomain.zendesk.com
ZENDESK_EMAIL=your-email@yourdomain.com
ZENDESK_API_TOKEN=your_zendesk_api_token
PORT=3000
```

### 3. Run Locally

```bash
node index.js
```

Visit:

- `http://localhost:3000/context`
- `http://localhost:3000/meta`
- `http://localhost:3000/function-schema`

---

## Docker Support

### Build Image

```bash
docker build -t zendesk-mcp .
```

### Run Container

```bash
docker run -p 3000:3000 \
  -e ZENDESK_DOMAIN=your-subdomain.zendesk.com \
  -e ZENDESK_EMAIL=your-email \
  -e ZENDESK_API_TOKEN=your-token \
  zendesk-mcp
```

---

## Function Calling with OpenAI (Example)

See `openai-client.js` for an example where:

- GPT-4 automatically detects and calls `get_ticket_context`
- The function calls your local MCP server
- GPT writes a natural reply using the returned context

---

## Future Enhancements

- LangChain tool compatibility
- Redis caching layer
- Rate limiting
- More context types: `/orders`, `/billing`, `/subscriptions`

---

## License

MIT

---

## Author

Larry Fang — [@larryfang](https://github.com/larryfang)



