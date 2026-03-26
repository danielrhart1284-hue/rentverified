// 3120 Life – Hugging Face API Proxy (Vercel Serverless Function)
// Keeps HF_API_KEY secret on the server, never exposed to the browser.
// POST /api/hf  { task, prompt, context }
// Returns      { result: "..." }

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const HF_KEY = process.env.HF_API_KEY;
  if (!HF_KEY) {
    return res.status(500).json({ error: 'HF_API_KEY not configured' });
  }

  const { task, prompt, context } = req.body || {};
  if (!task || !prompt) {
    return res.status(400).json({ error: 'task and prompt are required' });
  }

  // Map task names to system prompts
  const SYSTEM_PROMPTS = {
    'listing-description': `You are a professional property listing copywriter for [Your Business Name] in Utah.
Write compelling, accurate rental listing descriptions. Be warm, clear, and highlight the best features.
Keep it 3–5 sentences. No exaggeration. Focus on lifestyle benefits.`,

    'application-risk': `You are a rental application review assistant for a property management company.
Analyze the application data provided and give a brief risk summary (2–4 sentences).
Note any green flags (stable income, good rental history) and yellow/red flags (income below 3x rent, gaps, etc.).
Be factual and neutral — never discriminatory. End with a recommendation: Approve / Review Further / Decline.`,

    'maintenance-classify': `You are a maintenance request classifier for a property management company.
Given a tenant's maintenance description, respond with JSON only:
{ "priority": "emergency|urgent|routine", "category": "plumbing|electrical|hvac|appliance|structural|pest|other", "estimatedCost": "low|medium|high", "vendorType": "plumber|electrician|hvac|general_contractor|exterminator|handyman" }`,

    'lease-explainer': `You are a plain-English lease explainer for tenants.
Given a section of a lease agreement, explain it in simple, clear language a first-time renter would understand.
Be friendly, accurate, and highlight anything the tenant should pay attention to.`,

    'eviction-tone': `You are a legal document tone reviewer.
Review the eviction notice text and flag any language that is overly aggressive, unprofessional, or legally risky.
Suggest a more neutral, professional alternative for any flagged phrases. Be concise.`
  };

  const systemPrompt = SYSTEM_PROMPTS[task];
  if (!systemPrompt) {
    return res.status(400).json({ error: `Unknown task: ${task}` });
  }

  const fullPrompt = context
    ? `${systemPrompt}\n\nContext:\n${context}\n\nRequest:\n${prompt}`
    : `${systemPrompt}\n\nRequest:\n${prompt}`;

  // Try models in order until one works (free tier fallback chain)
  const MODELS = [
    'mistralai/Mistral-7B-Instruct-v0.3',
    'HuggingFaceH4/zephyr-7b-beta',
    'microsoft/Phi-3-mini-4k-instruct'
  ];

  let lastError = null;
  for (const model of MODELS) {
    try {
      const hfRes = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: fullPrompt,
          parameters: {
            max_new_tokens: task === 'maintenance-classify' ? 120 : 300,
            temperature: task === 'listing-description' ? 0.7 : 0.3,
            return_full_text: false,
            stop: ['\n\nRequest:', '\n\nContext:']
          },
          options: { wait_for_model: true }
        })
      });

      if (!hfRes.ok) {
        const errText = await hfRes.text();
        lastError = `${model}: ${hfRes.status} ${errText}`;
        continue;
      }

      const data = await hfRes.json();
      let result = '';

      if (Array.isArray(data) && data[0]?.generated_text) {
        result = data[0].generated_text.trim();
      } else if (data.generated_text) {
        result = data.generated_text.trim();
      } else {
        lastError = `${model}: unexpected response format`;
        continue;
      }

      return res.status(200).json({ result, model });

    } catch (err) {
      lastError = `${model}: ${err.message}`;
      continue;
    }
  }

  return res.status(502).json({ error: 'All HF models failed', detail: lastError });
}
