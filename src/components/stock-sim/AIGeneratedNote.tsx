"use client";

import React, { useState } from 'react';
import { generateStockNote } from '@/ai/flows/generate-stock-note';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast";
import { Sparkles } from 'lucide-react';

interface AIGeneratedNoteProps {
  stock: {
    ticker: string;
    name: string;
    price: number;
    changePercent: number;
    news: string;
  };
}

export default function AIGeneratedNote({ stock }: AIGeneratedNoteProps) {
  const [investmentStrategy, setInvestmentStrategy] = useState('');
  const [generatedNote, setGeneratedNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerateNote = async () => {
    if (!investmentStrategy) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter your investment strategy.',
      });
      return;
    }
    setIsLoading(true);
    setGeneratedNote('');
    try {
      const result = await generateStockNote({
        ticker: stock.ticker,
        companyName: stock.name,
        investmentStrategy,
        currentPrice: stock.price,
        percentageChange: stock.changePercent,
        newsSummary: stock.news,
      });
      setGeneratedNote(result.note);
    } catch (error) {
      console.error('Failed to generate note:', error);
      toast({
        variant: 'destructive',
        title: 'AI Note Generation Failed',
        description: 'Could not generate the note. Please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI-Powered Note</CardTitle>
        <CardDescription>
          Generate a custom note for {stock.ticker} based on your investment strategy.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="investment-strategy">Your Investment Strategy</Label>
          <Textarea
            id="investment-strategy"
            placeholder="e.g., Long-term growth, value investing, dividend income..."
            value={investmentStrategy}
            onChange={(e) => setInvestmentStrategy(e.target.value)}
          />
        </div>
        <Button onClick={handleGenerateNote} disabled={isLoading}>
          <Sparkles className="mr-2 h-4 w-4" />
          {isLoading ? 'Generating...' : 'Generate Note'}
        </Button>
        {generatedNote && (
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg">Generated Note</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{generatedNote}</p>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
