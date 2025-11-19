# Test Questions for Bulk Markdown Upload

This directory contains test markdown files to verify the bulk upload functionality works correctly.

## Test Files

1. **question_1_cardiology.md** - Acute Myocardial Infarction (STEMI)
2. **question_2_pulmonology.md** - Community-Acquired Pneumonia
3. **question_3_gastroenterology.md** - Acute Cholecystitis
4. **question_4_neurology.md** - Ischemic Stroke
5. **question_5_nephrology.md** - Acute Kidney Injury

## Validation

All test files have been validated and should parse correctly. Run the test script to verify:

```bash
cd test_questions
node test_parser.js
```

## Testing the Bulk Upload Feature

### Step 1: Access the Admin Dashboard
1. Navigate to the admin dashboard in your application
2. Click on the **"+ New Question"** button
3. Select **"📚 Bulk Upload Markdown Questions"** from the dropdown menu

### Step 2: Upload Test Files
You have two options:

#### Option A: Multiple Files Upload
1. Click on the upload area or browse for files
2. Select all 5 test markdown files:
   - `question_1_cardiology.md`
   - `question_2_pulmonology.md`
   - `question_3_gastroenterology.md`
   - `question_4_neurology.md`
   - `question_5_nephrology.md`
3. Click "Open" to upload

#### Option B: Directory Upload
1. Select "Directory" mode
2. Upload the entire `test_questions` directory
3. The system will automatically find all `.md` files

### Step 3: Review Processing Summary
After upload, you should see:
- **Total:** 5 files
- **Successful:** 5 files (all should parse correctly)
- **Failed:** 0 files
- **Skipped:** 0 files

Each file should show:
- ✅ Green checkmark for successful parsing
- File name
- No errors or warnings

### Step 4: Create Questions
1. Enter a **Topic ID** in the input field (required for creating questions)
2. Click **"Create 5 Questions"** button
3. Wait for the creation process to complete
4. You should see:
   - Question IDs for each created question
   - "Edit" button next to each question ID

### Step 5: Verify Question Content
For each created question, verify:

1. **Question Stem:**
   - Clinical case information is present
   - All formatting is preserved (bold text, lists, etc.)

2. **Options:**
   - All 5 options (A, B, C, D, E) are present
   - Correct answer is marked
   - Option text is complete

3. **Main Explanation:**
   - Overview section is present
   - Clinical presentation details
   - Tables are rendered correctly (if present)
   - All formatting is preserved

4. **Per-Answer Explanations:**
   - Explanations for each choice (A, B, C, D, E) are present
   - Each explanation is properly formatted

5. **Metadata:**
   - Subject is extracted correctly (e.g., "Cardiology", "Pulmonology")
   - System is extracted correctly (e.g., "Cardiovascular System", "Respiratory System")
   - Tags are present (e.g., ["Cardiology", "Emergency Medicine", "Clinical Case"])

### Step 6: Test Editability
For each question:

1. Click the **"Edit"** button next to the question ID
2. Verify you can edit:
   - ✅ Question stem (add/remove/modify content blocks)
   - ✅ Options (change text, mark correct answer)
   - ✅ Main explanation (add/remove/modify content blocks)
   - ✅ Per-answer explanations (edit each choice explanation)
   - ✅ Metadata (subject, system, tags)
   - ✅ Images (if any were uploaded)

3. Make a test edit (e.g., add a sentence to the stem)
4. Save the question
5. Verify the changes are saved correctly

## Expected Results

### Question 1: Cardiology
- **Subject:** Cardiology
- **System:** Cardiovascular System
- **Correct Answer:** A
- **Tags:** Cardiology, Emergency Medicine, Clinical Case

### Question 2: Pulmonology
- **Subject:** Pulmonology
- **System:** Respiratory System
- **Correct Answer:** C
- **Tags:** Pulmonology, Infectious Disease, Clinical Case

### Question 3: Gastroenterology
- **Subject:** Gastroenterology
- **System:** Digestive System
- **Correct Answer:** D
- **Tags:** Gastroenterology, Surgery, Clinical Case

### Question 4: Neurology
- **Subject:** Neurology
- **System:** Nervous System
- **Correct Answer:** B
- **Tags:** Neurology, Emergency Medicine, Clinical Case

### Question 5: Nephrology
- **Subject:** Nephrology
- **System:** Renal System
- **Correct Answer:** E
- **Tags:** Nephrology, Internal Medicine, Clinical Case

## Troubleshooting

### If parsing fails:
1. Check the error message in the processing summary
2. Verify the markdown file format matches the expected structure
3. Ensure YAML frontmatter is present and correctly formatted
4. Check that options are formatted as `**A.** Option text`

### If questions don't create:
1. Verify you've entered a valid Topic ID
2. Check the browser console for errors
3. Ensure you're authenticated as an admin user

### If content is missing:
1. Check that all sections are properly formatted
2. Verify markdown syntax is correct
3. Check the browser console for parsing errors

## Notes

- All test files follow the same format as `question_demo.md`
- Each file contains exactly one question
- All files include YAML frontmatter with metadata
- All files have complete explanations and per-answer explanations
- Tables are included in some files to test table parsing
- No images are included in these test files (image testing can be done separately)

## Success Criteria

✅ All 5 files parse successfully  
✅ All questions are created with correct content  
✅ All questions are fully editable  
✅ All formatting is preserved (bold, lists, tables)  
✅ Metadata is extracted correctly  
✅ Per-answer explanations are present for all choices  

---

**Created for testing bulk markdown upload functionality**


