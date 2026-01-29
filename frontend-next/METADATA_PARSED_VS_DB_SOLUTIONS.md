# Metadata: When Parsed Values (from Document) Don’t Match the DB

**Status: Implemented.** Solutions 1–5 are implemented for both DOCX and Markdown flows. See `metadata-auto-match.ts`, `bulk-docx-uploader.tsx`, and `bulk-markdown-uploader.tsx`.

## Problem

- The document (DOCX/Markdown) is parsed and yields **Subject**, **System**, **Chapter**, **Topic** (and tags).
- The question generator modal only shows **dropdowns filled from the DB** (chapters, topics, subjects).
- Parsed values may **not exist in the DB** (e.g. document says "Cardiology", DB has "Cardiovascular System"; or a new topic name).
- User must either pick something that doesn’t match or can’t proceed.

---

## Possible Solutions (overview)

| # | Approach | Effort | Pros | Cons |
|---|----------|--------|------|------|
| 1 | Show parsed values + auto-match (fuzzy) | Low | No new UI; better defaults | Still no option when nothing matches |
| 2 | Show “Parsed: X” next to each dropdown | Low | User sees doc vs DB clearly | User still has to pick or leave empty |
| 3 | Allow “Use parsed only” (no DB link) | Low–Med | Always works; subject/system as text | Question not linked to taxonomy for filtering |
| 4 | “Add to DB” / quick-create in modal | Medium | New values get into DB; then select | Needs create APIs + UI |
| 5 | Hybrid: match + “Other” free text | Medium | Flexible; can store text or create later | More UI and save logic |
| 6 | Two-phase: Map or Create missing | Medium–High | Clear flow; all values resolved | More screens and logic |

Below are the same options in more detail.

---

## Solution 1: Auto-match parsed values (fuzzy)

**Idea:** When opening the metadata UI, run the same kind of logic as in bulk-markdown: normalize/fuzzy-match parsed Subject → Chapter, System → Section (or derive from Chapter), Topic → Topic. Pre-select dropdowns when there is a match.

**Implementation:**

- Reuse or share the auto-match helpers from `bulk-markdown-uploader.tsx` (e.g. `normalizeName`, `fuzzyMatch`).
- After parsing (DOCX or Markdown), for each question call auto-match with `result.questionData.subject`, `result.questionData.system`, `result.questionData.topic`.
- Set initial metadata (e.g. `questionMetadata[fileName]`) from matched IDs so dropdowns are pre-filled when a match exists.
- In bulk-docx, load chapters (and sections/topics as needed) before or when showing the card, then run auto-match once per result when expanding or when results are set.

**Pros:**  
- Small change; reuses existing pattern.  
- When doc and DB align (exact or fuzzy), user sees correct defaults.

**Cons:**  
- When nothing matches, dropdowns stay empty; no way to “use parsed value” from this alone.

---

## Solution 2: Show “Parsed: X” next to each dropdown

**Idea:** Always show what was parsed from the document next to each metadata field so the user can compare with DB options and choose the closest or leave empty.

**Implementation:**

- In the metadata block for each question, for each field (Subject tag, Chapter, Topic) show:
  - The dropdown (DB options) as now.
  - A small line like: **Parsed:** `{result.questionData.subject}` / `result.questionData.system` / `result.questionData.topic`.
- Optionally grey out or highlight when parsed value has no match in the dropdown (e.g. compare by name; if no option equals parsed, show “(no match in list)”).

**Pros:**  
- Very simple.  
- User clearly sees “what the document said” vs “what I’m selecting from DB”.

**Cons:**  
- Does not fix the case “parsed value not in DB”; user still must pick something else or leave unset.

---

## Solution 3: “Use parsed only” (no DB link)

**Idea:** Allow saving the question with **only** the parsed text for Subject and System (and optionally Topic), without linking to section/chapter/topic IDs. Backend already supports `subject` and `system` as text on create.

**Implementation:**

- In the modal, for each field you can have:
  - **Subject (from document):** read-only or editable text `result.questionData.subject` (and same for System).
  - **Link to taxonomy:** optional dropdown (Chapter, Topic). If user leaves it empty, we “use parsed only”.
- On save:
  - Always send `subject` and `system` from parsed (or user-edited) text.
  - Send `chapterId` / `topicId` / `sectionId` only when user picked from dropdown; otherwise omit.
- Backend already accepts optional `subject`/`system` and optional `sectionId`/`chapterId`/`topicId`; section can be derived from chapter when present.

**Pros:**  
- Works even when nothing in DB matches.  
- No new backend contract; minimal UI (show parsed, optional dropdowns).

**Cons:**  
- Questions without chapter/topic IDs won’t appear in taxonomy-based filters (e.g. “by Chapter”); they still have subject/system text for display.

---

## Solution 4: “Add to DB” / quick-create in modal

**Idea:** If the parsed value is not in the dropdown, offer “Add ‘[parsed value]’ to database” (e.g. as a new Chapter or Topic under a chosen Section/Chapter). After create, refetch list and select the new option.

**Implementation:**

- When user opens the metadata section, run auto-match (Solution 1). If no match for e.g. Topic:
  - Show parsed topic text and a button: **“Add ‘[parsed topic]’ as new topic”** (or “Create and use”).
  - On click: call API to create Topic under the selected (or matched) Chapter; then refetch topics, set the new topic ID in metadata.
- Same pattern for Chapter (create under a Section) or Subject tag (create product tag) if your product supports it.
- Requires:
  - Backend create endpoints for Chapter, Topic (and Section/ProductTag if you want).
  - Small inline form or confirm dialog (e.g. “Create topic ‘X’ under chapter Y?”).

**Pros:**  
- Document values can be added to DB without leaving the flow; then question is fully linked to taxonomy.

**Cons:**  
- More UI and error handling; need create APIs and validation (e.g. duplicate names).

---

## Solution 5: Hybrid – match + “Other” free text

**Idea:** Each metadata field has:
1. A dropdown of DB values (with optional auto-match from parsed).
2. An “Other” option that reveals a text field; user can type or we pre-fill with parsed value.

**Implementation:**

- Dropdown options: all current DB options + “— Other —”.
- When “Other” is selected, show an input (pre-filled with e.g. `result.questionData.subject` or `result.questionData.topic`).
- On save:
  - If a DB option was chosen: send only IDs (and optionally subject/system from DB or parsed).
  - If “Other” was chosen: send only the text (e.g. `subject`, `system`) and no IDs for that dimension; backend stores text only for that part (same as Solution 3), or you could later add “create from Other” (Solution 4) in a second step.

**Pros:**  
- One UI pattern for “pick existing” vs “use custom/parsed”; flexible.

**Cons:**  
- Slightly more UI and save logic; need clear rules for when to send ID vs text.

---

## Solution 6: Two-phase “Map or Create missing”

**Idea:** Before the main question editor, a dedicated “Metadata mapping” step:

- **Phase 1 – Resolve metadata:**  
  For each parsed field (System, Subject/Chapter, Topic, Subject tag), show:
  - Parsed value.
  - “Map to existing:” dropdown (DB list).
  - “Create new:” (e.g. “Add as new topic under this chapter”) that opens a small create form.
  - “Use as text only” (no DB link).
- User resolves all fields, then clicks “Continue”.
- **Phase 2:** Open the usual question editor with resolved metadata (IDs and/or text) pre-filled.

**Pros:**  
- Very clear flow; all mismatches handled in one place.

**Cons:**  
- Extra step and more UI; similar backend/API needs as Solution 4.

---

## Recommendation (short)

- **Quick win:** Do **Solution 1** (auto-match) in bulk-docx (reuse bulk-markdown logic) and **Solution 2** (show “Parsed: X”) so users see doc vs DB and get better defaults.
- **Robust fallback:** Add **Solution 3** (“Use parsed only”): always show parsed subject/system (and optionally topic) and allow saving without chapter/topic IDs so it works even when nothing matches.
- **Later:** If you want every question in the taxonomy, add **Solution 4** (“Add to DB”) or **Solution 5** (Hybrid with “Other”) for Chapter/Topic (and Subject tag if applicable).

If you tell me which solutions you want (e.g. 1 + 2 + 3 first), I can outline exact code changes in the repo (files and steps).
