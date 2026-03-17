# RentVerified: AI Chat and Why We Don’t Use OpenClaw/ClawdBot

## OpenClaw/ClawdBot — Not Recommended for RentVerified

We **do not recommend** using OpenClaw (formerly ClawdBot / Moltbot) for RentVerified.

- **Security:** A malicious VS Code extension and third-party “skills” have been used for data exfiltration. Security reviews have found many malicious skills in their ecosystem. Tenant conversations include names, addresses, and financial/application details; routing that through a service with documented data-exfiltration risks is not acceptable for a property management platform that may hold eviction-grade legal records.
- **Other issues:** The project has rebranded multiple times; API costs can be high; it’s aimed at developers self-hosting, not at property-management use cases.

Any previous “bridge” code that pointed at OpenClaw has been removed. The chat widget no longer uses or references OpenClaw/ClawdBot.

---

## Recommended: Claude API via Vercel

RentVerified’s **recommended** path for real AI replies is a small Vercel serverless function that calls the **Anthropic Claude API** directly.

- **Secure:** Your API key stays in Vercel env; tenant data goes only to Anthropic’s API, not to third-party skill repositories.
- **Low cost:** A few cents per conversation (e.g. Claude Haiku).
- **Relevant:** You control the system prompt (property context, Sanders PM, applications, tours).

### How to enable

1. **Vercel:** Add `ANTHROPIC_API_KEY` in your project’s Environment Variables (get a key from [Anthropic](https://console.anthropic.com)).
2. **Deploy:** The repo includes `api/chat.js`. Deploy to Vercel so the route `/api/chat` exists.
3. **Frontend:** On pages that use the chat widget, set the endpoint before loading `app.js`:
   ```html
   <script>window.RV_CHAT_API = '/api/chat';</script>
   <script src="js/app.js"></script>
   ```
   If you don’t set `RV_CHAT_API`, the widget uses the built-in keyword-based replies only.

### Request / response

- **POST** `/api/chat` with JSON: `{ "message": "tenant message", "propertyContext": "...", "listingId": "..." }`.
- **Response:** `{ "reply": "..." }`. On error the frontend falls back to the local keyword responses.

This gives tenants intelligent, property-aware answers without exposing them to OpenClaw’s ecosystem or data risks.
