const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'backend', 'src', 'modules', 'assessments', 'assessments.service.ts');
let code = fs.readFileSync(file, 'utf8');

// The deep include with product select
const pattern1 = /productTag:\s*true,\s*topic:\s*\{\s*include:\s*\{\s*chapter:\s*\{\s*include:\s*\{\s*product:\s*\{\s*select:\s*\{\s*id:\s*true,\s*name:\s*true,?\s*\},?\s*\},?\s*\},?\s*\},?\s*\},?\s*\}/g;
const replacement1 = `system: {
                  include: {
                    product: {
                      select: { id: true, name: true },
                    },
                  },
                },
                topic: true,
                subtopic: true`;

// The deep include with product true
const pattern2 = /productTag:\s*true,\s*topic:\s*\{\s*include:\s*\{\s*chapter:\s*\{\s*include:\s*\{\s*product:\s*true,?\s*\},?\s*\},?\s*\},?\s*\}/g;
const replacement2 = `system: {
                  include: { product: true },
                },
                topic: true,
                subtopic: true`;

// The question.productTagId -> question.systemId
code = code.replace(/productTagId:\s*question\.productTagId/g, 'systemId: question.systemId');
code = code.replace(/productTagId:\s*true/g, 'systemId: true');

// Typo
code = code.replace(/\.question /g, '.questionId ');

// productTag: true standalone without the topic struct following it (for other queries)
code = code.replace(/productTag:\s*true/g, 'system: true');

code = code.replace(pattern1, replacement1);
code = code.replace(pattern2, replacement2);

fs.writeFileSync(file, code, 'utf8');
console.log('Assessments patched');
