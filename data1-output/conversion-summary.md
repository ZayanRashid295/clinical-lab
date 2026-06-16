# Question Builder — data1 conversion report

**Input:** `data1/` (17 DOCX files across CVS ACS + Dermatology Psoriasis folders)  
**Output:** `data1-output/`  
**Result:** 17/17 succeeded

## Parser updates (latest)

- Diagram captions: `highlights`, `shows`, `depicts`, `provides` in addition to `illustrates`
- Table/diagram name extraction: skip `Notes`, `Summary`, `Brief Key Points`, prose lines
- Differential table names: title run before delimiter + delimiter section only (excludes key-point prose)
- Complete single-line diff delimiters (`Differential Diagnosis of NSTEMI`) no longer absorb feature titles
- Table classification: `Aspect`, `Drug Class`, `Investigation`, `Drug` column headers
- `Key Point` / `Key Points` treated as secondary concept headings

## Folders

| Folder | Questions | IDs |
|--------|-----------|-----|
| medicinecvsacsmcqsforsoftwarejune1026 | 5 | 502120–502124 |
| medicineskindiseasespsoriasismcqsforsoftwarejune10 | 12 | 515017–515028 |

## Spot-check highlights

| ID | featureTableName | diagram.name |
|----|------------------|--------------|
| 515017 | Chronic Plaque Psoriasis | Chronic Plaque Psoriasis |
| 515027 | Psoriatic Arthritis – Initial Investigation of Joint Involvement | Psoriatic Arthritis – Initial Investigation of Joint Involvement |
| 502123 | NSTEMI (Non–ST Elevation Myocardial Infarction) | NSTEMI (Non–ST Elevation Myocardial Infarction) |
| 515022 | Severe Chronic Plaque Psoriasis – Biologic Therapy (Treatment Escalation Pathway) | same |
