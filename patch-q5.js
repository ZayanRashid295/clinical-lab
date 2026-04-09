const fs = require('fs');
const path = require('path');

let file = path.join(__dirname, 'backend', 'src', 'modules', 'questions', 'questions.service.ts');
let code = fs.readFileSync(file, 'utf8');

// 1. Duplicate object keys: { systemIds: query.systemIds, systemIds: query.systemIds }
code = code.replace(/systemId:\s*tagId,?\s*/g, '');
code = code.replace(/systemIds:\s*query.systemIds,?\s*/g, 'systemIds: query.systemIds,\n      subjectIds: query.subjectIds,\n      topicIds: query.topicIds,'); // remove duplicates
// Actually in FilteredQuestionsDto, let's fix that.
// Let's just fix the system: true duplicate.
code = code.replace(/system:\s*true,\s*subtopic:\s*true,\s*topic:\s*true/g, 'subtopic: true,\n          topic: true');

// 2. Fix the manual findUnique `product` includes inside `topicId` resolution
code = code.replace(/include:\s*\{\s*product:\s*\{\s*select:\s*\{\s*name:\s*true\s*\},?\s*\},?\s*\}/g, 'include: { system: { include: { product: { select: { name: true } } } } }');
code = code.replace(/chapter\.product\.name/g, 'chapter?.system?.product?.name');
code = code.replace(/chapter\.product/g, 'chapter?.system?.product');

// 3. tagId usage in getQuestionsByTag 
code = code.replace(/const tag = await this\.prisma\.system\.findUnique\(\{\n\s*where: \{ id: tagId \}/g, 'const tag = await this.prisma.system.findUnique({\n      where: { id: systemId }');
code = code.replace(/throw new NotFoundException\(`Tag with ID \$\{tagId\}/g, 'throw new NotFoundException(`Tag with ID ${systemId}');

// 4. More duplicate tagIds -> systemIds replacements
code = code.replace(/tagIds\.length/g, 'systemIds.length');
code = code.replace(/const tagIdsJson/g, 'const systemIdsJson');
code = code.replace(/tagIdsJson = systemIds/g, 'systemIdsJson = systemIds');

// 5. Duplicate identifier 'systemIds' -> my previous script made const { systemIds=[], systemIds=[], systemIds=[]}
// Replace with const { systemIds=[], subjectIds=[], topicIds=[] }
code = code.replace(/const \{ systemIds = \[\], systemIds = \[\], systemIds = \[\],/g, 'const { systemIds = [], subjectIds = [], topicIds = [],');

// 6. fix getFilteredQuestions definition returning to the correct types
code = code.replace(/systemIds\?: string\[\];\n\s*subtopicIds\?: string\[\];\n\s*subtopicIds\?: string\[\];/g, 'systemIds?: string[];\n  subjectIds?: string[];\n  topicIds?: string[];\n  subtopicIds?: string[];');

fs.writeFileSync(file, code, 'utf8');

// SEED USMLE fix
let seedFile = path.join(__dirname, 'backend', 'prisma', 'seed-usmle.ts');
let seedCode = fs.readFileSync(seedFile, 'utf8');

// I'll extract ALL "isActive: true, slug: 'medicine-allied' }" from seed-usmle.ts and revert them EXCEPT for category.
let seedLines = seedCode.split('\n');
let insideCategory = false;
for (let i=0; i<seedLines.length; i++) {
  if (seedLines[i].includes('category = await prisma.category.upsert')) insideCategory = true;
  if (seedLines[i].includes('fcpsProduct = await prisma.product.upsert')) insideCategory = false;
  
  if (!insideCategory && seedLines[i].includes('slug:')) {
    seedLines[i] = seedLines[i].replace(/,\s*slug:\s*'medicine-allied'/g, '');
  }
}
fs.writeFileSync(seedFile, seedLines.join('\n'), 'utf8');

console.log('Final patch complete');
