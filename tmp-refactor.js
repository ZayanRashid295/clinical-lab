const fs = require('fs');
const path = require('path');

const srcFile = path.join(__dirname, 'backend/src/modules/questions/questions.service.ts');
let code = fs.readFileSync(srcFile, 'utf8');

// The order of replacement matters significantly!
// Old schema:  productTagId -> tag
//              chapterId    -> product's chapter
//              topicId      -> chapter's topic
// New schema:  systemId     -> system
//              topicId      -> system's topic
//              subtopicId   -> topic's subtopic

// 1. Rename existing 'topicId' to 'subtopicId'  (this must happen first so it doesn't clash with chapterId->topicId)
code = code.replace(/topicId:\s*topicId/g, 'subtopicId: subtopicId');
code = code.replace(/topicId/g, 'subtopicId');
code = code.replace(/topicId\?/g, 'subtopicId?');
code = code.replace(/\.topicId/g, '.subtopicId');

// 2. Rename existing 'chapterId' to 'topicId'
code = code.replace(/chapterId/g, 'topicId');
code = code.replace(/\.chapterId/g, '.topicId');

// 3. Rename existing 'productTagId' and 'tagId' to 'systemId'
code = code.replace(/productTagId/g, 'systemId');
code = code.replace(/tagId\?/g, 'systemId?');
code = code.replace(/tagId:/g, 'systemId:');
code = code.replace(/tagId =/g, 'systemId =');
code = code.replace(/\.tagId/g, '.systemId');
code = code.replace(/tagIds\?/g, 'systemIds?');
code = code.replace(/tagIds =/g, 'systemIds =');
code = code.replace(/\.tagIds/g, '.systemIds');

// Now variables and relations:
// 'topic' -> 'subtopic'
code = code.replace(/topic:/g, 'subtopic:');
code = code.replace(/\.topic\./g, '.subtopic.');
code = code.replace(/topics:/g, 'subtopics:');
code = code.replace(/\.topics/g, '.subtopics');
code = code.replace(/Topic:/g, 'Subtopic:');
code = code.replace(/topics\s*=/g, 'subtopics =');

// 'chapter' -> 'topic'
code = code.replace(/chapter:/g, 'topic:');
code = code.replace(/\.chapter\./g, '.topic.');
code = code.replace(/\.chapters/g, '.topics');
code = code.replace(/chapters:/g, 'topics:');

// 'productTag' -> 'system'
code = code.replace(/productTag:/g, 'system:');
code = code.replace(/\.productTag/g, '.system');
code = code.replace(/productTags/g, 'systems');

// Also update 'subjectIds' in getFilteredQuestions
code = code.replace(/subjectIds/g, 'systemIds');

fs.writeFileSync(srcFile, code, 'utf8');
console.log('Script completed.');
