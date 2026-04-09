const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'backend', 'src', 'modules', 'questions', 'questions.service.ts');
let code = fs.readFileSync(file, 'utf8');

// 1. Fix 'product' does not exist on TopicInclude
code = code.replace(/topic:\s*\{\s*include:\s*\{\s*product:\s*true,?\s*\},?\s*\}/g, 'topic: true, subtopic: true');

// 2. Fix subtopicId missing in QuestionFilters
code = code.replace(/interface QuestionFilters \{[\s\S]*?limit\?: number;\n  offset\?: number;\n\}/g, `interface QuestionFilters {
  subtopicId?: string;
  systemId?: string;
  topicId?: string;
  difficulty?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}`);

// 3. Fix subtopicId missing in RandomQuestionFilters
code = code.replace(/interface RandomQuestionFilters \{[\s\S]*?count\?: number;\n\}/g, `interface RandomQuestionFilters {
  subtopicId?: string;
  systemId?: string;
  topicId?: string;
  difficulty?: string;
  count?: number;
}`);

// 4. In findAllLegacy args mapping:
code = code.replace(/async findAllLegacy\(filters: QuestionFilters\) \{\n    const \{ topicId, tagId,/g, 'async findAllLegacy(filters: QuestionFilters) {\n    const { subtopicId, systemId: tagId, topicId, ');
// And randomly Questions
code = code.replace(/async getRandomQuestions\(filters: QuestionFilters\) \{\n    const \{ topicId, tagId,/g, 'async getRandomQuestions(filters: RandomQuestionFilters) {\n    const { subtopicId, systemId: tagId, topicId, ');

// 5. Fix tagIds variables inside questions.service.ts
const qFilterMatches = code.match(/const \{ tagIds = \[\], subjectIds = \[\], topicIds = \[\],/g);
if (qFilterMatches) {
   // Wait, tmp-refactor.js actually changed tagIds to systemIds! 
}
// So tmp-refactor.js already swapped them, meaning it became:
// const { systemIds = [], systemIds = [], systemIds = [],
code = code.replace(/const \{ systemIds = \[\], systemIds = \[\], systemIds = \[\],/g, 'const { systemIds = [], topicIds = [], subtopicIds = [],');
code = code.replace(/if \(systemIds && systemIds\.length > 0\) \{\n      systemFilter = /g, 'if (systemIds && systemIds.length > 0) {\n      systemFilter = ');
code = code.replace(/if \(systemIds && systemIds\.length > 0\)/g, 'if (subtopicIds && subtopicIds.length > 0)'); // Let's check logic!

// Wait, the duplicate identifier 'systemIds' error was at line 1545. I will just run a basic replacement so that it matches what we actually need.
code = code.replace(/const \{ systemIds = \[\], systemIds = \[\], systemIds = \[\],/g, 'const { systemIds = [], subjectIds = [], topicIds = [],');

// Also in questions.service.ts GET methods, 'tagId' still exists occasionally. I will just replace references of tagId to systemId where it's missing definition.
code = code.replace(/tagId ===/g, 'systemId ===');
code = code.replace(/tagId: /g, 'systemId: ');
code = code.replace(/tagIds\./g, 'systemIds.');
code = code.replace(/tagIds,/g, 'systemIds,');
code = code.replace(/tagIds:/g, 'systemIds:');

// 6. "color does not exist on ProductInclude" -> the code selected color on Product. Let's remove `color: true`
code = code.replace(/color:\s*true,?\s*/g, '');

// 7. "topics does not exist on ProductInclude" -> the code selected topics on Product. But Product now has `systems`!
code = code.replace(/topics:\s*\{\s*where:\s*\{\s*isActive: true,?\s*\},\s*orderBy:/g, 'systems: { where: { isActive: true }, orderBy:');

fs.writeFileSync(file, code, 'utf8');
console.log('Questions patched');
