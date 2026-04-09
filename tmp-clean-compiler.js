const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
    const fullPath = path.join(__dirname, 'backend', filePath);
    if (!fs.existsSync(fullPath)) return;
    let content = fs.readFileSync(fullPath, 'utf8');
    for (const [search, replace] of replacements) {
        content = content.replace(search, replace);
    }
    fs.writeFileSync(fullPath, content, 'utf8');
}

// assessments.service.ts patch
replaceInFile('src/modules/assessments/assessments.service.ts', [
    [/productTag: true,\s*topic: \{\s*include: \{\s*chapter: \{\s*include: \{\s*product: \{ [^\}]+\} \}\s*\}\s*\},?\s*\}/g, 
        'system: { select: { id: true, name: true, category: { select: { id: true, name: true } } } },\n          topic: { select: { id: true, name: true } },\n          subtopic: { select: { id: true, name: true } }'],
    [/productTag: true,/g, 'system: true,'],
    [/productTagId/g, 'systemId'],
    [/chapter: {/g, 'topic: {'],
    [/product: true,/g, 'system: { include: { product: true } },'], // For the deep include that previously had product directly under chapter
    [/\.question /g, '.questionId '] // typo in their code, line 551 "question does not exist" -> "questionId"
]);
let aFile = path.join(__dirname, 'backend/src/modules/assessments/assessments.service.ts');
if (fs.existsSync(aFile)) {
    let aCode = fs.readFileSync(aFile, 'utf8');
    // Ensure "chapter: true" wasn't missing
    aCode = aCode.replace(/chapter: true/g, 'topic: true');
    fs.writeFileSync(aFile, aCode, 'utf8');
}


// questions.controller.ts patch
replaceInFile('src/modules/questions/questions.controller.ts', [
    [/topicId: string,/g, 'subtopicId: string,'],
    [/tagId\?:\s*string,/g, 'systemId?: string,\n    topicId?: string,'],
    [/topicId,\s*tagId,\s*difficulty/g, 'subtopicId, systemId, topicId, difficulty'],
    [/tagIds:/g, 'systemIds:'] // getFilteredQuestions mapping in controller
]);
let qcFile = path.join(__dirname, 'backend/src/modules/questions/questions.controller.ts');
if (fs.existsSync(qcFile)) {
    let qcCode = fs.readFileSync(qcFile, 'utf8');
    qcCode = qcCode.replace(/query\.tagIds/g, 'query.systemIds');
    fs.writeFileSync(qcFile, qcCode, 'utf8');
}

// questions.service.ts patch
let qFile = path.join(__dirname, 'backend/src/modules/questions/questions.service.ts');
if (fs.existsSync(qFile)) {
    let qCode = fs.readFileSync(qFile, 'utf8');
    // Error TS2353: 'product' does not exist in 'TopicInclude'
    qCode = qCode.replace(/product: true,/g, ''); 
    // Subtopic queries now just need 'topic: true' instead of 'topic: { include: { product: true } }' etc.
    qCode = qCode.replace(/topic: \{\s*include: \{\s*(.*?)\s*\}\s*\}/g, 'topic: true, subtopic: true');

    // Fix query-question.dto mapping error subtopicId does not exist on QueryQuestionDto
    // Wait, I already added subtopicId to DTO, but in TS service it does something. 
    
    // Duplicate `systemIds` check in multiple variable assignment
    qCode = qCode.replace(/const \{ systemIds = \[\], systemIds = \[\], systemIds = \[\],/g, 'const { systemIds = [], topicIds = [], subtopicIds = [],');
    qCode = qCode.replace(/tagIds\./g, 'systemIds.');
    qCode = qCode.replace(/tagIds/g, 'systemIds');
    qCode = qCode.replace(/tagId/g, 'systemId');
    qCode = qCode.replace(/question\.topicId/g, 'question.subtopicId'); // Wait I did this in previous script, check if subtopicId missing

    // Fix interface QuestionFilters and RandomQuestionFilters missing subtopicId 
    qCode = qCode.replace(/interface QuestionFilters \{[\s\S]*?limit\?: number;\n  offset\?: number;\n\}/g, `interface QuestionFilters {
  subtopicId?: string;
  systemId?: string;
  topicId?: string;
  difficulty?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}`);
    qCode = qCode.replace(/interface RandomQuestionFilters \{[\s\S]*?count\?: number;\n\}/g, `interface RandomQuestionFilters {
  subtopicId?: string;
  systemId?: string;
  topicId?: string;
  difficulty?: string;
  count?: number;
}`);

    // In findAllLegacy: { topicId, tagId, ... } -> { subtopicId, systemId, topicId, ... }
    qCode = qCode.replace(/async findAllLegacy\(filters: QuestionFilters\) \{\n    const \{ topicId, tagId, /g, 'async findAllLegacy(filters: QuestionFilters) {\n    const { subtopicId, systemId, topicId, ');
    qCode = qCode.replace(/async getRandomQuestions\(filters: QuestionFilters\) \{\n    const \{ topicId, tagId, /g, 'async getRandomQuestions(filters: RandomQuestionFilters) {\n    const { subtopicId, systemId, topicId, ');

    fs.writeFileSync(qFile, qCode, 'utf8');
}
console.log('Script finish');
