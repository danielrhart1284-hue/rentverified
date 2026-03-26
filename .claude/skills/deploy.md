---
name: deploy
description: Run security scan, sync files to rentverified/ subfolder, commit, and push to deploy on Vercel.
disable-model-invocation: true
allowed-tools: Bash, Grep, Glob, Read
---

# Deploy to 3120life.com

Follow these steps in order:

## 1. Security Scan (abort if critical issues found)
Run /security-scan first. If any CRITICAL issues are found, fix them before continuing.

## 2. Sync Files
Copy all root .html and .js files to the rentverified/ subfolder:
```bash
cd "C:\Users\Owner\OneDrive\Documentos\rentverified"
for f in *.html *.js; do [ -f "$f" ] && cp "$f" "rentverified/$f" 2>/dev/null; done
```

## 3. Commit
Stage all changes and commit with a descriptive message. Always include:
```
Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
```

## 4. Push
```bash
git push origin main
```

## 5. Confirm
Tell the user: "Deployed to 3120life.com. Refresh in 1-2 minutes (Ctrl+Shift+R)."

## IMPORTANT
- Never commit .env files, credentials, or API keys
- Never force push
- Always run security scan first
