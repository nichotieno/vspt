
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BarChart2, TrendingUp, TrendingDown } from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import { getStockSymbols, getQuote, getCompanyProfile } from '@/lib/finnhub';
import type { StockQuote } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeToggle } from '@/components/stock-sim/ThemeToggle';
import { UserNav } from '@/components/stock-sim/UserNav';
import StockSearch from '@/components/stock-sim/StockSearch';
import { MarketStatus } from '@/components/stock-sim/MarketStatus';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


interface StockData {
    symbol: string;
    description: string;
    logo: string;
    quote: StockQuote | null;
}

const STOCKS_PER_PAGE = 20;

export default function DashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [stocks, setStocks] = useState<StockData[]>([]);
    const [allSymbols, setAllSymbols] = useState<{ symbol: string; description: string }[]>([]);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    
    const observer = useRef<IntersectionObserver>();
    const isFetching = useRef(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    const loadMoreStocks = useCallback(async () => {
        if (isFetching.current || !hasMore) return;
        
        isFetching.current = true;
        setIsLoading(true);

        try {
            let symbolsToUse = allSymbols;
            if (page === 1 && symbolsToUse.length === 0) {
                const symbols = await getStockSymbols('US');
                const filteredSymbols = symbols.filter((s: any) => s.symbol && s.description && !s.symbol.includes('.') && s.type === 'Common Stock');
                setAllSymbols(filteredSymbols);
                symbolsToUse = filteredSymbols;
            }

            if (symbolsToUse.length === 0) {
                setHasMore(false);
                return;
            }

            const start = (page - 1) * STOCKS_PER_PAGE;
            const end = start + STOCKS_PER_PAGE;
            const symbolsToFetch = symbolsToUse.slice(start, end);
    
            if (symbolsToFetch.length === 0) {
                setHasMore(false);
                return;
            }
    
            const stocksDataPromises = symbolsToFetch.map(async (s) => {
                try {
                    const [quote, profile] = await Promise.all([
                        getQuote(s.symbol),
                        getCompanyProfile(s.symbol)
                    ]);
                    if (quote && profile) {
                        return {
                            symbol: s.symbol,
                            description: s.description,
                            logo: profile.logo,
                            quote,
                        };
                    }
                } catch (error) {
                    console.error(`Failed to fetch data for ${s.symbol}`, error);
                }
                return null;
            });
    
            const newStocks = (await Promise.all(stocksDataPromises)).filter(Boolean) as StockData[];
            
            setStocks(prev => [...prev, ...newStocks]);
            setPage(prev => prev + 1);

            if (end >= symbolsToUse.length) {
                setHasMore(false);
            }
        } catch (error) {
            console.error("An error occurred while loading stocks:", error);
            setHasMore(false);
        } finally {
            setIsLoading(false);
            isFetching.current = false;
        }
    }, [allSymbols, page, hasMore]);


    useEffect(() => {
        if (user && page === 1) {
            loadMoreStocks();
        }
    }, [user, page, loadMoreStocks]);


    const lastStockElementRef = useCallback((node: any) => {
        if (isLoading) return;
        if (observer.current) observer.current.disconnect();
        
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                loadMoreStocks();
            }
        });

        if (node) observer.current.observe(node);
    }, [isLoading, hasMore, loadMoreStocks]);


    const handleSelectStock = (symbol: string) => {
        router.push(`/stock/${symbol}`);
    };
    
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    };

    if (authLoading || !user) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <div className="flex items-center space-x-2">
                    <BarChart2 className="h-8 w-8 animate-pulse text-primary" />
                    <p className="text-lg">Loading StockSim...</p>
                </div>
            </div>
        );
    }
    
    const showInitialSkeletons = stocks.length === 0 && isLoading;

    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <BarChart2 className="h-6 w-6 text-primary" />
                    <h1 className="text-xl font-bold">StockSim</h1>
                </Link>
                <div className="relative ml-auto flex items-center gap-2 md:grow-0">
                    <StockSearch onSelect={handleSelectStock} />
                    <ThemeToggle />
                    <UserNav />
                </div>
            </header>
            <main className="flex-1 p-4 md:p-6">
                 <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-semibold">Market Overview</h1>
                    <MarketStatus />
                </div>
                <Card>
                    <CardContent className="p-0">
                        <div className="w-full overflow-auto">
                            <Table>
                                <TableHeader className="sticky top-16 bg-background z-10">
                                    <TableRow>
                                        <TableHead>Asset</TableHead>
                                        <TableHead className="text-right">Price</TableHead>
                                        <TableHead className="text-right">Change</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {showInitialSkeletons && Array.from({ length: 10 }).map((_, i) => (
                                         <TableRow key={`skeleton-initial-${i}`}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Skeleton className="hidden h-9 w-9 rounded-full sm:flex" />
                                                    <div className="grid gap-0.5">
                                                        <Skeleton className="h-5 w-12" />
                                                        <Skeleton className="h-4 w-40" />
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell><Skeleton className="h-4 w-20 float-right" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-16 float-right" /></TableCell>
                                        </TableRow>
                                    ))}
                                    {stocks.map((stock, index) => (
                                        <TableRow 
                                            key={stock.symbol} 
                                            ref={index === stocks.length - 1 ? lastStockElementRef : null}
                                            className="cursor-pointer"
                                            onClick={() => handleSelectStock(stock.symbol)}
                                        >
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="hidden h-9 w-9 sm:flex">
                                                        <AvatarImage src={stock.logo} alt={stock.description} />
                                                        <AvatarFallback>{stock.symbol.slice(0, 2)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="grid gap-0.5">
                                                        <p className="font-medium">{stock.symbol}</p>
                                                        <p className="text-xs text-muted-foreground truncate max-w-xs">{stock.description}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {stock.quote?.c != null ? formatCurrency(stock.quote.c) : <Skeleton className="h-4 w-20 float-right" />}
                                            </TableCell>
                                            <TableCell className={`text-right ${stock.quote?.dp != null && stock.quote.dp >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                {stock.quote?.dp != null ? (
                                                    <div className="flex items-center justify-end gap-1">
                                                        {stock.quote.dp >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                                        <span>{stock.quote.dp.toFixed(2)}%</span>
                                                    </div>
                                                ) : <Skeleton className="h-4 w-16 float-right" />}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {isLoading && stocks.length > 0 && Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={`skeleton-loading-${i}`}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Skeleton className="hidden h-9 w-9 rounded-full sm:flex" />
                                                    <div className="grid gap-0.5">
                                                        <Skeleton className="h-5 w-12" />
                                                        <Skeleton className="h-4 w-40" />
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell><Skeleton className="h-4 w-20 float-right" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-16 float-right" /></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                         {!hasMore && !isLoading && <p className="text-center text-muted-foreground p-4">You've reached the end of the list.</p>}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
