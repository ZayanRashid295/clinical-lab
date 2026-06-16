# Question Builder — Psoriasis batch report

**Input:** `data1/medicineskindiseasespsoriasismcqsforsoftwarejune10/` (12 DOCX)  
**Output:** `data1-output-psoriasis/`  
**Result:** 12/12 succeeded, 0 quality issues

## Parser fixes applied

- **Multi-question DOCX (Q9 file):** Scope content to first question only (515025); stop at `SECTION` / second `Question Id:`; use first feature + first differential tables; limit images to first diagram
- **Differential table detection:** `Condition` + `Distinguishing Point(s)` / `Key Features` column headers
- **Table selection:** Keep first matching feature/differential table (not last overwrite)
- **515024 title layout:** No diff delimiter — dedupe pre-diagram title lines (`Systemic Therapy of Psoriasis – Drug Safety…`)
- **Question Id normalization:** Strip trailing `)` from IDs like `515017)`

## Question IDs

515017–515028 (Q1–Q12)

## Note

`Q9` DOCX contains a second bundled question (515026). Only **515025** is converted from that file. Use the Q10 file for 515026.
