---
name: security-scan
description: Scan the entire codebase for exposed passwords, emails, API keys, real names, and phone numbers. Run this before every deploy.
disable-model-invocation: true
allowed-tools: Grep, Glob, Read, Bash
---

# Security Scan

Scan ALL .html and .js files (excluding node_modules/) for:

## 1. Exposed Credentials
- Hardcoded passwords (password, passwd, pwd followed by = or :)
- API keys (sk_, pk_, key_, apikey, api_key, token)
- Secret tokens or auth headers

## 2. Real Email Addresses
- Any @gmail.com, @yahoo.com, @outlook.com, @hotmail.com addresses
- Exception: @3120life.com and @example.com are OK

## 3. Real Phone Numbers
- Any (801), (385), or 10-digit phone number patterns
- Exception: placeholder format like (555) 000-0000 is OK

## 4. Real People Names
- Check for Daniel Hart, Sanders (as a person), or any real full names
- Exception: "Sanders Property Management" and "Sanders PM" as business names are OK

## 5. Old Branding
- "RentVerified" or "Rent Verified" (should be "3120 Life")
- "rentverified.com" (should be "3120life.com")

## Output Format
```
🔴 CRITICAL: [file:line] — [what was found]
🟡 WARNING: [file:line] — [what was found]
✅ CLEAN: No issues found in [category]
```

## After Scan
- Fix all CRITICAL items immediately
- Ask about WARNING items
- Show total count: "X critical, Y warnings, Z clean categories"
