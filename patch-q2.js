const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'backend', 'src', 'modules', 'questions', 'questions.service.ts');
let code = fs.readFileSync(file, 'utf8');

// The block causing the error:
// subtopic: {
//   include: {
//     topic: {
//       include: {
//         product: { select: { id: true, name: true } },
//       },
//     },
//   },
// },
// Replace with:
// subtopic: true, topic: true, system: { select: { id: true, name: true } }
// Wait, no. The question include expects 'subtopic' and 'topic' at the top level?
// A question belongs to subtopicId, topicId, systemId directly!
// So previously it did: `productTag: true, topic: { include: { chapter: { include: { product: ... } } } }`
// The `tmp-refactor.js` changed `chapter` to `topic`, and `topic` to `subtopic`.
// Then I need to change:
const pattern1 = /subtopic:\s*\{\s*include:\s*\{\s*topic:\s*\{\s*include:\s*\{\s*product:\s*\{\s*select:\s*\{\s*id:\s*true,\s*name:\s*true\s*\},?\s*\},?\s*\},?\s*\},?\s*\},?\s*\}/g;
code = code.replace(pattern1, 'subtopic: true, topic: true, system: { include: { product: { select: { id: true, name: true } } } }');

const pattern2 = /subtopic:\s*\{\s*include:\s*\{\s*topic:\s*\{\s*include:\s*\{\s*product:\s*true,?\s*\},?\s*\},?\s*\},?\s*\}/g;
code = code.replace(pattern2, 'subtopic: true, topic: true, system: { include: { product: true } }');

fs.writeFileSync(file, code, 'utf8');
console.log('Script ran successfully');
