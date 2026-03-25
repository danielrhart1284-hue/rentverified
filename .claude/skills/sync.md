---
name: sync
description: Sync all project files from worktree to main project and rentverified/ subdirectory
user_invocable: true
---

# /sync — Sync All Project Files

Sync all HTML, JS, CSS, SQL, and MD files from the current working directory to the main project folder and the `rentverified/` subdirectory.

## Steps

1. Detect the current working directory. If inside a worktree (path contains `.claude/worktrees/`), set:
   - `SOURCE` = current working directory (the worktree)
   - `MAIN` = `C:\Users\Owner\OneDrive\Documentos\rentverified`
   If already in the main project, set:
   - `SOURCE` = current working directory
   - `MAIN` = current working directory

2. Copy all root-level files from SOURCE to MAIN:
   ```
   cp SOURCE/*.html MAIN/
   cp SOURCE/*.js MAIN/
   cp SOURCE/*.css MAIN/
   ```

3. Copy all files from SOURCE/rentverified/ to MAIN/rentverified/:
   ```
   cp SOURCE/rentverified/*.html MAIN/rentverified/
   cp SOURCE/rentverified/*.js MAIN/rentverified/
   cp SOURCE/rentverified/*.css MAIN/rentverified/
   ```

4. Sync root HTML/JS to rentverified/ subdir (ensure both copies match):
   ```
   for each *.html and *.js in MAIN/:
     cp MAIN/file MAIN/rentverified/file
   ```
   Skip files that only exist in root (like playwright.config.js, serve.py).

5. Copy Supabase migrations if they exist:
   ```
   cp SOURCE/supabase/migrations/*.sql MAIN/supabase/migrations/
   ```

6. Copy QA/report files:
   ```
   cp SOURCE/*.md MAIN/ (QA_AUDIT.md, QA_FULL_TEST_REPORT.md, etc.)
   ```

7. Report results:
   - Count HTML files synced
   - Count JS files synced
   - Count SQL migrations synced
   - Show total
   - Confirm: "✅ Sync complete — MAIN project and rentverified/ subdir are up to date."
