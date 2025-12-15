import { ChatGroq } from "@langchain/groq";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { TavilySearch } from "@langchain/tavily";
import * as z from "zod";
import { tool } from "langchain";

async function main() {
  const model = new ChatGroq({
    model: "openai/gpt-oss-120b",
    temperature: 0,
  });

  const search = new TavilySearch({
    maxResults: 5,
    topic: "general",
  });

  const calendar = tool(
    ({ query }) => {
      return JSON.stringify([
        { title: "Meeting with Nitish", time: "2 PM", location: "Gmeet" },
      ]);
    },
    {
      name: "get-calendar",
      description: "Call to get calendar events",
      schema: z.object({
        query: z
          .string()
          .describe("The query to use in calendar event search."),
      }),
    }
  );
  const agent = createReactAgent({
    llm: model,
    tools: [search, calendar],
  });

  const result = await agent.invoke({
    messages: [
      {
        role: "system",
        content: `You are a smart personal assistant.

If you know the answer to a question, answer it directly in plain English.

If the answer requires real-time, local, or up-to-date information,
or if you don't know the answer, use the available tools to search the web.

        current datetime: ${new Date().toUTCString()}`,
      },
      {
        role: "user",
        content: "Is there any Meeting today?",
      },
    ],
  });

  console.log("Assistant:", result.messages.at(-1).content);
}

main();
