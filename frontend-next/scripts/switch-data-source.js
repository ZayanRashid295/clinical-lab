#!/usr/bin/env node

/**
 * Script to easily switch between mock data and backend API
 * Usage: node scripts/switch-data-source.js [mock|backend]
 */

const fs = require("fs");
const path = require("path");

const ENV_FILE = path.join(__dirname, "..", ".env.local");
const ENV_EXAMPLE_FILE = path.join(__dirname, "..", ".env.example");

function createEnvFile(useMockData) {
  const envContent = `# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:43817

# Data Source Configuration
# Set to "true" to use mock data, "false" to use backend API
NEXT_PUBLIC_USE_MOCK_DATA=${useMockData}

# Application Configuration
NEXT_PUBLIC_APP_NAME="MedPrepAI"
NEXT_PUBLIC_APP_VERSION="1.0.0"

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_DEBUG_LOGS=true
`;

  fs.writeFileSync(ENV_FILE, envContent);
  console.log(
    `✅ Created .env.local with NEXT_PUBLIC_USE_MOCK_DATA=${useMockData}`
  );
}

function switchToMockData() {
  createEnvFile("true");
  console.log("🎭 Switched to MOCK DATA");
  console.log("📝 The application will now use mock data for all API calls");
  console.log('🚀 Run "npm run dev" to start the development server');
}

function switchToBackend() {
  createEnvFile("false");
  console.log("🔗 Switched to BACKEND API");
  console.log("📝 The application will now use the backend API");
  console.log(
    "⚠️  Make sure your backend server is running on http://localhost:43817"
  );
  console.log('🚀 Run "npm run dev" to start the development server');
}

function showCurrentStatus() {
  if (fs.existsSync(ENV_FILE)) {
    const envContent = fs.readFileSync(ENV_FILE, "utf8");
    const mockDataMatch = envContent.match(/NEXT_PUBLIC_USE_MOCK_DATA=(.+)/);

    if (mockDataMatch) {
      const useMockData = mockDataMatch[1].trim();
      console.log(
        `📊 Current data source: ${
          useMockData === "true" ? "MOCK DATA" : "BACKEND API"
        }`
      );
    } else {
      console.log("❓ Data source not configured");
    }
  } else {
    console.log("❓ No .env.local file found");
  }
}

function showHelp() {
  console.log(`
🔄 Data Source Switcher

Usage:
  node scripts/switch-data-source.js [command]

Commands:
  mock      Switch to mock data
  backend   Switch to backend API
  status    Show current data source
  help      Show this help message

Examples:
  node scripts/switch-data-source.js mock
  node scripts/switch-data-source.js backend
  node scripts/switch-data-source.js status

Environment Variables:
  NEXT_PUBLIC_USE_MOCK_DATA=true   # Use mock data
  NEXT_PUBLIC_USE_MOCK_DATA=false  # Use backend API
  NEXT_PUBLIC_API_URL=http://localhost:43817  # Backend URL
`);
}

// Main execution
const command = process.argv[2];

switch (command) {
  case "mock":
    switchToMockData();
    break;
  case "backend":
    switchToBackend();
    break;
  case "status":
    showCurrentStatus();
    break;
  case "help":
  case "--help":
  case "-h":
    showHelp();
    break;
  default:
    if (command) {
      console.log(`❌ Unknown command: ${command}`);
      console.log(
        'Run "node scripts/switch-data-source.js help" for usage information'
      );
    } else {
      showCurrentStatus();
    }
    break;
}
