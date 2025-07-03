"use client";

import React, { useState, useEffect } from 'react';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { searchSymbols } from '@/lib/finnhub';
import { Search } from 'lucide-react';

interface StockSearchProps {
  onSelect: (symbol: string) => void;
}

export default function StockSearch({ onSelect }: StockSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (query.length > 1) {
      const fetchResults = async () => {
        const searchData = await searchSymbols(query);
        setResults(searchData.result || []);
      };
      fetchResults();
    } else {
      setResults([]);
    }
  }, [query]);

  const handleSelect = (symbol: string) => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    onSelect(symbol);
  };

  return (
    <Command className="relative rounded-lg border shadow-md">
      <div className="flex items-center border-b px-3">
        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        <CommandInput 
          placeholder="Search for a stock..." 
          value={query}
          onValueChange={setQuery}
          onFocus={() => setIsOpen(true)}
        />
      </div>
      {isOpen && (
        <div className="absolute z-10 top-full mt-2 w-full">
            <CommandList>
                <CommandEmpty>{query.length > 1 ? "No results found." : "Type to search..."}</CommandEmpty>
                {results.length > 0 && (
                <CommandGroup heading="Results">
                    {results.map((result: { symbol: string; description: string }) => (
                    <CommandItem key={result.symbol} onSelect={() => handleSelect(result.symbol)}>
                        <span className="font-medium mr-2">{result.symbol}</span>
                        <span className="text-muted-foreground">{result.description}</span>
                    </CommandItem>
                    ))}
                </CommandGroup>
                )}
            </CommandList>
        </div>
      )}
    </Command>
  );
}
