const fs = require('fs');
const path = require('path');

let aFile = path.join(__dirname, 'backend', 'src', 'modules', 'assessments', 'assessments.service.ts');
let aCode = fs.readFileSync(aFile, 'utf8');

// The deep include with product select
aCode = aCode.replace(/category:\s*\{\s*select:\s*\{\s*id:\s*true,\s*name:\s*true,\s*\}\s*\}/g, 'product: { select: { id: true, name: true } }');

fs.writeFileSync(aFile, aCode, 'utf8');

// Now Questions Service
let qFile = path.join(__dirname, 'backend', 'src', 'modules', 'questions', 'questions.service.ts');
let qCode = fs.readFileSync(qFile, 'utf8');

// "topic: { include: { product: true } }" should just be "topic: true, subtopic: true" ... wait! If questions.service.ts fetches product at the topic level, let's just make it system: { include: { product: true } }
qCode = qCode.replace(/topic:\s*\{\s*include:\s*\{\s*product:\s*true,?\s*\},?\s*\}/g, 'topic: true, system: { include: { product: true } }');

// tagId issues
qCode = qCode.replace(/tagId ===/g, 'systemId ===');
qCode = qCode.replace(/tagId: /g, 'systemId: ');
qCode = qCode.replace(/tagIds\./g, 'systemIds.');
qCode = qCode.replace(/tagIds,/g, 'systemIds,');
qCode = qCode.replace(/tagIds:/g, 'systemIds:');

// 'color' does not exist on ProductInclude -> we're fetching Products directly somewhere? 
qCode = qCode.replace(/color:\s*true,?\s*/g, '');

// "topics doesn't exist on ProductInclude"
qCode = qCode.replace(/topics:\s*\{\s*where:\s*\{\s*isActive: true,?\s*\},\s*orderBy:/g, 'systems: { where: { isActive: true }, orderBy:');

// Multiple properties with same name:
qCode = qCode.replace(/systemId:\s*tagId,?\s*/g, ''); // just remove it if systemId is already there
qCode = qCode.replace(/systemIds:\s*query\.systemIds,?\s*/g, 'systemIds: query.systemIds,\n      subjectIds: query.subjectIds,\n      topicIds: query.topicIds,'); // remove duplicates? Actually the duplicate in questions controller was fixed.
// The duplicate in questions.service is: `const { systemIds = [], systemIds = [], systemIds = [], ... }`
qCode = qCode.replace(/const\s*\{\s*systemIds\s*=\s*\[\],\s*systemIds\s*=\s*\[\],\s*systemIds\s*=\s*\[\],/g, 'const { systemIds = [], subjectIds = [], topicIds = [],');

// getFilteredQuestions interface update
qCode = qCode.replace(/systemIds\?: string\[\];\n\s*subtopicIds\?: string\[\];\n\s*subtopicIds\?: string\[\];/g, 'systemIds?: string[];\n  subjectIds?: string[];\n  topicIds?: string[];');

fs.writeFileSync(qFile, qCode, 'utf8');
console.log('Script finish');
