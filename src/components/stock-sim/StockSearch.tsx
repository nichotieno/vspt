"use client";

import React, { useState, useEffect } from 'react';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { searchSymbols } from '@/lib/finnhub';

interface StockSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (symbol: string) => void;
}

export default function StockSearch({ open, onOpenChange, onSelect }: StockSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    const fetchResults = async () => {
      if (query.length > 1) {
        const searchData = await searchSymbols(query);
        setResults(searchData.result || []);
      } else {
        setResults([]);
      }
    };
    
    const timeoutId = setTimeout(() => {
        fetchResults();
    }, 300); // Debounce search
    
    return () => clearTimeout(timeoutId);

  }, [query]);
  
  // Reset query when dialog is closed
  React.useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setQuery('');
        setResults([]);
      }, 100)
    }
  }, [open]);

  const runCommand = React.useCallback((command: () => unknown) => {
    command();
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSelect = (symbol: string) => {
    runCommand(() => onSelect(symbol));
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Search for a stock by symbol or name..." 
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>{query.length > 1 ? "No results found." : "Type to search..."}</CommandEmpty>
        {results.length > 0 && (
          <CommandGroup heading="Results">
            {results.map((result: { symbol: string; description: string }) => (
              <CommandItem key={result.symbol} value={`${result.symbol} ${result.description}`} onSelect={() => handleSelect(result.symbol)}>
                <span className="font-medium mr-2">{result.symbol}</span>
                <span className="text-muted-foreground">{result.description}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
