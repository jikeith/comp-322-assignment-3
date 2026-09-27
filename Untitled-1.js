// agent.js
//
// The smallest useful agent loop:
//   read input -> ask the model -> if it wants a tool, run the tool and
//   ask again -> otherwise print the answer -> repeat.

import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { ollamaChat } from "./ollama.js";
import { getWeather, weatherToolDefinition } from "./tools/weather.js";

const EXIT_WORDS = new Set(["exit", "quit", ":q"]);

// Map tool name -> implementation. Add more tools here as you build them.
const TOOL_IMPLEMENTATIONS = {
  get_weather: getWeather,
};

const TOOLS = [weatherToolDefinition];

function shouldExit(line) {
  return EXIT_WORDS.has(line.trim().toLowerCase());
}

/**
 * Run every tool call the model asked for and turn each into a
 * "tool" role message the model can read on the next turn.
 */
async function runToolCalls(toolCalls) {
  const results = [];

  for (const call of toolCalls) {
    const name = call.function?.name;
    const rawArgs = call.function?.arguments;
    const args =
      typeof rawArgs === "string" ? JSON.parse(rawArgs || "{}") : rawArgs ?? {};

    const impl = TOOL_IMPLEMENTATIONS[name];
    let content;

    if (!impl) {
      content = JSON.stringify({ error: `Unknown tool "${name}"` });
    } else {
      try {
        const result = await impl(args);
        content = JSON.stringify(result);
      } catch (err) {
        content = JSON.stringify({ error: err.message });
      }
    }

    console.log(`  \x1b[2m→ ran ${name}(${JSON.stringify(args)})\x1b[0m`);

    results.push({
      role: "tool",
      content,
      // Some Ollama models expect the name on the tool message too.
      name,
    });
  }

  return results;
}

async function main() {
  const rl = createInterface({ input, output });
  const messages = [
    {
      role: "system",
      content:
        "You are a helpful assistant. Use the get_weather tool when the user asks about current weather.",
    },
  ];

  console.log("Agent ready. Type a message, or 'exit' to quit.\n");

  while (true) {
    const line = await rl.question("You> ");
    if (shouldExit(line)) break;

    const trimmed = line.trim();
    if (!trimmed) continue;

    messages.push({ role: "user", content: trimmed });

    // Loop in case the model chains multiple tool calls before answering.
    let finalReply = null;
    let guard = 0;

    while (finalReply === null && guard < 5) {
      guard += 1;

      let data;
      try {
        data = await ollamaChat(messages, TOOLS);
      } catch (err) {
        finalReply = `(error talking to model: ${err.message})`;
        break;
      }

      const assistantMsg = data?.message;
      const toolCalls = assistantMsg?.tool_calls;

      if (toolCalls && toolCalls.length > 0) {
        // Record the assistant's tool request, then execute the tools.
        messages.push({
          role: "assistant",
          content: assistantMsg.content ?? "",
          tool_calls: toolCalls,
        });

        const toolResults = await runToolCalls(toolCalls);
        messages.push(...toolResults);
        // Loop again so the model can use the tool results.
        continue;
      }

      finalReply =
        assistantMsg?.content?.trim?.() ||
        "(no text from model — check model / Ollama logs)";
      messages.push({ role: "assistant", content: finalReply });
    }

    output.write(`\nAssistant> ${finalReply}\n\n`);
  }

  rl.close();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});