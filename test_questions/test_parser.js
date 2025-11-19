/**
 * Test script to verify markdown parser works correctly with test questions
 * Run with: node test_parser.js
 */

const fs = require('fs');
const path = require('path');

// Simple markdown parser test (basic validation)
function testParser(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath);
    
    console.log(`\n📄 Testing: ${fileName}`);
    console.log('─'.repeat(60));
    
    // Basic checks
    const checks = {
      hasYamlFrontmatter: content.startsWith('---'),
      hasTitle: /title:\s*"/.test(content),
      hasCorrectAnswer: /correct_answer:\s*[A-E]/.test(content),
      hasTags: /tags:\s*\[/.test(content),
      hasSubject: /#\s+.+\s+[—-]/.test(content), // Support both em dash and regular dash
      hasTopic: /##\s+Topic:\s*/.test(content),
      hasQuestion: /##\s+Question/.test(content),
      hasOptions: /\*\*[A-E]\.\*\*/.test(content),
      hasCorrectAnswerLine: /(?:Correct Answer:|✅|\*\*Correct Answer:\*\*)\s*[A-E]/.test(content),
      hasExplanation: /##\s+Explanation/.test(content),
      hasPerAnswerExplanations: /###\s+Choice\s+[A-E]\s+Explanation/.test(content) || /###\s+Explanation\s+[A-E]/.test(content),
    };
    
    // Count options
    const optionMatches = content.match(/\*\*[A-E]\.\*\*/g);
    const optionCount = optionMatches ? optionMatches.length : 0;
    
    // Count per-answer explanations
    const explanationMatches = content.match(/###\s+(?:Choice\s+)?[A-E]\s+Explanation/g);
    const explanationCount = explanationMatches ? explanationMatches.length : 0;
    
    // Display results
    let allPassed = true;
    for (const [check, passed] of Object.entries(checks)) {
      const status = passed ? '✅' : '❌';
      console.log(`  ${status} ${check}`);
      if (!passed) allPassed = false;
    }
    
    console.log(`\n  📊 Options found: ${optionCount}`);
    console.log(`  📊 Per-answer explanations found: ${explanationCount}`);
    
    if (allPassed && optionCount >= 2) {
      console.log(`\n  ✅ ${fileName} - Parser should work correctly!`);
      return true;
    } else {
      console.log(`\n  ⚠️  ${fileName} - Some checks failed`);
      return false;
    }
  } catch (error) {
    console.error(`\n  ❌ Error testing ${filePath}:`, error.message);
    return false;
  }
}

// Test all question files
const testDir = __dirname;
const files = fs.readdirSync(testDir)
  .filter(file => file.endsWith('.md') && file.startsWith('question_'))
  .sort();

console.log('🧪 Testing Markdown Parser with Test Questions');
console.log('='.repeat(60));

let passedCount = 0;
let totalCount = files.length;

files.forEach(file => {
  const filePath = path.join(testDir, file);
  if (testParser(filePath)) {
    passedCount++;
  }
});

console.log('\n' + '='.repeat(60));
console.log(`📈 Test Summary: ${passedCount}/${totalCount} files passed parser validation`);
console.log('='.repeat(60));

if (passedCount === totalCount) {
  console.log('\n✅ All test files are properly formatted and should parse correctly!');
  console.log('\n📝 Next steps:');
  console.log('   1. Use the Bulk Upload feature in the admin dashboard');
  console.log('   2. Upload all files from the test_questions directory');
  console.log('   3. Verify questions are extracted correctly');
  console.log('   4. Test editing each question');
  process.exit(0);
} else {
  console.log('\n⚠️  Some files may have formatting issues. Please review.');
  process.exit(1);
}

