import Groq from "groq-sdk";
import { tavily } from "@tavily/core";
import readline from 'node:readline/promises'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
console.log(process.env.GROQ_API_KEY);
const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
console.log(process.env.TAVILY_API_KEY);

async function main() {
    const rl=readline.createInterface({input:process.stdin,output:process.stdout});
  const messages = [
    {
      role: "system",
      content: `You are a smart personal assistant who answers the asked questions.
        You have access to following tools:
        1. searchWeb({query}:{query:string}) //search the latest information and real time data
        on the internet.
        current datetime: ${new Date().toUTCString()}`,
    },
    // {
    //   role: "user",
    //   content: "when was iphone 16 launched?",
    // },
  ];
  //for user input
  while (true) {
    const question=await rl.question('You:');
    if(question==='bye'){
        break;
    }
    messages.push({
        role:'user',
        content:question,
    });
    //for llm tool calling
    while (true) {
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
        console.log(`Assistant: ${completions.choices[0].message.content}`);
        break;
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
  rl.close();
}

main();

async function webSearch({ query }) {
  console.log("webSerch Calling ...");
  // console.log(query);
  const response = await tvly.search(query);
  // console.log("Response: ",response);
  const finalResult = response.results.map((result) => result.content);
  // return "iphone was launched on 20 sep 2024";
  return finalResult.join("\n");
}
