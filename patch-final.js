const fs = require('fs');
const path = require('path');

let file = path.join(__dirname, 'backend', 'src', 'modules', 'assessments', 'assessments.service.ts');
let code = fs.readFileSync(file, 'utf8');

const p1 = /system:\s*true,\s*topic:\s*\{\s*include:\s*\{\s*chapter:\s*\{\s*include:\s*\{\s*product:\s*\{\s*select:\s*\{\s*id:\s*true,\s*name:\s*true,?\s*\},?\s*\},?\s*\},?\s*\},?\s*\},?\s*\}/g;
const r1 = `system: {\n                  select: {\n                    id: true,\n                    name: true,\n                    category: {\n                      select: {\n                        id: true,\n                        name: true,\n                      }\n                    }\n                  }\n                },\n                topic: { select: { id: true, name: true } },\n                subtopic: { select: { id: true, name: true } }`;

const p2 = /system:\s*true,\s*topic:\s*\{\s*include:\s*\{\s*chapter:\s*\{\s*include:\s*\{\s*product:\s*true,?\s*\},?\s*\},?\s*\},?\s*\}/g;
const r2 = `system: {\n                  include: { product: true }\n                },\n                topic: true,\n                subtopic: true`;

code = code.replace(p1, r1);
code = code.replace(p2, r2);

// Fix TS2339: Property 'productTagId' does not exist
code = code.replace(/productTagId:\s*true/g, 'systemId: true');
code = code.replace(/productTagId:\s*question/g, 'systemId: question'); // Did I already do this? Yes, but maybe didn't catch 1012.
// Line 1012 was: `question.productTagId`... wait, the error is: `Property 'productTagId' does not exist on type '{ id: string; systemId: string; tags: JsonValue; }'`
// So someone is indexing it: `q.productTagId`.
code = code.replace(/productTagId/g, 'systemId'); 

fs.writeFileSync(file, code, 'utf8');

// Now Questions Service
let qFile = path.join(__dirname, 'backend', 'src', 'modules', 'questions', 'questions.service.ts');
let qCode = fs.readFileSync(qFile, 'utf8');

// Fix 'product' does not exist in TopicInclude
qCode = qCode.replace(/subtopic:\s*true,\s*topic:\s*\{\s*include:\s*\{\s*product:\s*true,?\s*\},?\s*\}/g, 'subtopic: true,\n          topic: true,\n          system: {\n            include: { product: true }\n          }');

// Fix subtopicId missing in RandomQuestionFilters
qCode = qCode.replace(/interface RandomQuestionFilters \{[\s\S]*?count\?: number;\n\}/g, `interface RandomQuestionFilters {
  subtopicId?: string;
  systemId?: string;
  topicId?: string;
  difficulty?: string;
  count?: number;
}`);

// Duplicate systemIds:
qCode = qCode.replace(/const \{ systemIds = \[\], systemIds = \[\], systemIds = \[\],/g, 'const { systemIds = [], subjectIds = [], topicIds = [],');
// Fix getFilteredQuestions taking subjectIds
qCode = qCode.replace(/systemIds\?: string\[\];\n  subtopicIds\?: string\[\];\n  pool\?:/g, 'systemIds?: string[];\n  subjectIds?: string[];\n  topicIds?: string[];\n  pool?:');

fs.writeFileSync(qFile, qCode, 'utf8');
console.log('Script finish');
