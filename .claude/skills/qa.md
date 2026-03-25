---
name: qa
description: Run full QA audit — JS syntax, file inventory, missing scripts, broken links, CRUD tests
user_invocable: true
---

# /qa — Full Quality Assurance Audit

Run a comprehensive QA check across the entire RentVerified platform.

## Steps

### 1. File Inventory
Count and list all files:
- `*.html` files in root
- `*.js` files in root
- `*.css` files in root
- `*.sql` files in supabase/migrations/
- `*.html` files in rentverified/ subdir
- Compare root vs rentverified/ — flag any files that exist in one but not the other

### 2. JavaScript Syntax Check
Run `node --check` on every JS file in root:
```bash
for f in *.js; do node --check "$f" 2>&1; done
```
Report: ✅ valid or ❌ syntax error for each file.

### 3. Missing Script Includes
For each HTML file, check that it includes these required scripts (warn if missing):
- `supabase-config.js`
- `data-layer.js`

Check for the monkey-patch line:
- `RVData._useSupabase = function() { return false; };`

Flag any HTML files missing these.

### 4. Broken Internal Links
For each HTML file, extract all `href="*.html"` links and verify that the target file exists in the same directory. Report any broken links.

### 5. Root vs Subdir Sync Check
For each HTML and JS file in root, check if the same file exists in `rentverified/`. Flag any that are:
- In root but missing from rentverified/
- In rentverified/ but missing from root
- Different sizes (root vs rentverified/) which indicates out-of-sync

### 6. Mobile Responsive Check
For each HTML file, check if it contains `@media` CSS rules. Flag pages that have NO mobile responsive CSS at all.

### 7. Toast/Feedback Check
For each dashboard-type HTML file, check if it includes a toast notification system (either `rv-toast` id or `showToast` function). Flag dashboards with no user feedback mechanism.

### 8. Summary Report
Generate a summary like this:

```
════════════════════════════════════════
  QA AUDIT RESULTS
════════════════════════════════════════

📁 Files
   HTML: XX root / XX rentverified
   JS:   XX
   CSS:  XX
   SQL:  XX migrations

✅ JS Syntax: XX/XX valid
⚠️ Missing Scripts: [list any]
🔗 Broken Links: [list any]
🔄 Out of Sync: [list any]
📱 No Mobile CSS: [list any]
🔔 No Toast System: [list any]

OVERALL: XX/XX checks passed
════════════════════════════════════════
```

### 9. Auto-Fix Option
After showing the report, ask: "Want me to fix the issues found?"
- If yes, fix them in priority order (broken links first, then missing scripts, then sync issues)
- After fixes, re-run the checks to confirm everything passes
