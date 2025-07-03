'use server';

/**
 * @fileOverview An AI agent for generating custom stock notes.
 *
 * - generateStockNote - A function that generates custom notes for a given stock.
 * - GenerateStockNoteInput - The input type for the generateStockNote function.
 * - GenerateStockNoteOutput - The return type for the generateStockNote function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateStockNoteInputSchema = z.object({
  ticker: z.string().describe('The ticker symbol of the stock.'),
  companyName: z.string().describe('The name of the company.'),
  investmentStrategy: z
    .string()
    .describe(
      'The users investment strategy, to tailor the note generation to their preferences.'
    ),
  currentPrice: z.number().describe('The current price of the stock.'),
  percentageChange: z
    .number()
    .describe('The percentage change in the stock price.'),
  newsSummary: z.string().describe('A summary of recent news about the stock.'),
});
export type GenerateStockNoteInput = z.infer<typeof GenerateStockNoteInputSchema>;

const GenerateStockNoteOutputSchema = z.object({
  note: z.string().describe('The generated stock note.'),
});
export type GenerateStockNoteOutput = z.infer<typeof GenerateStockNoteOutputSchema>;

export async function generateStockNote(
  input: GenerateStockNoteInput
): Promise<GenerateStockNoteOutput> {
  return generateStockNoteFlow(input);
}

const generateStockNotePrompt = ai.definePrompt({
  name: 'generateStockNotePrompt',
  input: {schema: GenerateStockNoteInputSchema},
  output: {schema: GenerateStockNoteOutputSchema},
  prompt: `You are an AI assistant that generates custom stock notes based on user input.

  Given the following information about a stock, generate a concise and informative note tailored to the user's investment strategy.

  Stock Ticker: {{{ticker}}}
  Company Name: {{{companyName}}}
  Investment Strategy: {{{investmentStrategy}}}
  Current Price: {{{currentPrice}}}
  Percentage Change: {{{percentageChange}}}
  News Summary: {{{newsSummary}}}

  Note:`,
});

const generateStockNoteFlow = ai.defineFlow(
  {
    name: 'generateStockNoteFlow',
    inputSchema: GenerateStockNoteInputSchema,
    outputSchema: GenerateStockNoteOutputSchema,
  },
  async input => {
    const {output} = await generateStockNotePrompt(input);
    return output!;
  }
);
