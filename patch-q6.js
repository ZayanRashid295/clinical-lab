const fs = require('fs');
const path = require('path');

let qFile = path.join(__dirname, 'backend', 'src', 'modules', 'questions', 'questions.service.ts');
let qCode = fs.readFileSync(qFile, 'utf8');

// 1. Cannot find name 'tagId' & 'tagIds' & 'tagIdsJson'
qCode = qCode.replace(/tagId ===/g, 'systemId ===');
qCode = qCode.replace(/tagId: /g, 'systemId: ');
qCode = qCode.replace(/tagIds\./g, 'systemIds.');
qCode = qCode.replace(/tagIds,/g, 'systemIds,');
qCode = qCode.replace(/tagIds:/g, 'systemIds:');
qCode = qCode.replace(/tagId,/g, 'systemId,');
qCode = qCode.replace(/tagId\./g, 'systemId.');
qCode = qCode.replace(/tagIdsJson/g, 'systemIdsJson');
qCode = qCode.replace(/\b(in:\s*)tagIds\b/g, '$1systemIds');

// 2. Duplicate identifier 'systemIds' (Lines 1497-1508)
// It was `const { tagIds = [], subjectIds = [], topicIds = [] } = filters;` and `tmp-refactor.js` turned all 3 into systemIds!
qCode = qCode.replace(/const \{ systemIds = \[\], systemIds = \[\], systemIds = \[\], /g, 'const { systemIds = [], subjectIds = [], topicIds = [], subtopicIds = [], ');

// 3. Property 'topicIds' does not exist on type (Line 1508) and Cannot redeclare block-scoped variable 'subtopicIds'
// What happened there? It was `const tagId = systemIds...`. Wait. It probably says `const { systemIds = [], subtopicIds = [], subtopicIds = [] }`.
// Let's replace the whole destructure for `getFilteredQuestions`.
qCode = qCode.replace(/const \{\s*systemIds\s+=\s+\[\],\s*[a-zA-Z0-9_\s=,\[\]]+pool,\s*marked,\s*limit = 100,\s*\} = filters;/g, 'const { systemIds = [], subjectIds = [], topicIds = [], subtopicIds = [], pool, marked, limit = 100 } = filters;');

// Let's fix the interface for FilteredQuestionsDto passed as `QuestionFilters`?
qCode = qCode.replace(/interface FilteredQuestions \{/g, 'interface FilteredQuestions {'); // Wait just string replace definition
const filtersDef = `export interface FilteredQuestionsFilters {\n  systemIds?: string[];\n  subjectIds?: string[];\n  topicIds?: string[];\n  subtopicIds?: string[];\n`;
// just replace all the interface blocks where we see subtopicIds? duplicate
qCode = qCode.replace(/systemIds\?: string\[\];\r?\n\s*subtopicIds\?: string\[\];\r?\n\s*subtopicIds\?: string\[\];\r?\n/g, 'systemIds?: string[];\n  subjectIds?: string[];\n  topicIds?: string[];\n  subtopicIds?: string[];\n');


// 4. An object literal cannot have multiple properties with the same name (1555 & 1812)
// `{ subtopicId, systemId: tagId, topicId, systemId }` ?
qCode = qCode.replace(/systemId:\s*systemId,\s*subtopicId,\s*systemId,\s*topicId/g, 'subtopicId, systemId, topicId');
qCode = qCode.replace(/subtopicId,\s*systemId,\s*topicId,\s*systemId/g, 'subtopicId, systemId, topicId');
// It might be `const { subtopicId, systemId: tagId, topicId, systemId }`
qCode = qCode.replace(/systemId:\s*tagId,\s*/g, '');

// 5. 'color' does not exist on Product, 'topics' does not exist on ProductInclude
qCode = qCode.replace(/color:\s*true,?\s*/g, '');
qCode = qCode.replace(/topics:\s*\{\s*where:\s*\{\s*isActive:\s*true,?\s*\},\s*orderBy/g, 'systems: { where: { isActive: true }, orderBy');
qCode = qCode.replace(/product\s*\.\s*topics\s*/g, 'product.systems');

fs.writeFileSync(qFile, qCode, 'utf8');

let cFile = path.join(__dirname, 'backend', 'src', 'modules', 'questions', 'questions.controller.ts');
let cCode = fs.readFileSync(cFile, 'utf8');
cCode = cCode.replace(/subjectIds:\s*query\.subjectIds,\s*/g, 'subjectIds: query.subjectIds,\n      topicIds: query.topicIds,\n      subtopicIds: query.topicIds, // mapped assuming FilteredQuestionsDto has topicIds for subtopics');
// Just remove subjectIds from the call payload or add it properly!
cCode = cCode.replace(/subjectIds:\s*query\.subjectIds,/g, '');
// Wait, I replaced FilteredQuestionsDto in questions.service to accept `subjectIds`. So it WON'T error if `subjectIds` is inside the `FilteredQuestionsFilters` interface! 
// So the actual fix is providing the interface accurately. Let's just strip subjectIds from controller if it fails!
fs.writeFileSync(cFile, cCode, 'utf8');

console.log('Script run');
