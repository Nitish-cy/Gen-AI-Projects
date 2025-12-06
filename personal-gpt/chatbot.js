import Groq from "groq-sdk";
import { tavily } from "@tavily/core";
import NodeCache from "node-cache";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
console.log(process.env.GROQ_API_KEY);
const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
console.log(process.env.TAVILY_API_KEY);
const cache = new NodeCache({ stdTTL: 60 * 60 * 24 }); //24 hrs

export async function generate(userMessage, threadId) {
  const baseMessages = [
    {
      role: "system",
      content: `You are a smart personal assistant.

If you know the answer to a question, answer it directly in plain English.

If the answer requires real-time, local, or up-to-date information,
or if you don't know the answer, use the available tools to search the web.

You have access to the following tool:

webSearch(query: string): Use this to search the internet for current or unknown information.

Decide when to use your own knowledge and when to use the tool.

Do not mention the tool unless needed.

Examples:

Q: What is the capital of France?
A: The capital of France is Paris.

Q: What’s the weather in Mumbai right now?
A: (Use the search tool to find the latest weather)

Q: Who is the Prime Minister of India?
A: The current Prime Minister of India is Narendra Modi.

        current datetime: ${new Date().toUTCString()}`,
    },
    // {
    //   role: "user",
    //   content: "when was iphone 16 launched?",
    // },
  ];
  const messages = cache.get(threadId) ?? baseMessages;
  //for user input
  messages.push({
    role: "user",
    content: userMessage,
  });
  //for llm tool calling
  const MAX_RETRIES = 10;
  let count = 0;
  while (true) {
    if (count > MAX_RETRIES) {
      return "I could not find result, please try again";
    }
    count++;
    const completions = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0,
      messages: messages,
      tools: [
        {
          type: "function",
          function: {
            name: "webSearch",
            description:
              "Search the latest information and real time data on the internet",
            parameters: {
              // JSON Schema object
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "The Search query to perfome search on",
                },
              },
              required: ["query"],
            },
          },
        },
      ],
      tool_choice: "auto",
    });
    messages.push(completions.choices[0].message);

    const toolCalls = completions.choices[0].message.tool_calls;
    if (!toolCalls) {
      console.log(completions.choices[0].message.content);
      cache.set(threadId, messages);
      console.log(cache);
      return completions.choices[0].message.content;
    }
    for (const tool of toolCalls) {
      //console.log("Tool: ", tool);
      const functionName = tool.function.name;
      const functionParams = tool.function.arguments;
      if (functionName === "webSearch") {
        const toolResult = await webSearch(JSON.parse(functionParams));
        //console.log("Tool Result:", toolResult);
        messages.push({
          tool_call_id: tool.id,
          role: "tool",
          name: functionName,
          content: toolResult,
        });
      }
    }
  }
}

async function webSearch({ query }) {
  console.log("webSerch Calling ...");
  // console.log(query);
  const response = await tvly.search(query);
  // console.log("Response: ",response);
  const finalResult = response.results.map((result) => result.content);
  // return "iphone was launched on 20 sep 2024";
  console.log(finalResult);
  return finalResult.join("\n");
}
