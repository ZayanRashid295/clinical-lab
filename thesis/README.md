# MedPrepAI Thesis (LaTeX)

Complete BS CIS thesis for **MedPrepAI: An Intelligent Virtual Consultation, Medical Training, and Clinical Workflow Platform**, following the PIEAS template structure exemplified by `LLM_Augmented_Malware_Analysis_System.pdf`.

## Authors

- Zayan Rashid Rana
- Muhammad Ahad Siddique

**Supervisor:** Dr. Kamran Safdar  
**Co-Supervisor:** Ahmad Hassan Chaudhry

## Overleaf / assets

Upload **`figures/pieas.png`** (PIEAS logo on title page). A copy is in `thesis/figures/pieas.png`.

## Before submission

1. Replace roll numbers in `frontmatter.tex` (`03-3-1-XXX-2022`).
2. Add signatures on declaration and certificate pages.
3. Insert screenshots into `figures/` and reference them in Chapter 4 (optional enhancement).
4. Run plagiarism check per department policy.

## Compile

```bash
cd thesis
pdflatex main.tex
bibtex main
pdflatex main.tex
pdflatex main.tex
```

Output: `main.pdf` (target ~65--75 pages with default 12pt A4; add screenshots to exceed 70).

Requires: TeX Live (or MacTeX) with `pdflatex`, `bibtex`, TikZ, `longtable`, `booktabs`.

### Figures included (TikZ)
- High-level architecture
- NestJS module groups
- MedPrep sequence diagram
- LMS ER diagram
- RBAC layers + LLM paths
- Deployment topology
- Mode pedagogy map
- Conversation state machine
- Test session workflow

## Structure

| File | Content |
|------|---------|
| `main.tex` | Master document |
| `frontmatter.tex` | Title, declaration, certificate, dedication, acknowledgements |
| `abstract.tex` | Abstract |
| `chapters/ch01-introduction.tex` | Chapter 1 |
| `chapters/ch02-literature.tex` | Literature review |
| `chapters/ch03-methodology.tex` | Methodology (full platform) |
| `chapters/ch04-results.tex` | Case studies |
| `chapters/ch05-conclusion.tex` | Conclusion |
| `references.bib` | Bibliography |
| `appendices.tex` | Module list, env vars, routes |
