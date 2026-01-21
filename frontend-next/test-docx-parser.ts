/**
 * Test script for DOCX parser
 * Run with: npx ts-node test-docx-parser.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import mammoth from 'mammoth';

// Mock QuestionsService for testing
class MockQuestionsService {
  async uploadImage(file: File): Promise<{ url: string }> {
    // Mock image upload - just return a placeholder URL
    const fileName = file.name;
    return { url: `https://example.com/uploads/${fileName}` };
  }
}

// Simplified version of parseDocxFile for testing
async function testParseDocxFile(filePath: string) {
  console.log(`\n📄 Testing DOCX parser on: ${filePath}\n`);
  
  try {
    // Read file as buffer
    const fileBuffer = fs.readFileSync(filePath);
    const arrayBuffer = fileBuffer.buffer.slice(
      fileBuffer.byteOffset,
      fileBuffer.byteOffset + fileBuffer.byteLength
    );

    const imageMapping: Record<string, string> = {};
    let imageCounter = 0;

    // Convert DOCX to HTML with image extraction
    console.log('🔄 Parsing DOCX file...');
    const { value: html, messages } = await mammoth.convertToHtml(
      { arrayBuffer },
      {
        convertImage: mammoth.images.imgElement(async (image) => {
          try {
            const imageBuffer = await image.read();
            const contentType = image.contentType || 'image/png';
            const originalRef = `image_${imageCounter++}`;

            // Convert to File object (mock)
            const blob = new Blob([imageBuffer.buffer], { type: contentType });
            const extension = contentType.split('/')[1] || 'png';
            const fileName = `docx_image_${Date.now()}_${Math.random()
              .toString(36)
              .substr(2, 9)}.${extension}`;
            const imageFile = new File([blob], fileName, { type: contentType });

            // Mock upload
            const mockService = new MockQuestionsService();
            const result = await mockService.uploadImage(imageFile);
            imageMapping[originalRef] = result.url;
            
            console.log(`  ✅ Extracted image: ${fileName} (${contentType})`);
            return { src: result.url };
          } catch (error) {
            console.error(`  ❌ Error processing image:`, error);
            return { src: '[IMAGE_ERROR]' };
          }
        }),
      }
    );

    // Convert HTML to plain text
    const text = html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    console.log(`\n✅ DOCX parsed successfully!\n`);
    console.log(`📊 Statistics:`);
    console.log(`   - Text length: ${text.length} characters`);
    console.log(`   - HTML length: ${html.length} characters`);
    console.log(`   - Images extracted: ${Object.keys(imageMapping).length}`);
    console.log(`   - Messages: ${messages.length}`);

    if (messages.length > 0) {
      console.log(`\n⚠️  Warnings/Messages:`);
      messages.forEach((msg, idx) => {
        console.log(`   ${idx + 1}. ${msg.type}: ${msg.message}`);
      });
    }

    // Test rule-based parsing
    console.log(`\n🔍 Testing rule-based parsing...\n`);

    // Extract Question ID
    const questionIdMatch = text.match(/Question\s+Id:\s*(\d+)/i);
    if (questionIdMatch) {
      console.log(`✅ Question ID: ${questionIdMatch[1]}`);
    } else {
      console.log(`❌ Question ID: Not found`);
    }

    // Extract Subject
    const subjectMatch = text.match(/Subject:\s*([^\n]+)/i);
    if (subjectMatch) {
      console.log(`✅ Subject: ${subjectMatch[1].trim()}`);
    } else {
      console.log(`❌ Subject: Not found`);
    }

    // Extract System
    const systemMatch = text.match(/System:\s*([^\n]+)/i);
    if (systemMatch) {
      console.log(`✅ System: ${systemMatch[1].trim()}`);
    } else {
      console.log(`❌ System: Not found`);
    }

    // Extract Topic
    const topicMatch = text.match(/Topic:\s*([^\n]+)/i);
    if (topicMatch) {
      console.log(`✅ Topic: ${topicMatch[1].trim()}`);
    } else {
      console.log(`❌ Topic: Not found`);
    }

    // Extract Question Stem
    const questionPatterns = [
      /Q\s*\d+:\s*(.+?)(?=Atopic|Papular|Scabies|ANSWER|Keywords|Explanation)/is,
      /Question[^:]*:\s*(.+?)(?=Atopic|Papular|Scabies|ANSWER|Keywords|Explanation)/is,
    ];

    let stemFound = false;
    for (const pattern of questionPatterns) {
      const match = text.match(pattern);
      if (match) {
        const stem = match[1].trim().replace(/\s+/g, ' ').substring(0, 100);
        console.log(`✅ Question Stem: ${stem}...`);
        stemFound = true;
        break;
      }
    }
    if (!stemFound) {
      console.log(`❌ Question Stem: Not found`);
    }

    // Extract Options
    const answerIndex = text.search(/ANSWER:/i);
    const optionsSection = answerIndex > 0 ? text.substring(0, answerIndex) : text;
    const optionPattern = /^([A-E])\.\s*(.+)$/i;
    const optionLines = optionsSection.split('\n');
    const options: string[] = [];
    
    for (const line of optionLines) {
      const match = line.match(optionPattern);
      if (match) {
        options.push(`${match[1]}. ${match[2].trim()}`);
      }
    }

    if (options.length > 0) {
      console.log(`✅ Options found: ${options.length}`);
      options.forEach(opt => {
        console.log(`   - ${opt.substring(0, 60)}...`);
      });
    } else {
      console.log(`❌ Options: Not found`);
    }

    // Extract Correct Answer
    const answerMatch = text.match(/ANSWER:\s*([A-E])/i);
    if (answerMatch) {
      console.log(`✅ Correct Answer: ${answerMatch[1]}`);
    } else {
      console.log(`❌ Correct Answer: Not found`);
    }

    // Extract Keywords
    const keywordsMatch = text.match(/Keywords[^:]*:\s*(.+?)(?=Explanation|Choice-by-Choice|$)/is);
    if (keywordsMatch) {
      const keywordsText = keywordsMatch[1].substring(0, 200);
      console.log(`✅ Keywords section found (${keywordsText.length} chars)`);
      console.log(`   Preview: ${keywordsText.substring(0, 100)}...`);
    } else {
      console.log(`❌ Keywords section: Not found`);
    }

    // Extract Explanation
    const explanationMatch = text.match(/Explanation\s*(.+?)(?=Subject:|Topic:|$)/is);
    if (explanationMatch) {
      const explanationText = explanationMatch[1].substring(0, 200);
      console.log(`✅ Explanation section found (${explanationText.length} chars)`);
      console.log(`   Preview: ${explanationText.substring(0, 100)}...`);
    } else {
      console.log(`❌ Explanation section: Not found`);
    }

    // Show sample of extracted text
    console.log(`\n📝 Sample extracted text (first 500 chars):\n`);
    console.log(text.substring(0, 500));
    console.log(`\n...\n`);

    // Show sample HTML
    console.log(`\n📄 Sample HTML (first 500 chars):\n`);
    console.log(html.substring(0, 500));
    console.log(`\n...\n`);

    console.log(`\n✅ Test completed successfully!\n`);

    return {
      text,
      html,
      imageMapping,
      parsed: {
        questionId: questionIdMatch?.[1],
        subject: subjectMatch?.[1]?.trim(),
        system: systemMatch?.[1]?.trim(),
        topic: topicMatch?.[1]?.trim(),
        optionsCount: options.length,
        correctAnswer: answerMatch?.[1],
        hasKeywords: !!keywordsMatch,
        hasExplanation: !!explanationMatch,
      }
    };

  } catch (error) {
    console.error(`\n❌ Error parsing DOCX file:`, error);
    throw error;
  }
}

// Main execution
const docxPath = path.join(__dirname, '../test_questions/sir_tahir_questions/question_test.docx');

if (!fs.existsSync(docxPath)) {
  console.error(`❌ File not found: ${docxPath}`);
  process.exit(1);
}

testParseDocxFile(docxPath)
  .then((result) => {
    console.log(`\n📊 Final Results:`);
    console.log(JSON.stringify(result.parsed, null, 2));
    process.exit(0);
  })
  .catch((error) => {
    console.error(`\n❌ Test failed:`, error);
    process.exit(1);
  });
