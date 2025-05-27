// src/ai/flows/suggest-replies.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting smart replies based on the context of the current conversation.
 *
 * - suggestReplies - A function that generates smart reply suggestions.
 * - SuggestRepliesInput - The input type for the suggestReplies function.
 * - SuggestRepliesOutput - The output type for the suggestReplies function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestRepliesInputSchema = z.object({
  conversationHistory: z
    .string()
    .describe('The history of the current conversation.'),
  userMessage: z.string().describe('The latest message from the user.'),
});
export type SuggestRepliesInput = z.infer<typeof SuggestRepliesInputSchema>;

const SuggestRepliesOutputSchema = z.object({
  suggestions: z
    .array(z.string())
    .describe('An array of suggested reply messages.'),
});
export type SuggestRepliesOutput = z.infer<typeof SuggestRepliesOutputSchema>;

export async function suggestReplies(input: SuggestRepliesInput): Promise<SuggestRepliesOutput> {
  return suggestRepliesFlow(input);
}

const suggestRepliesPrompt = ai.definePrompt({
  name: 'suggestRepliesPrompt',
  input: {schema: SuggestRepliesInputSchema},
  output: {schema: SuggestRepliesOutputSchema},
  prompt: `You are a helpful chatbot assistant that suggests replies to the user based on the current conversation.

  Generate 3 suggested replies based on the context of the conversation history and the latest user message.

  Conversation History:
  {{conversationHistory}}

  User Message:
  {{userMessage}}

  Format the output as a JSON object with a "suggestions" field containing an array of strings.
  Do not include any preamble or explanation, just the array.
  `,
});

const suggestRepliesFlow = ai.defineFlow(
  {
    name: 'suggestRepliesFlow',
    inputSchema: SuggestRepliesInputSchema,
    outputSchema: SuggestRepliesOutputSchema,
  },
  async input => {
    const {output} = await suggestRepliesPrompt(input);
    return output!;
  }
);
