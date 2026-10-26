# Author manuscript acceptance test

Use a new, clearly named test copy of the author's manuscript. Keep the original unchanged. Do not run paid AI against it until the author chooses the provider, reviews the scope and authorizes the usage budget.

## Release gates

- `npm test` and `npm run build` pass.
- CI uses pinned EPUBCheck 5.4.0 on cover and coverless EPUB samples. Built-in browser structure checks also run on each exported EPUB.
- Sample print output is 432 × 648 pt (6 × 9 in), 24–828 even pages, all used fonts embedded, no missing glyphs, adequate mirrored margins and readable rendering. Print output is a beta text-only candidate, not PDF/X certified or guaranteed store acceptance. Free-tier attribution remains.
- Whole-book review covers every saved text batch (maximum 40 × 24,000 characters), makes no manuscript edits, checks source quotes, detects changed source snapshots and resumes completed batches. The page must remain open; there is no unattended background worker. Author guide is opt-in. Summary-based review can miss issues and cannot verify external facts.
- OpenRouter rate lookups request no generation. Estimated input tokens use a character heuristic; output is a scenario, not a guarantee or cap. Provider-returned cost is shown when available. Failed or timed-out requests are not included in successful-response totals and may incur charges.

## Test the author's copy

1. Sign in normally. Create a new book and choose Import a draft.
2. Record source chapter count, expected word count, headings, accents, emphasis, tables, notes and images. Inspect all import warnings; acknowledge only after retaining the original file.
3. Preview every chapter boundary. Split/combine/reorder where needed. Verify source footnote markers against the Imported notes chapter. Images, native footnotes, comments and complex layouts are not preserved.
4. Save the outline. Confirm text, chapter order, author details and stored cover. Refresh, sign out/in and resume.
5. Edit one passage manually, wait for cloud save, reload, then restore a previous saved version. Check failure recovery without discarding the draft.
6. If authorized, test one AI passage edit; reject first, then accept. Verify surrounding prose remains unchanged. Compare displayed usage with the provider dashboard.
7. If separately authorized for multiple requests, start a whole-book review. Pause after a batch, refresh, resume. Review source links; dismiss and restore one finding. Edit the source and confirm a new review invalidates the checkpoint. Do not treat an empty findings list as certification.
8. Add/export front and back pages. Download DOCX, TXT/Markdown and EPUB. Compare prose, chapter order and Unicode against the source. Open DOCX in Word or LibreOffice and EPUB in a target reader. Run EPUBCheck on the actual manuscript's EPUB.
9. Prepare the print candidate. Inspect title page, chapter transitions, long headings, last lines, footers and blank padding. Upload it to the selected printer previewer using 6 × 9 in, black-and-white, white paper and no bleed. Keep wrap-cover preparation separate. Order/inspect a physical proof before publishing (author action).
10. Log expected/actual results and reproduction steps. Fix blocking data-loss, auth, persistence, export or billing-clarity issues before public promotion.

The author's live manuscript walkthrough remains pending until the manuscript and signed-in session are available. Automated fixtures are not a substitute for this acceptance test.
