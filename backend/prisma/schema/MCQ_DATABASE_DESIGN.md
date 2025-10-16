# MCQ System Database Design

## Overview

This database schema is designed to support a flexible, multi-subject MCQ (Multiple Choice Question) system that can handle various academic disciplines and test levels.

## Core Tables (8 Tables)

### 1. `subjects`

**Purpose**: Main subject areas

- **Examples**: Medicine, Engineering, Accounting, Law, etc.
- **Key Fields**: `name`, `description`

### 2. `test_levels`

**Purpose**: Different exam levels within each subject

- **Examples**:
  - Medicine: USMLE1, USMLE2, USMLE3, Step 1, Step 2
  - Engineering: FE Exam, PE Exam, GRE
  - Accounting: CPA, CMA, CIA
- **Key Fields**: `name`, `description`, `subjectId`

### 3. `categories`

**Purpose**: Hierarchical categorization system

- **Structure**: Self-referencing table with unlimited depth
- **Examples**:
  - Medicine → Organ Systems → Cardiovascular → Heart Failure
  - Engineering → Civil → Structural → Steel Design
  - Accounting → Financial → Assets → Depreciation
- **Key Fields**: `name`, `level`, `path`, `parentId`, `subjectId`

### 4. `questions`

**Purpose**: The actual MCQ questions

- **Key Fields**: `questionText`, `explanation`, `correctAnswer`, `imageUrl`, `videoUrl`
- **Relationships**: Links to subject, category, difficulty level

### 5. `question_options`

**Purpose**: Answer choices for each question

- **Key Fields**: `optionText`, `optionKey` (A, B, C, D), `isCorrect`
- **Relationship**: Belongs to a question

### 6. `difficulty_levels`

**Purpose**: Standardized difficulty classification

- **Examples**: Easy, Medium, Hard, Expert
- **Key Fields**: `name`, `weight` (for sorting)

### 7. `tags`

**Purpose**: Flexible tagging system for additional categorization

- **Examples**: "High-Yield", "Image-Based", "Calculation", "Ethics"
- **Key Fields**: `name`, `description`, `color`

### 8. `question_test_levels`

**Purpose**: Many-to-many relationship between questions and test levels

- **Use Case**: A single question can be relevant for multiple test levels

## Supporting Tables

### 9. `question_tags`

**Purpose**: Many-to-many relationship between questions and tags

### 10. `user_progress` (Optional)

**Purpose**: Track user performance and progress

- **Key Fields**: `userId`, `questionId`, `isCorrect`, `timeSpent`

## Key Design Principles

### 1. **Flexibility**

- Supports unlimited subjects and test levels
- Hierarchical categories can be nested to any depth
- Tags provide additional categorization flexibility

### 2. **Scalability**

- Normalized design reduces data redundancy
- Indexed foreign keys for fast queries
- Separate tables for options and tags

### 3. **Extensibility**

- Easy to add new subjects without schema changes
- Tags system allows for custom categorization
- User progress tracking can be added later

### 4. **Data Integrity**

- Foreign key constraints ensure referential integrity
- Unique constraints prevent duplicate data
- Cascade deletes maintain consistency

## Example Data Structure

### Medical Questions

```
Subject: Medicine
├── Test Level: USMLE Step 1
│   └── Category: Organ Systems → Cardiovascular → Heart Failure
│       ├── Question: "What is the most common cause of heart failure?"
│       │   ├── Option A: "Coronary artery disease"
│       │   ├── Option B: "Hypertension"
│       │   ├── Option C: "Valvular disease"
│       │   └── Option D: "Cardiomyopathy"
│       └── Tags: ["High-Yield", "Pathophysiology"]
```

### Engineering Questions

```
Subject: Engineering
├── Test Level: FE Exam
│   └── Category: Civil → Structural → Steel Design
│       ├── Question: "What is the maximum slenderness ratio for compression members?"
│       │   ├── Option A: "200"
│       │   ├── Option B: "300"
│       │   ├── Option C: "400"
│       │   └── Option D: "500"
│       └── Tags: ["Calculation", "Code-Based"]
```

## Query Examples

### Get all questions for USMLE Step 1 in Cardiology

```sql
SELECT q.*, c.name as category_name
FROM questions q
JOIN categories c ON q.categoryId = c.id
JOIN question_test_levels qtl ON q.id = qtl.questionId
JOIN test_levels tl ON qtl.testLevelId = tl.id
WHERE tl.name = 'USMLE Step 1'
AND c.path LIKE '%Cardiovascular%'
```

### Get questions by difficulty and tags

```sql
SELECT q.*, dl.name as difficulty
FROM questions q
JOIN difficulty_levels dl ON q.difficultyLevelId = dl.id
JOIN question_tags qt ON q.id = qt.questionId
JOIN tags t ON qt.tagId = t.id
WHERE dl.name = 'Hard'
AND t.name = 'High-Yield'
```

## Migration Strategy

1. **Phase 1**: Create core tables (subjects, test_levels, categories)
2. **Phase 2**: Add questions and options tables
3. **Phase 3**: Implement tagging system
4. **Phase 4**: Add user progress tracking (optional)

## Performance Considerations

- **Indexes**: Add indexes on frequently queried fields
- **Pagination**: Implement for large question sets
- **Caching**: Cache frequently accessed categories and tags
- **Search**: Consider full-text search for question content

## Future Enhancements

1. **Question Analytics**: Track question performance metrics
2. **Adaptive Testing**: Implement difficulty adjustment based on user performance
3. **Question Banks**: Group questions into study sets
4. **Multimedia Support**: Enhanced support for images, videos, and interactive content
5. **API Integration**: Connect with external question sources
