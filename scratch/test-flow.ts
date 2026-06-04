
import { interactiveAiCareerAssistant } from '../src/ai/flows/interactive-ai-career-assistant-flow';

async function test() {
  try {
    const result = await interactiveAiCareerAssistant({
      message: "Help me analyze my CV for a Senior Product Designer role",
      uid: "test-uid" // Use a dummy UID
    });
    console.log("Success:", result);
  } catch (e) {
    console.error("FAILED:", e);
  }
}

test();
