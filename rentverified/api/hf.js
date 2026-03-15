export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const HF_KEY = process.env.HUGGING_FACE_API_KEY;
  if (!HF_KEY) {
    const fb = fallbackResult(req.body ? req.body.task : null, req.body ? req.body.input : null);
    return res.status(200).json({ error: 'HF API key not configured', result: fb, fallback: true });
  }

  const { task, input, context } = req.body || {};
  if (!task || !input) return res.status(400).json({ error: 'Missing task or input' });

  const MODELS = {
    summary: 'facebook/bart-large-cnn',
    description: 'mistralai/Mistral-7B-Instruct-v0.3',
    classify: 'facebook/bart-large-mnli',
    explain: 'facebook/bart-large-cnn',
    review: 'facebook/bart-large-mnli'
  };

  const model = MODELS[task];
  if (!model) return res.status(400).json({ error: 'Unknown task: ' + task });

  try {
    const result = await callHF(HF_KEY, task, model, input, context);
    return res.status(200).json({ result });
  } catch (err) {
    console.error('HF API error:', err.message);
    return res.status(200).json({ result: fallbackResult(task, input), fallback: true });
  }
}

async function callHF(key, task, model, input, context, retries = 2) {
  const url = 'https://api-inference.huggingface.co/models/' + model;
  var body;
  var headers = { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' };

  if (task === 'summary') {
    body = JSON.stringify({
      inputs: typeof input === 'string' ? input : JSON.stringify(input),
      parameters: { max_length: 200, min_length: 50 }
    });
  } else if (task === 'description') {
    var prompt = 'Write a professional rental listing description for: ' +
      (typeof input === 'string' ? input : JSON.stringify(input)) +
      '. Include key features and amenities. Be concise and appealing.';
    body = JSON.stringify({
      inputs: prompt,
      parameters: { max_new_tokens: 250, temperature: 0.7 }
    });
  } else if (task === 'classify') {
    var categories = ['Plumbing', 'Electrical', 'HVAC', 'Appliance', 'Structural', 'Pest Control', 'Cleaning', 'Landscaping', 'Other'];
    body = JSON.stringify({
      inputs: typeof input === 'string' ? input : JSON.stringify(input),
      parameters: { candidate_labels: categories }
    });
  } else if (task === 'explain') {
    body = JSON.stringify({
      inputs: typeof input === 'string' ? input : (input.clause || JSON.stringify(input)),
      parameters: { max_length: 150, min_length: 30 }
    });
  } else if (task === 'review') {
    var labels = ['professional', 'threatening', 'discriminatory', 'emotional', 'neutral'];
    body = JSON.stringify({
      inputs: typeof input === 'string' ? input : JSON.stringify(input),
      parameters: { candidate_labels: labels }
    });
  }

  for (var attempt = 0; attempt <= retries; attempt++) {
    try {
      var resp = await fetch(url, { method: 'POST', headers: headers, body: body });
      if (resp.status === 503) {
        if (attempt < retries) { await delay(3000); continue; }
        throw new Error('Model loading, please retry');
      }
      if (!resp.ok) {
        var errText = await resp.text();
        throw new Error('HF API ' + resp.status + ': ' + errText);
      }
      var data = await resp.json();
      return parseResult(task, data);
    } catch (err) {
      if (attempt < retries) { await delay(3000); continue; }
      throw err;
    }
  }
}

function parseResult(task, data) {
  if (task === 'classify' || task === 'review') {
    if (data.labels && data.scores) {
      return {
        label: data.labels[0],
        score: data.scores[0],
        all: data.labels.map(function(l, i) { return { label: l, score: data.scores[i] }; })
      };
    }
    return data;
  }
  if (Array.isArray(data) && data[0]) {
    return data[0].summary_text || data[0].generated_text || JSON.stringify(data[0]);
  }
  if (data.summary_text) return data.summary_text;
  if (data.generated_text) return data.generated_text;
  return JSON.stringify(data);
}

function fallbackResult(task, input) {
  var fb = {
    summary: 'AI summary unavailable. Please review the full application manually. Key areas to check: employment history, rental references, credit indicators, and income verification.',
    description: 'Charming rental property in a great location. Features modern amenities and a comfortable living space. Contact us for a showing today!',
    classify: { label: 'Other', score: 0, all: [{ label: 'Other', score: 1 }], fallback: true },
    explain: 'This clause establishes standard terms between the landlord and tenant. Please consult with a legal professional for specific questions about your rights and obligations.',
    review: { label: 'neutral', score: 0.5, all: [{ label: 'neutral', score: 0.5 }], fallback: true }
  };
  return fb[task] || 'AI service temporarily unavailable. Please try again later.';
}

function delay(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }
