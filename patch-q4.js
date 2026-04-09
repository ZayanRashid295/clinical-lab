const fs = require('fs');
const path = require('path');

let file = path.join(__dirname, 'backend', 'src', 'modules', 'questions', 'questions.service.ts');
let lines = fs.readFileSync(file, 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
  // Fix duplicate system: true
  if (lines[i].includes('system: true') && lines[i+1] && lines[i+1].includes('subtopic: true') && lines[i+1].includes('topic: true')) {
     lines[i] = lines[i].replace(/system:\s*true,/, '');
  }
  
  // Fix tagId in getQuestionsByTag
  if (lines[i].includes('async getQuestionsByTag(')) {
    lines[i+1] = lines[i+1].replace('tagId: string', 'systemId: string');
    let j = i + 1;
    while(j < i + 15) {
       lines[j] = lines[j].replace(/tagId/g, 'systemId');
       j++;
    }
  }

  // Missing product on TopicInclude 
  if (lines[i].includes('topic: {') && lines[i+1] && lines[i+1].includes('include: {') && lines[i+2] && lines[i+2].includes('product: {')) {
     lines[i] = '          topic: true, system: { include: { product: { select: { id: true, name: true } } } }';
     lines[i+1] = '';
     lines[i+2] = '';
     lines[i+3] = '';
     lines[i+4] = '';
     lines[i+5] = '';
     lines[i+6] = '';
     lines[i+7] = '';
     lines[i+8] = '';
  }
  
  // What about subtopic: { include: { topic: { include: { product: { select ...
  if (lines[i].includes('subtopic: {') && lines[i+1] && lines[i+1].includes('include: {') && lines[i+2] && lines[i+2].includes('topic: {') && lines[i+3] && lines[i+3].includes('include: {') && lines[i+4] && lines[i+4].includes('product: {')) {
     lines[i] = '          subtopic: true, topic: true, system: { include: { product: { select: { id: true, name: true } } } }';
     lines[i+1] = '';
     lines[i+2] = '';
     lines[i+3] = '';
     lines[i+4] = '';
     lines[i+5] = '';
     lines[i+6] = '';
     lines[i+7] = '';
     lines[i+8] = '';
     lines[i+9] = '';
     lines[i+10] = '';
     lines[i+11] = '';
     lines[i+12] = '';
     lines[i+13] = '';
  }

  // Duplicate systemIds:
  // "systemIds?: string[];\n  subtopicIds?: string[];\n  pool?:"
  
  // tagIds in questions controller legacy stuff - wait, the error for tagIds is in questions.service on line 1334
  if (lines[i].includes('tagIds') && (lines[i].includes('systemIds =') || lines[i].includes('tagIds.length'))) {
      lines[i] = lines[i].replace(/tagIds/g, 'systemIds');
  }
}

fs.writeFileSync(file, lines.join('\n'), 'utf8');

let seedFile = path.join(__dirname, 'backend', 'prisma', 'seed-usmle.ts');
let seedCode = fs.readFileSync(seedFile, 'utf8');
seedCode = seedCode.replace(/isActive:\s*true,?\s*\}/g, "isActive: true, slug: 'medicine-allied' }");
fs.writeFileSync(seedFile, seedCode, 'utf8');

console.log('Script run');
