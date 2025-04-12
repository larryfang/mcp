const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

const zendesk = axios.create({
  baseURL: `https://${process.env.ZENDESK_DOMAIN}/api/v2`,
  auth: {
    username: `${process.env.ZENDESK_EMAIL}/token`,
    password: process.env.ZENDESK_API_TOKEN
  }
});

app.post('/context', async (req, res) => {
  const { ticket_id, user_id, organization_id } = req.body;

  try {
    let user = null;
    let org = null;
    let recentTickets = [];
    let context = [];

    if (ticket_id) {
      const ticket = (await zendesk.get(`/tickets/${ticket_id}.json`)).data.ticket;
      user = (await zendesk.get(`/users/${ticket.requester_id}.json`)).data.user;
      if (user.organization_id) {
        org = (await zendesk.get(`/organizations/${user.organization_id}.json`)).data.organization;
      }
    } else if (user_id) {
      user = (await zendesk.get(`/users/${user_id}.json`)).data.user;
      if (user.organization_id) {
        org = (await zendesk.get(`/organizations/${user.organization_id}.json`)).data.organization;
      }
    } else if (organization_id) {
      org = (await zendesk.get(`/organizations/${organization_id}.json`)).data.organization;
    } else {
      return res.status(400).json({ error: "Must provide ticket_id, user_id, or organization_id." });
    }

    if (user) {
      context.push({ type: "text", label: "Customer Name", value: user.name });
      context.push({ type: "text", label: "Email", value: user.email });
      context.push({ type: "text", label: "Plan", value: user.user_fields?.plan || "N/A" });

      recentTickets = (await zendesk.get(`/users/${user.id}/tickets/requested.json?per_page=3`)).data.tickets;
      context.push({
        type: "list",
        label: "Recent Tickets",
        value: recentTickets.map(t => ({
          id: t.id,
          subject: t.subject,
          status: t.status,
          created_at: t.created_at
        }))
      });
    }

    if (org) {
      context.push({ type: "text", label: "Organization", value: org.name });
      context.push({ type: "text", label: "Details", value: org.details || "N/A" });
    }

    const summary = user
      ? `${user.name} is a ${user.user_fields?.plan || "N/A"} customer` +
        (org ? ` under ${org.name}` : "") +
        (recentTickets?.length
          ? `. They have submitted ${recentTickets.length} ticket(s), most recently titled '${recentTickets[0].subject}' with status ${recentTickets[0].status}.`
          : "") +
        (user.time_zone ? ` Based in ${user.time_zone}.` : "")
      : org
      ? `Organization ${org.name} (${org.details || "No details available"})`
      : null;

    const promptContext = user
      ? `User: ${user.name}, Plan: ${user.user_fields?.plan || "N/A"}, Org: ${org?.name || "N/A"}. ` +
        (recentTickets?.[0]
          ? `Last ticket: '${recentTickets[0].subject}' (${recentTickets[0].status}).`
          : "")
      : org
      ? `Org: ${org.name}, Details: ${org.details || "N/A"}`
      : "";

    res.json({
      summary,
      prompt_context: promptContext,
      context,
      prompt_guidance: {
        usage: "Use this context to understand the user, organization, or ticket origin.",
        examples: [
          user ? `The user ${user.name} is on the ${user.user_fields?.plan || "N/A"} plan.` : "",
          org ? `They belong to the organization ${org.name}.` : ""
        ].filter(Boolean)
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch context" });
  }
});

app.get('/meta', (req, res) => {
  res.json({
    name: "CustomerContextMCP",
    description: "Returns structured context for a Zendesk ticket, user, or organization.",
    version: "1.0.0",
    input_schema: {
      type: "object",
      properties: {
        ticket_id: { type: "integer", description: "Zendesk ticket ID" },
        user_id: { type: "integer", description: "Zendesk user ID" },
        organization_id: { type: "integer", description: "Zendesk org ID" }
      },
      required: []
    },
    output_schema: {
      type: "object",
      properties: {
        summary: { type: "string" },
        prompt_context: { type: "string" },
        context: { type: "array" },
        prompt_guidance: { type: "object" }
      }
    }
  });
});

app.get('/function-schema', (req, res) => {
  res.json({
    name: "get_ticket_context",
    description: "Returns customer or org context from Zendesk using a ticket ID, user ID, or organization ID",
    parameters: {
      type: "object",
      properties: {
        ticket_id: {
          type: "integer",
          description: "Zendesk ticket ID to fetch context from"
        },
        user_id: {
          type: "integer",
          description: "Zendesk user ID to fetch context directly"
        },
        organization_id: {
          type: "integer",
          description: "Zendesk organization ID to fetch org-level context"
        }
      },
      required: []
    }
  });
});

app.listen(PORT, () => {
  console.log(`✅ MCP server listening on port ${PORT}`);
});
