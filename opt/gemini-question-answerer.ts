import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Generate an answer for a given question using Gemini API
 * @param question - The question to answer
 * @returns Promise<string> - The generated answer
 */
export async function generateAnswer(model: any, question: string): Promise<string> {
  try {
    
    
    const result = await model.generateContent(question);
    const response = await result.response;
    const text = response.text();
    
    return text || "Sorry, I couldn't generate an answer.";
  } catch (error) {
    console.error('Error generating answer:', error);
    throw new Error('Failed to generate answer');
  }
}

/**
 * Main function to demonstrate usage
 */
async function main() {
  // Example questions

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  
  const questions = [
    "What is the capital of France?",
    "How does photosynthesis work?",
    "What are the benefits of exercise?",
    "Explain quantum computing in simple terms."
  ];
  const start1 = Date.now();
  //const answer1 =  generateAnswer(model,questions[0]);
   const answer2 =  generateAnswer(model,questions[1]);
  // const answer3 =  generateAnswer(model,questions[2]);
  // const answer4 =  generateAnswer(model,questions[3]);
  
  //const a1 = await answer1;
   const a2 = await answer2;
  // const a3 = await answer3;
  // const a4 = await answer4;
  const time1 = Date.now() - start1;
  //console.log(`✅ Answer 1: ${a1}`);
   console.log(`✅ Answer 2: ${a2}`);
  // console.log(`✅ Answer 3: ${a3}`);
  // console.log(`✅ Answer 4: ${a4}`);
  console.log(`✅ Time: ${time1}ms`);
}

main();
