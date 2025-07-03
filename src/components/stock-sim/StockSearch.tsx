"use client";

import * as React from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { searchSymbols } from '@/lib/finnhub';

interface StockSearchProps {
  onSelect: (symbol: string) => void;
}

export default function StockSearch({ onSelect }: StockSearchProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<{ symbol: string; description: string }[]>([]);

  // Reset query when popover is closed
  React.useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
    }
  }, [open]);

  React.useEffect(() => {
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

  const handleSelect = (symbol: string) => {
    onSelect(symbol);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="flex w-full items-center justify-between text-muted-foreground px-3 sm:w-64"
        >
          <div className='flex items-center'>
            <Search className="h-4 w-4 mr-2" />
            Search stocks...
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Search for a stock..." 
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>{query.length > 1 ? "No results found." : "Type to search..."}</CommandEmpty>
            {results.length > 0 && (
              <CommandGroup heading="Results">
                {results.map((result) => (
                  <CommandItem
                    key={result.symbol}
                    value={`${result.symbol} ${result.description}`}
                    onSelect={() => handleSelect(result.symbol)}
                  >
                    <span className="font-medium mr-2">{result.symbol}</span>
                    <span className="text-muted-foreground">{result.description}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
