// report-upload-widget.js
// Reusable report upload and contextual report generation component
// Usage: <div id="report-widget" data-placement="financial"></div>
// Then call: ReportWidget.init('report-widget', { placement: 'financial' })

var ReportWidget = (function() {
  'use strict';

  function esc(s) { var d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }

  // Generate CSV from array of objects
  function toCSV(data, columns) {
    if (!data || !data.length) return '';
    columns = columns || Object.keys(data[0]);
    var csv = columns.join(',') + '\n';
    data.forEach(function(row) {
      csv += columns.map(function(c) {
        var val = (row[c] !== undefined && row[c] !== null) ? String(row[c]) : '';
        // CSV-safe: escape quotes and wrap if contains comma/newline
        if (val.indexOf(',') >= 0 || val.indexOf('"') >= 0 || val.indexOf('\n') >= 0) {
          val = '"' + val.replace(/"/g, '""') + '"';
        }
        // CSV injection prevention
        if (/^[=+\-@\t\r]/.test(val)) val = "'" + val;
        return val;
      }).join(',') + '\n';
    });
    return csv;
  }

  function downloadFile(content, filename, type) {
    var blob = new Blob([content], { type: type || 'text/csv' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
  }

  // Built-in report generators using RVData
  var GENERATORS = {
    'REPORT:CLIENT_LIST': async function(ctx) {
      var leads = await RVData.getLeads();
      return leads.map(function(l) {
        return { name: l.name || l.company, email: l.email || '', phone: l.phone || '', status: l.status || 'active', source: l.source || '', created: l.created_at || '' };
      });
    },
    'REPORT:INCOME_EXPENSE': async function(ctx) {
      var entries = await RVData.getAccountingEntries();
      if (ctx.from) entries = entries.filter(function(e) { return e.date >= ctx.from; });
      if (ctx.to) entries = entries.filter(function(e) { return e.date <= ctx.to; });
      return entries.map(function(e) {
        return { date: e.date, type: e.type, category: e.category || e.cat, description: e.description || e.desc, amount: e.amount, property: e.property || e.prop || '' };
      });
    },
    'REPORT:CASH_FLOW': async function(ctx) {
      var entries = await RVData.getAccountingEntries();
      if (ctx.from) entries = entries.filter(function(e) { return e.date >= ctx.from; });
      if (ctx.to) entries = entries.filter(function(e) { return e.date <= ctx.to; });
      var inflow = 0, outflow = 0;
      entries.forEach(function(e) {
        if (e.type === 'income') inflow += parseFloat(e.amount) || 0;
        else outflow += parseFloat(e.amount) || 0;
      });
      return [{ period: (ctx.from || 'Start') + ' to ' + (ctx.to || 'Now'), total_inflow: inflow.toFixed(2), total_outflow: outflow.toFixed(2), net_cash_flow: (inflow - outflow).toFixed(2) }];
    },
    'REPORT:AR_AGING': async function(ctx) {
      var payments = await RVData.getPayments();
      var now = new Date();
      return payments.filter(function(p) { return p.status === 'pending' || p.status === 'overdue'; }).map(function(p) {
        var due = new Date(p.due_date || p.date);
        var days = Math.max(0, Math.floor((now - due) / 86400000));
        var bucket = days <= 30 ? '0-30' : days <= 60 ? '31-60' : days <= 90 ? '61-90' : '90+';
        return { tenant: p.tenant_name || p.from || '', amount: p.amount, due_date: p.due_date || p.date, days_overdue: days, aging_bucket: bucket };
      });
    },
    'REPORT:PAYMENTS_RECEIVED': async function(ctx) {
      var payments = await RVData.getPayments();
      return payments.filter(function(p) { return p.status === 'completed' || p.status === 'paid'; }).map(function(p) {
        return { date: p.date || p.paid_date, tenant: p.tenant_name || p.from || '', amount: p.amount, method: p.method || p.payment_method || '', property: p.property || '' };
      });
    },
    'REPORT:JOB_SUMMARY': async function(ctx) {
      var jobs = await RVData.getMaintenanceRequests();
      return jobs.map(function(j) {
        return { id: j.id, title: j.title || j.desc || j.description, status: j.status, priority: j.priority || '', vendor: j.vendor || '', cost: j.cost || j.estimatedCost || '', property: j.property || j.prop || '', created: j.created_at || j.date || '' };
      });
    },
    'REPORT:RENT_ROLL': async function(ctx) {
      var leases = await RVData.getLeases();
      return leases.filter(function(l) { return l.status === 'active' || !l.status; }).map(function(l) {
        return { tenant: l.tenant, unit: l.unit || '', property: l.prop || l.property || '', rent: l.rent, start: l.start, end: l.end, deposit: l.deposit || '', status: l.status || 'active' };
      });
    },
    'REPORT:OWNER_STATEMENT': async function(ctx) {
      var entries = await RVData.getAccountingEntries();
      var month = ctx.month || new Date().toISOString().slice(0, 7);
      entries = entries.filter(function(e) { return (e.date || '').startsWith(month); });
      var income = 0, expenses = 0;
      entries.forEach(function(e) {
        if (e.type === 'income') income += parseFloat(e.amount) || 0;
        else expenses += parseFloat(e.amount) || 0;
      });
      var mgmtFee = income * 0.08;
      return [{ month: month, gross_income: income.toFixed(2), total_expenses: expenses.toFixed(2), management_fee: mgmtFee.toFixed(2), net_to_owner: (income - expenses - mgmtFee).toFixed(2) }];
    },
    'REPORT:LEASE_EXPIRATION': async function(ctx) {
      var leases = await RVData.getLeases();
      var now = new Date();
      return leases.filter(function(l) {
        var end = new Date(l.end);
        var days = Math.floor((end - now) / 86400000);
        return days >= 0 && days <= 90;
      }).map(function(l) {
        var days = Math.floor((new Date(l.end) - now) / 86400000);
        return { tenant: l.tenant, property: l.prop || l.property || '', unit: l.unit || '', lease_end: l.end, days_remaining: days, bucket: days <= 30 ? '30 days' : days <= 60 ? '60 days' : '90 days', rent: l.rent };
      }).sort(function(a, b) { return a.days_remaining - b.days_remaining; });
    },
    'REPORT:MAINTENANCE_COST': async function(ctx) {
      var jobs = await RVData.getMaintenanceRequests();
      var byProp = {};
      jobs.forEach(function(j) {
        var prop = j.property || j.prop || 'Unassigned';
        if (!byProp[prop]) byProp[prop] = { property: prop, total_cost: 0, job_count: 0, avg_cost: 0 };
        byProp[prop].total_cost += parseFloat(j.cost || j.estimatedCost || 0);
        byProp[prop].job_count++;
      });
      return Object.values(byProp).map(function(p) {
        p.avg_cost = p.job_count > 0 ? (p.total_cost / p.job_count).toFixed(2) : '0.00';
        p.total_cost = p.total_cost.toFixed(2);
        return p;
      });
    },
    'REPORT:EVICTION_LOG': async function(ctx) {
      var cases = await RVData.getEvictionCases();
      return cases.map(function(c) {
        return { case_id: c.id, tenant: c.tenant || c.tenant_name, property: c.property || c.address, status: c.status, filed_date: c.filed_date || c.date, reason: c.reason || '', amount_owed: c.amount_owed || c.balance || '' };
      });
    },
    'REPORT:SCREENING_SUMMARY': async function(ctx) {
      var apps = await RVData.getApplicants();
      return apps.map(function(a) {
        return { name: a.name, email: a.email || '', score: a.score || '', decision: a.decision || a.status || '', credit_score: a.creditScore || '', income: a.income || '', date: a.date || a.created_at || '' };
      });
    },
    'REPORT:KPI_SNAPSHOT': async function(ctx) {
      var leases = await RVData.getLeases();
      var entries = await RVData.getAccountingEntries();
      var jobs = await RVData.getMaintenanceRequests();
      var active = leases.filter(function(l) { return l.status === 'active' || !l.status; });
      var income = 0, expenses = 0;
      entries.forEach(function(e) {
        if (e.type === 'income') income += parseFloat(e.amount) || 0;
        else expenses += parseFloat(e.amount) || 0;
      });
      var openJobs = jobs.filter(function(j) { return j.status !== 'Completed' && j.status !== 'Closed'; });
      return [{ total_units: leases.length, occupied: active.length, vacancy_rate: leases.length > 0 ? ((1 - active.length / leases.length) * 100).toFixed(1) + '%' : '0%', total_revenue: income.toFixed(2), total_expenses: expenses.toFixed(2), noi: (income - expenses).toFixed(2), open_jobs: openJobs.length }];
    },
    'REPORT:DOCUMENT_LIST': async function(ctx) {
      var docs = await RVData.getDocuments();
      return (docs || []).map(function(d) {
        return { name: d.name || d.title || '', type: d.type || d.doc_type || '', date: d.date || d.created_at || '', property: d.property_id || '' };
      });
    }
  };

  // Initialize widget in a container
  function init(containerId, options) {
    options = options || {};
    var container = document.getElementById(containerId);
    if (!container) return;

    var placement = options.placement || container.getAttribute('data-placement') || 'financial';

    // Render the widget
    container.innerHTML = '<div class="rw-widget">' +
      '<div class="rw-header">' +
        '<span class="rw-title">\uD83D\uDCCA Reports</span>' +
        '<button class="rw-upload-btn" onclick="ReportWidget.showUpload(\'' + esc(containerId) + '\')">+ Upload Report</button>' +
      '</div>' +
      '<div class="rw-list" id="rw-list-' + esc(containerId) + '">Loading...</div>' +
      '<div class="rw-upload-area" id="rw-upload-' + esc(containerId) + '" style="display:none;"></div>' +
    '</div>';

    // Add styles if not already added
    if (!document.getElementById('rw-styles')) {
      var style = document.createElement('style');
      style.id = 'rw-styles';
      style.textContent = '.rw-widget{border:1px solid #e5e7eb;border-radius:12px;padding:1rem;background:#fff;margin:1rem 0;}' +
        '.rw-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem;}' +
        '.rw-title{font-weight:700;font-size:.95rem;color:#121212;}' +
        '.rw-upload-btn{background:#00E676;color:#121212;border:none;padding:.4rem .8rem;border-radius:8px;font-size:.8rem;font-weight:600;cursor:pointer;}' +
        '.rw-upload-btn:hover{background:#00C853;}' +
        '.rw-list{display:flex;flex-direction:column;gap:.4rem;}' +
        '.rw-item{display:flex;justify-content:space-between;align-items:center;padding:.5rem .7rem;border-radius:8px;background:#f9fafb;cursor:pointer;font-size:.85rem;}' +
        '.rw-item:hover{background:rgba(0,230,118,0.08);}' +
        '.rw-item-name{color:#121212;font-weight:500;}' +
        '.rw-item-actions{display:flex;gap:.3rem;}' +
        '.rw-gen-btn{background:none;border:1px solid #00E676;color:#065f46;padding:.2rem .5rem;border-radius:6px;font-size:.75rem;cursor:pointer;}' +
        '.rw-gen-btn:hover{background:#00E676;color:#121212;}' +
        '.rw-drop{border:2px dashed #d1d5db;border-radius:12px;padding:2rem;text-align:center;margin:.75rem 0;cursor:pointer;transition:border-color .2s;}' +
        '.rw-drop:hover,.rw-drop.dragover{border-color:#00E676;background:rgba(0,230,118,0.04);}' +
        '.rw-status{padding:.75rem;margin:.5rem 0;border-radius:8px;font-size:.85rem;}' +
        '.rw-status.success{background:rgba(0,230,118,0.1);color:#065f46;}' +
        '.rw-status.asking{background:#fffbeb;color:#92400e;}' +
        '.rw-fmt-select{padding:.3rem .5rem;border:1px solid #d1d5db;border-radius:6px;font-size:.8rem;}';
      document.head.appendChild(style);
    }

    // Load reports for this placement
    loadReports(containerId, placement);
  }

  async function loadReports(containerId, placement) {
    var listEl = document.getElementById('rw-list-' + containerId);
    if (!listEl) return;

    var reports = [];
    if (typeof RVData !== 'undefined' && RVData.getCustomReports) {
      reports = await RVData.getCustomReports({ placement: placement });
    }
    // Also check localStorage custom_report_templates
    try {
      var templates = JSON.parse(localStorage.getItem('rv_custom_report_templates') || '[]');
      templates.forEach(function(t) { if (!t.placement || t.placement === placement) reports.push(t); });
    } catch(e) {}

    if (!reports.length) {
      listEl.innerHTML = '<div style="color:#9ca3af;font-size:.85rem;padding:.5rem;">No reports configured. Upload one to get started.</div>';
      return;
    }

    var html = '';
    reports.forEach(function(r) {
      var id = r.id || r.reportId || '';
      var query = r.query_template || r.query || '';
      html += '<div class="rw-item">' +
        '<span class="rw-item-name">' + esc(r.report_name || r.name || 'Report') + '</span>' +
        '<div class="rw-item-actions">' +
          '<select class="rw-fmt-select" id="rw-fmt-' + esc(id) + '"><option value="csv">CSV</option><option value="pdf">PDF</option></select>' +
          '<button class="rw-gen-btn" onclick="ReportWidget.generate(\'' + esc(query) + '\',document.getElementById(\'rw-fmt-' + esc(id) + '\').value)">Generate</button>' +
        '</div>' +
      '</div>';
    });
    listEl.innerHTML = html;
  }

  async function generate(queryTemplate, format) {
    format = format || 'csv';
    if (!queryTemplate) { alert('No query template defined for this report.'); return; }

    var gen = GENERATORS[queryTemplate];
    if (!gen) {
      alert('Report generator not found for: ' + queryTemplate);
      return;
    }

    try {
      var data = await gen({});
      if (!data || !data.length) {
        alert('No data found for this report.');
        return;
      }

      if (format === 'csv') {
        var csv = toCSV(data);
        var filename = queryTemplate.replace('REPORT:', '').toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + new Date().toISOString().slice(0, 10) + '.csv';
        downloadFile(csv, filename, 'text/csv');
      } else {
        // PDF: generate a simple printable HTML table
        var cols = Object.keys(data[0]);
        var html = '<html><head><title>Report</title><style>body{font-family:Arial,sans-serif;padding:20px;}table{width:100%;border-collapse:collapse;margin-top:10px;}th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:12px;}th{background:#f3f4f6;font-weight:600;}</style></head><body>';
        html += '<h2>' + esc(queryTemplate.replace('REPORT:', '').replace(/_/g, ' ')) + '</h2>';
        html += '<p>Generated: ' + new Date().toLocaleDateString() + '</p>';
        html += '<table><thead><tr>' + cols.map(function(c) { return '<th>' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>';
        data.forEach(function(row) {
          html += '<tr>' + cols.map(function(c) { return '<td>' + esc(String(row[c] || '')) + '</td>'; }).join('') + '</tr>';
        });
        html += '</tbody></table></body></html>';
        var win = window.open('', '_blank');
        win.document.write(html);
        win.document.close();
        win.print();
      }
    } catch(err) {
      console.error('Report generation error:', err);
      alert('Error generating report: ' + err.message);
    }
  }

  function showUpload(containerId) {
    var uploadEl = document.getElementById('rw-upload-' + containerId);
    if (!uploadEl) return;
    if (uploadEl.style.display !== 'none') { uploadEl.style.display = 'none'; return; }

    uploadEl.style.display = 'block';
    uploadEl.innerHTML = '<div class="rw-drop" id="rw-dropzone-' + esc(containerId) + '">' +
      '<input type="file" id="rw-file-' + esc(containerId) + '" accept=".csv,.tsv,.txt,.xlsx" style="display:none;" onchange="ReportWidget.handleFile(\'' + esc(containerId) + '\',this)">' +
      '<p style="margin:0;font-size:.9rem;color:#6b7280;">\uD83D\uDCC4 Drop a report here or <a href="#" onclick="document.getElementById(\'rw-file-' + esc(containerId) + '\').click();return false;" style="color:#00C853;">browse</a></p>' +
      '<p style="margin:.3rem 0 0;font-size:.75rem;color:#9ca3af;">CSV, TSV, or text files</p>' +
    '</div>' +
    '<div id="rw-upload-status-' + esc(containerId) + '"></div>';

    // Drag and drop
    var dropzone = document.getElementById('rw-dropzone-' + containerId);
    dropzone.addEventListener('dragover', function(e) { e.preventDefault(); this.classList.add('dragover'); });
    dropzone.addEventListener('dragleave', function() { this.classList.remove('dragover'); });
    dropzone.addEventListener('drop', function(e) {
      e.preventDefault(); this.classList.remove('dragover');
      if (e.dataTransfer.files.length) {
        document.getElementById('rw-file-' + containerId).files = e.dataTransfer.files;
        ReportWidget.handleFile(containerId, { files: e.dataTransfer.files });
      }
    });
  }

  async function handleFile(containerId, input) {
    var file = input.files && input.files[0];
    if (!file) return;

    var statusEl = document.getElementById('rw-upload-status-' + containerId);
    statusEl.innerHTML = '<div class="rw-status" style="background:#f0f9ff;color:#1e40af;">\u23F3 AI is analyzing your report...</div>';

    var reader = new FileReader();
    reader.onload = async function(e) {
      var text = e.target.result;
      var result;

      try {
        var response = await fetch('/api/analyze-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileText: text, fileName: file.name, fileType: file.type })
        });
        result = await response.json();
      } catch(err) {
        // Fallback to local heuristic
        result = localHeuristic(text, file.name);
      }

      if (result.recognized && result.confidence > 0.5) {
        statusEl.innerHTML = '<div class="rw-status success">' +
          '\u2705 Identified as: <strong>' + esc(result.report_name) + '</strong> (confidence: ' + Math.round((result.confidence || 0) * 100) + '%)<br>' +
          '<button class="rw-gen-btn" style="margin-top:.5rem;" onclick="ReportWidget.confirmUpload(\'' + esc(containerId) + '\',' + JSON.stringify(result).replace(/'/g, "\\'") + ')">Confirm & Add to My Reports</button>' +
        '</div>';
      } else {
        // Ask user
        var opts = '<select id="rw-manual-type-' + esc(containerId) + '" class="rw-fmt-select" style="width:100%;padding:.5rem;margin:.5rem 0;">';
        var types = ['Income & Expense Report','Cash Flow Summary','Open Invoices / AR Aging','Payments Received','Rent Roll','Owner Statement','Lease Expiration','Maintenance Cost','Job / Work Order Summary','Screening Summary','Eviction Activity Log','KPI Snapshot','Client / Contact List','Document List'];
        types.forEach(function(t) { opts += '<option>' + esc(t) + '</option>'; });
        opts += '</select>';
        statusEl.innerHTML = '<div class="rw-status asking">' +
          '\uD83E\uDD14 We couldn\'t confidently identify this report.<br>' +
          (result.questions && result.questions.length ? '<p style="margin:.3rem 0;">' + esc(result.questions[0]) + '</p>' : '') +
          '<label style="font-size:.8rem;font-weight:600;">What type of report is this?</label>' +
          opts +
          '<button class="rw-gen-btn" style="margin-top:.5rem;" onclick="ReportWidget.manualConfirm(\'' + esc(containerId) + '\',\'' + esc(file.name) + '\')">Save Report Type</button>' +
        '</div>';
      }
    };
    reader.readAsText(file);
  }

  function localHeuristic(text, fileName) {
    var lower = (text + ' ' + fileName).toLowerCase();
    var headers = text.split('\n')[0].split(/[,\t]/).map(function(h) { return h.trim().toLowerCase(); });
    var patterns = [
      { name: 'Rent Roll', kw: ['rent roll','tenant','unit','monthly rent'] },
      { name: 'Income & Expense Report', kw: ['income','expense','revenue','profit'] },
      { name: 'Owner Statement', kw: ['owner statement','distribution','net to owner'] },
      { name: 'Cash Flow Summary', kw: ['cash flow','inflow','outflow'] },
      { name: 'Payments Received', kw: ['payment','received','deposit'] },
      { name: 'Open Invoices / AR Aging', kw: ['aging','past due','outstanding'] }
    ];
    var best = null, bestScore = 0;
    patterns.forEach(function(p) {
      var score = 0;
      p.kw.forEach(function(k) { if (lower.indexOf(k) >= 0) score += 2; });
      if (score > bestScore) { bestScore = score; best = p; }
    });
    return { recognized: bestScore > 2, report_name: best ? best.name : fileName, confidence: Math.min(bestScore / 8, 1), columns_detected: headers, questions: bestScore <= 2 ? ['What type of report is this?'] : [] };
  }

  function confirmUpload(containerId, result) {
    var templates = [];
    try { templates = JSON.parse(localStorage.getItem('rv_custom_report_templates') || '[]'); } catch(e) {}
    templates.push({
      id: 'tpl_' + Date.now(),
      name: result.report_name,
      reportId: result.suggested_query || result.report_name,
      query_template: result.suggested_query,
      report_name: result.report_name,
      report_category: result.report_category || 'financial',
      placement: result.placement || result.report_category || 'financial',
      columns_detected: result.columns_detected,
      uploadedAt: new Date().toISOString()
    });
    localStorage.setItem('rv_custom_report_templates', JSON.stringify(templates));

    var statusEl = document.getElementById('rw-upload-status-' + containerId);
    statusEl.innerHTML = '<div class="rw-status success">\u2705 Report "' + esc(result.report_name) + '" saved! You can generate it anytime.</div>';

    // Reload the report list
    var placement = document.getElementById(containerId).getAttribute('data-placement') || 'financial';
    loadReports(containerId, placement);
  }

  function manualConfirm(containerId, fileName) {
    var select = document.getElementById('rw-manual-type-' + containerId);
    var typeName = select ? select.value : 'Custom Report';
    confirmUpload(containerId, { report_name: typeName, report_category: 'financial', confidence: 1, suggested_query: null, placement: 'financial' });
  }

  return {
    init: init,
    generate: generate,
    showUpload: showUpload,
    handleFile: handleFile,
    confirmUpload: confirmUpload,
    manualConfirm: manualConfirm,
    toCSV: toCSV,
    downloadFile: downloadFile
  };
})();
