import OpenAI from 'openai';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Make sure to set this in your environment
});

/**
 * Generate an answer for a given question using OpenAI API
 * @param question - The question to answer
 * @returns Promise<string> - The generated answer
 */
export async function generateAnswer(question: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that provides clear, accurate, and informative answers to questions. The answer should be in 2 sentences."
        },
        {
          role: "user",
          content: question
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || "Sorry, I couldn't generate an answer.";
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
  const questions = [
    "What is the capital of France?",
    "How does photosynthesis work?",
    "What are the benefits of exercise?",
    "Explain quantum computing in simple terms."
  ];
  const start1 = Date.now();
  //const answer1 =  generateAnswer(questions[0]);
   const answer2 =  generateAnswer(questions[1]);
  // const answer3 =  generateAnswer(questions[2]);
  // const answer4 =  generateAnswer(questions[3]);
  
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
  // console.log("🤖 OpenAI Question Answerer\n");
  // console.log("=" .repeat(50));

  // for (const question of questions) {
  //   console.log(`\n❓ Question: ${question}`);
  //   console.log("⏳ Generating answer...");
    
  //   try {
  //     const answer = await generateAnswer(question);
  //     console.log(`✅ Answer: ${answer}`);
  //   } catch (error) {
  //     console.log(`❌ Error: ${error}`);
  //   }
    
  //   console.log("-".repeat(50));
  // }
}

main();