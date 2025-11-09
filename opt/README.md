# AI Question Answerer

A simple TypeScript script that uses either OpenAI API or Google Gemini API to generate answers for questions.

## Features

- 🤖 Supports both OpenAI's GPT-3.5-turbo and Google's Gemini Pro models
- 📝 TypeScript support with proper typing
- 🔧 Configurable parameters (temperature, max tokens)
- 🎯 Simple API for question answering
- 📦 Ready-to-run example with multiple questions
- ⚡ Parallel API calls for faster execution
- ⏱️ Built-in timing measurements

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env
   ```
   Then edit `.env` and add your API keys.

3. **Get your API keys:**
   - **OpenAI**: Visit [OpenAI Platform](https://platform.openai.com/api-keys)
   - **Gemini**: Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Add both keys to your `.env` file

## Usage

### Run the scripts directly:

**OpenAI version:**
```bash
npm start
```

**Gemini version:**
```bash
npm run start:gemini
```

### Use as a module:

**OpenAI:**
```typescript
import { generateAnswer } from './openai-question-answerer';

const answer = await generateAnswer("What is TypeScript?");
console.log(answer);
```

**Gemini:**
```typescript
import { generateAnswer } from './gemini-question-answerer';

const answer = await generateAnswer("What is TypeScript?");
console.log(answer);
```

### Development mode (with auto-reload):

**OpenAI:**
```bash
npm run dev
```

**Gemini:**
```bash
npm run dev:gemini
```

## API

### `generateAnswer(question: string): Promise<string>`

Generates an answer for the given question using OpenAI's API.

**Parameters:**
- `question` (string): The question to answer

**Returns:**
- `Promise<string>`: The generated answer

**Example:**
```typescript
const answer = await generateAnswer("How does machine learning work?");
console.log(answer);
```

## Configuration

The script uses the following default settings:
- Model: `gpt-3.5-turbo`
- Max tokens: `500`
- Temperature: `0.7`

You can modify these in the `generateAnswer` function if needed.

## Error Handling

The function includes proper error handling and will throw descriptive errors if:
- The API key is missing or invalid
- The OpenAI API is unavailable
- The request fails for any reason
