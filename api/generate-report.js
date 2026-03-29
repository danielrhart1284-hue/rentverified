// api/generate-report.js
// Generates reports from custom_reports definitions with live data

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    var { reportId, ownerId, format, context } = req.body;
    format = format || 'csv';
    context = context || {};

    if (!reportId || !ownerId) {
      return res.status(400).json({ error: 'reportId and ownerId required' });
    }

    // For now, return the query template identifier
    // In production, this would query Supabase and generate actual data
    var SUPABASE_URL = process.env.SUPABASE_URL || 'https://apwzjhkuvndcowfihdys.supabase.co';
    var SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

    // If no service key, return stub data for client-side generation
    if (!SUPABASE_KEY) {
      return res.status(200).json({
        success: true,
        mode: 'client',
        message: 'Generate report client-side using RVData',
        reportId: reportId,
        format: format,
        context: context
      });
    }

    // With service key, query Supabase for the report definition
    var reportRes = await fetch(SUPABASE_URL + '/rest/v1/custom_reports?id=eq.' + reportId + '&owner_id=eq.' + ownerId, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY
      }
    });
    var reports = await reportRes.json();
    if (!reports || !reports.length) {
      return res.status(404).json({ error: 'Report not found' });
    }

    var report = reports[0];
    var queryTemplate = report.query_template;

    // Dispatch to known report generators
    // For now, return metadata so client can generate
    return res.status(200).json({
      success: true,
      mode: 'client',
      report: {
        id: report.id,
        name: report.report_name,
        category: report.report_category,
        query: queryTemplate,
        format: format
      },
      context: context
    });

  } catch (err) {
    console.error('generate-report error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
