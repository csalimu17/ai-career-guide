async function testEnv() {
  console.log("Checking Environment Variables:");
  console.log("GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "PRESENT (hidden)" : "MISSING");
  console.log("GOOGLE_GENAI_API_KEY:", process.env.GOOGLE_GENAI_API_KEY ? "PRESENT (hidden)" : "MISSING");
  
  if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_GENAI_API_KEY) {
    console.error("FATAL: AI features will not work without a valid Gemini API key!");
  }
}

testEnv();
