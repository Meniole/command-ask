import OpenAI from "openai";
import { Context } from "../../../types";
import { SuperOpenAi } from "./openai";
const MAX_TOKENS = 3000;

export interface CompletionsType {
  answer: string;
  tokenUsage: {
    input: number;
    output: number;
    total: number;
  };
}

export class Completions extends SuperOpenAi {
  protected context: Context;

  constructor(client: OpenAI, context: Context) {
    super(client, context);
    this.context = context;
  }

  async createCompletion(prompt: string, model: string = "o1-mini", addlContext: string[]): Promise<CompletionsType> {
    const res: OpenAI.Chat.Completions.ChatCompletion = await this.client.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: [
            {
              type: "text",
              text:
                "You are tasked with assisting as a GitHub bot by generating responses based on provided chat history and similar responses, focusing on using available knowledge within the provided corpus, which may contain code, documentation, or incomplete information. Your role is to interpret and use this knowledge effectively to answer user questions.\n\n# Steps\n\n1. **Understand Context**: Review the chat history and any similar provided responses to understand the context.\n2. **Extract Relevant Information**: Identify key pieces of information, even if they are incomplete, from the available corpus.\n3. **Apply Knowledge**: Use the extracted information and relevant documentation to construct an informed response.\n4. **Draft Response**: Compile the gathered insights into a coherent and concise response, ensuring it's clear and directly addresses the user's query.\n5. **Review and Refine**: Check for accuracy and completeness, filling any gaps with logical assumptions where necessary.\n\n# Output Format\n\n- Concise and coherent responses in paragraphs that directly address the user's question.\n- Incorporate inline code snippets or references from the documentation if relevant.\n\n# Examples\n\n**Example 1**\n\n*Input:*\n- Chat History: \"What was the original reason for moving the LP tokens?\"\n- Corpus Excerpts: \"It isn't clear to me if we redid the staking yet and if we should migrate. If so, perhaps we should make a new issue instead. We should investigate whether the missing LP tokens issue from the MasterChefV2.1 contract is critical to the decision of migrating or not.\"\n\n*Output:*\n\"It was due to missing LP tokens issue from the MasterChefV2.1 Contract.\n\n# Notes\n\n- Ensure the response is crafted from the corpus provided, without introducing information outside of what's available or relevant to the query.\n- Consider edge cases where the corpus might lack explicit answers, and justify responses with logical reasoning based on the existing information." +
                "Context: " +
                addlContext.join("\n"),
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
      temperature: 0.2,
      max_tokens: MAX_TOKENS,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      response_format: {
        type: "text",
      },
    });
    const answer = res.choices[0].message;
    if (answer && answer.content && res.usage) {
      return { answer: answer.content, tokenUsage: { input: res.usage.prompt_tokens, output: res.usage.completion_tokens, total: res.usage.total_tokens } };
    }
    return { answer: "", tokenUsage: { input: 0, output: 0, total: 0 } };
  }
}
