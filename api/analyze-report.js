// api/analyze-report.js
// Analyzes uploaded report files using Claude AI to identify report type and structure

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    var { fileText, fileName, fileType, ownerId, businessType } = req.body;
    if (!fileText || !fileName) return res.status(400).json({ error: 'fileText and fileName required' });

    var ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
    if (!ANTHROPIC_KEY) {
      // Fallback: local heuristic analysis
      return res.status(200).json(heuristicAnalyze(fileText, fileName, businessType));
    }

    var response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: `You are a business operations and reporting expert. Analyze the uploaded report and return JSON with:
- recognized (boolean): whether you can identify this report type
- report_name (string): best name for this report
- report_category (string): one of: financial, clients, jobs, compliance, executive, leasing, maintenance
- confidence (number 0-1): how confident you are
- columns_detected (array of strings): column headers found
- description (string): what this report shows
- suggestions (array of strings): improvements or related reports
- questions (array of strings): questions to ask if unclear
- suggested_query (string or null): a query identifier like REPORT:INCOME_EXPENSE that maps to a known report, or null if custom
- placement (string): where in the UI this report belongs (financial, clients, jobs, compliance, executive)

Business type: ${businessType || 'generic_service'}
Respond ONLY with valid JSON, no markdown.`,
        messages: [{
          role: 'user',
          content: `Analyze this ${fileType || 'unknown'} file named "${fileName}":\n\n${fileText.slice(0, 8000)}`
        }]
      })
    });

    var data = await response.json();
    var text = data.content && data.content[0] && data.content[0].text;
    if (!text) return res.status(200).json(heuristicAnalyze(fileText, fileName, businessType));

    try {
      var result = JSON.parse(text);
      return res.status(200).json(result);
    } catch (e) {
      return res.status(200).json(heuristicAnalyze(fileText, fileName, businessType));
    }
  } catch (err) {
    console.error('analyze-report error:', err);
    return res.status(200).json(heuristicAnalyze(req.body.fileText || '', req.body.fileName || '', req.body.businessType));
  }
};

function heuristicAnalyze(text, fileName, businessType) {
  var lower = (text + ' ' + fileName).toLowerCase();
  var headers = [];
  var lines = text.split('\n');
  if (lines.length > 0) {
    headers = lines[0].split(/[,\t]/).map(function(h) { return h.trim().replace(/['"]/g, '').toLowerCase(); });
  }

  var patterns = [
    { name: 'Income & Expense Report', category: 'financial', query: 'REPORT:INCOME_EXPENSE', keywords: ['income', 'expense', 'revenue', 'profit', 'loss', 'p&l'] },
    { name: 'Rent Roll', category: 'leasing', query: 'REPORT:RENT_ROLL', keywords: ['rent roll', 'tenant', 'unit', 'lease', 'monthly rent'] },
    { name: 'Owner Statement', category: 'financial', query: 'REPORT:OWNER_STATEMENT', keywords: ['owner statement', 'distribution', 'management fee', 'net to owner'] },
    { name: 'Cash Flow Summary', category: 'financial', query: 'REPORT:CASH_FLOW', keywords: ['cash flow', 'inflow', 'outflow', 'net cash'] },
    { name: 'Open Invoices / AR Aging', category: 'financial', query: 'REPORT:AR_AGING', keywords: ['aging', 'accounts receivable', 'past due', 'invoice', 'outstanding'] },
    { name: 'Payments Received', category: 'financial', query: 'REPORT:PAYMENTS_RECEIVED', keywords: ['payment', 'received', 'deposit', 'collection'] },
    { name: 'Job / Work Order Summary', category: 'jobs', query: 'REPORT:JOB_SUMMARY', keywords: ['work order', 'job', 'maintenance', 'service request', 'vendor'] },
    { name: 'Lease Expiration Report', category: 'leasing', query: 'REPORT:LEASE_EXPIRATION', keywords: ['lease expir', 'renewal', 'move out', 'end date'] },
    { name: 'Screening Summary', category: 'leasing', query: 'REPORT:SCREENING_SUMMARY', keywords: ['screening', 'applicant', 'background', 'credit score', 'application'] },
    { name: 'Eviction Activity Log', category: 'compliance', query: 'REPORT:EVICTION_LOG', keywords: ['eviction', 'notice', 'filing', 'court', 'unlawful detainer'] },
    { name: 'Maintenance Cost Analysis', category: 'maintenance', query: 'REPORT:MAINTENANCE_COST', keywords: ['maintenance cost', 'repair', 'capex', 'property maintenance'] },
    { name: 'KPI Snapshot', category: 'executive', query: 'REPORT:KPI_SNAPSHOT', keywords: ['kpi', 'dashboard', 'occupancy', 'vacancy', 'noi'] },
    { name: 'Client / Contact List', category: 'clients', query: 'REPORT:CLIENT_LIST', keywords: ['client', 'contact', 'customer', 'name', 'email', 'phone'] },
    { name: 'Document List', category: 'clients', query: 'REPORT:DOCUMENT_LIST', keywords: ['document', 'file', 'attachment', 'contract'] }
  ];

  var best = null;
  var bestScore = 0;
  patterns.forEach(function(p) {
    var score = 0;
    p.keywords.forEach(function(kw) {
      if (lower.indexOf(kw) >= 0) score += 2;
      headers.forEach(function(h) {
        if (h.indexOf(kw) >= 0) score += 3;
      });
    });
    if (score > bestScore) { bestScore = score; best = p; }
  });

  var confidence = Math.min(bestScore / 12, 1);
  if (!best || confidence < 0.2) {
    return {
      recognized: false,
      report_name: fileName.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
      report_category: 'financial',
      confidence: 0,
      columns_detected: headers.filter(function(h) { return h.length > 0; }),
      description: '',
      suggestions: ['Please provide more details about this report.'],
      questions: ['What type of report is this?', 'What data does it track?', 'How often do you generate it?'],
      suggested_query: null,
      placement: 'financial'
    };
  }

  return {
    recognized: true,
    report_name: best.name,
    report_category: best.category,
    confidence: confidence,
    columns_detected: headers.filter(function(h) { return h.length > 0; }),
    description: 'Detected as ' + best.name,
    suggestions: [],
    questions: confidence < 0.75 ? ['Please confirm: is this a ' + best.name + '?'] : [],
    suggested_query: best.query,
    placement: best.category === 'leasing' || best.category === 'maintenance' ? best.category : best.category
  };
}
