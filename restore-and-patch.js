const fs = require('fs');
const { execSync } = require('child_process');

try {
  execSync('git checkout backend/src/modules/questions/questions.service.ts', { stdio: 'pipe' });
  execSync('node tmp-refactor.js', { stdio: 'pipe' });
} catch (e) {}

let code = fs.readFileSync('backend/src/modules/questions/questions.service.ts', 'utf8');

// 1. Array filter interfaces (this was causing duplicate systemIds)
code = code.replace(/interface QuestionFilters \{[\s\S]*?limit\?: number;\n\s*offset\?: number;\n\}/g, `interface QuestionFilters {
  subtopicId?: string;
  systemId?: string;
  topicId?: string;
  difficulty?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}`);

code = code.replace(/interface RandomQuestionFilters \{[\s\S]*?count\?: number;\n\}/g, `interface RandomQuestionFilters {
  subtopicId?: string;
  systemId?: string;
  topicId?: string;
  difficulty?: string;
  count?: number;
}`);

// getFilteredQuestions interface updates:
code = code.replace(/systemIds\?: string\[\];\n\s*subtopicIds\?: string\[\];\n\s*subtopicIds\?: string\[\];\n/g, 'systemIds?: string[];\n  subjectIds?: string[];\n  topicIds?: string[];\n  subtopicIds?: string[];\n');

// 2. Fix the nested product select in topic includes
const tPattern = /topic:\s*\{\s*include:\s*\{\s*product:\s*\{\s*select:\s*\{\s*name:\s*true\s*\},?\s*\},?\s*\},?\s*\}/g;
code = code.replace(tPattern, 'topic: true, system: { include: { product: { select: { name: true } } } }');

// 3. Fix the subtopic: { include: { topic: { include: { product: true } } } }
const sPattern = /subtopic:\s*\{\s*include:\s*\{\s*topic:\s*\{\s*include:\s*\{\s*product:\s*true,?\s*\},?\s*\},?\s*\},?\s*\}/g;
code = code.replace(sPattern, 'subtopic: true, topic: true, system: { include: { product: true } }');

// 4. Also topic: { include: { product: true } }
const t2Pattern = /topic:\s*\{\s*include:\s*\{\s*product:\s*true,?\s*\},?\s*\}/g;
code = code.replace(t2Pattern, 'topic: true, system: { include: { product: true } }');

// 5. Replace `chapter.product` mapping code on lines ~430:
code = code.replace(/chapter\.product\.name/g, 'chapter?.system?.product?.name');
code = code.replace(/chapter\.product/g, 'chapter?.system?.product');

// 6. Fix getQuestionsByTag which actually uses tagId argument
code = code.replace(/async getQuestionsByTag\((\s*)tagId: string,/g, 'async getQuestionsByTag($1systemId: string,');
code = code.replace(/id:\s*tagId/g, 'id: systemId');
code = code.replace(/Tag with ID \$\{tagId\}/g, 'Tag with ID ${systemId}');

// 7. Fix getTestCreationData 
code = code.replace(/tagId ===/g, 'systemId ===');
code = code.replace(/tagId: /g, 'systemId: ');
code = code.replace(/tagIds\./g, 'systemIds.');
code = code.replace(/tagIds,/g, 'systemIds,');
code = code.replace(/tagIds:/g, 'systemIds:');
code = code.replace(/tagId,/g, 'systemId,');
code = code.replace(/tagId\./g, 'systemId.');
code = code.replace(/const tagIdsJson/g, 'const systemIdsJson');
code = code.replace(/tagIdsJson = systemIds/g, 'systemIdsJson = systemIds');

// 8. Fix Duplicate variables inside filter functions
code = code.replace(/const \{ systemIds = \[\], systemIds = \[\], systemIds = \[\],/g, 'const { systemIds = [], subjectIds = [], topicIds = [], subtopicIds = [],');
code = code.replace(/systemId:\s*tagId,\s*/g, ''); 
code = code.replace(/subtopicId,\s*systemId,\s*topicId,\s*systemId/g, 'subtopicId, systemId, topicId');
code = code.replace(/systemId:\s*systemId,\s*subtopicId/g, 'systemId, subtopicId');

// 9. 'color' does not exist on System
code = code.replace(/color:\s*true,?\s*/g, '');

// 10. `topics` does not exist on ProductInclude
code = code.replace(/topics:\s*\{\s*where:\s*\{\s*isActive:\s*true,?\s*\},\s*orderBy/g, 'systems: { where: { isActive: true }, orderBy');
code = code.replace(/product\.topics/g, 'product.systems');
code = code.replace(/topics:\s*true,?\s*/g, 'systems: true');

fs.writeFileSync('backend/src/modules/questions/questions.service.ts', code);

// Fix the controller payload for getFilteredQuestions
let cCode = fs.readFileSync('backend/src/modules/questions/questions.controller.ts', 'utf8');
cCode = cCode.replace(/subjectIds:\s*query\.subjectIds,\s*topicIds:\s*query\.topicIds,/, 'subjectIds: query.subjectIds,\n      topicIds: query.topicIds,\n      subtopicIds: query.topicIds,'); // Since old query.topicIds mapped to subtopics? Actually let's just make it cleanly map systemIds/subjectIds/topicIds! 
cCode = cCode.replace(
      /getFilteredQuestions\(\{\s*systemIds:\s*query\.systemIds,\s*subjectIds:\s*query\.subjectIds,\s*topicIds:\s*query\.topicIds,\s*pool:\s*query\.pool,/g,
      'getFilteredQuestions({\n      systemIds: query.systemIds,\n      subjectIds: query.subjectIds,\n      topicIds: query.topicIds,\n      pool: query.pool,'
);
fs.writeFileSync('backend/src/modules/questions/questions.controller.ts', cCode);

console.log('Restore and patch completed.');
