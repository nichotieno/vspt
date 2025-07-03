
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { BarChart2, Briefcase, Download, Eye, FileClock, Newspaper, Search, ArrowDownUp, TrendingDown, TrendingUp, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { getCompanyProfile, getQuote, getStockNews } from '@/lib/finnhub';
import { usePortfolio } from '@/hooks/use-portfolio';
import type { CompanyProfile, PortfolioItem, StockNews, StockQuote } from '@/types';
import StockSearch from '@/components/stock-sim/StockSearch';
import StockChart from '@/components/stock-sim/StockChart';
import PortfolioChart from '@/components/stock-sim/PortfolioChart';
import AIGeneratedNote from '@/components/stock-sim/AIGeneratedNote';
import { TradeDialog } from '@/components/stock-sim/TradeDialog';
import { ThemeToggle } from '@/components/stock-sim/ThemeToggle';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/use-auth';
import { useRouter, useParams } from 'next/navigation';
import { UserNav } from '@/components/stock-sim/UserNav';
import { MarketStatus } from '@/components/stock-sim/MarketStatus';
import { downloadAsCSV } from '@/lib/utils';
import Link from 'next/link';

type SortKey = 'ticker' | 'value' | 'gainLoss';
type SortDirection = 'asc' | 'desc';

export default function StockDetailPage() {
  const params = useParams();
  const symbol = params.symbol as string;
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const selectedStock = useMemo(() => symbol.toUpperCase(), [symbol]);
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [news, setNews] = useState<StockNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'value', direction: 'desc' });

  const { portfolio, watchlist, toggleWatchlist, cash, getPortfolioValue, getTodaysGainLoss, portfolioHistory } = usePortfolio();
  const { toast } = useToast();

  const portfolioValue = useMemo(() => getPortfolioValue(portfolio), [portfolio, getPortfolioValue]);
  const todaysGainLoss = useMemo(() => getTodaysGainLoss(portfolio), [portfolio, getTodaysGainLoss]);
  
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (selectedStock && user) {
      const fetchData = async () => {
        try {
          setLoading(true);
          const [quoteData, profileData, newsData] = await Promise.all([
            getQuote(selectedStock),
            getCompanyProfile(selectedStock),
            getStockNews(selectedStock)
          ]);
          setQuote(quoteData);
          setProfile(profileData);
          setNews(newsData.slice(0, 5));
        } catch (error) {
          console.error('Error fetching stock data:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch stock data. Please try again.",
          });
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [selectedStock, toast, user]);

  const sortedPortfolio = useMemo(() => {
    const sortablePortfolio = [...portfolio];
    sortablePortfolio.sort((a, b) => {
        const aValue = a.currentPrice ? a.quantity * a.currentPrice : 0;
        const bValue = b.currentPrice ? b.quantity * b.currentPrice : 0;
        const aGainLoss = aValue - (a.avgCost * a.quantity);
        const bGainLoss = bValue - (b.avgCost * b.quantity);

        let compare = 0;
        if (sortConfig.key === 'ticker') {
            compare = a.ticker.localeCompare(b.ticker);
        } else if (sortConfig.key === 'value') {
            compare = bValue - aValue;
        } else if (sortConfig.key === 'gainLoss') {
            compare = bGainLoss - aGainLoss;
        }

        return sortConfig.direction === 'asc' ? compare : -compare;
    });
    return sortablePortfolio;
  }, [portfolio, sortConfig]);

  const requestSort = (key: SortKey) => {
    let direction: SortDirection = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };
  
  const isStockInWatchlist = watchlist.includes(selectedStock);

  const handleSelectStock = (symbol: string) => {
    router.push(`/stock/${symbol}`);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  const handleExportPortfolio = () => {
    const dataToExport = portfolio.map(item => ({
      Symbol: item.ticker,
      Shares: item.quantity,
      'Average Cost': item.avgCost,
      'Current Price': item.currentPrice || 0,
      'Total Value': (item.currentPrice || 0) * item.quantity,
      'Today\'s Change (%)': item.changePercent?.toFixed(2) || '0.00',
    }));
    downloadAsCSV(dataToExport, 'stocksim-portfolio');
  }

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

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <BarChart2 className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">StockSim</h1>
        </Link>
        <div className="relative ml-auto flex items-center gap-2 md:grow-0">
          <MarketStatus />
          <StockSearch onSelect={handleSelectStock} />
          <ThemeToggle />
          <UserNav />
        </div>
      </header>
      <main className="flex-1 grid gap-4 p-4 md:gap-8 md:p-6 md:grid-cols-3">
        {/* Left Column - Stock Details */}
        <div className="grid auto-rows-max items-start gap-4 md:col-span-2">
          {loading ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-8 w-1/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-1/3 mb-2" />
                <Skeleton className="h-4 w-1/4" />
                <div className="mt-4">
                  <Skeleton className="h-64 w-full" />
                </div>
              </CardContent>
            </Card>
          ) : profile && quote ? (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={profile.logo} alt={profile.name} />
                      <AvatarFallback>{profile.ticker}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle>{profile.name} ({profile.ticker})</CardTitle>
                      <p className="text-sm text-muted-foreground">{profile.finnhubIndustry}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{formatCurrency(quote.c)}</div>
                    <div className={`flex items-center justify-end text-sm ${quote.d >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {quote.d >= 0 ? <TrendingUp className="mr-1 h-4 w-4" /> : <TrendingDown className="mr-1 h-4 w-4" />}
                      {formatCurrency(quote.d)} ({quote.dp.toFixed(2)}%)
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex gap-2">
                    <TradeDialog stock={{ ticker: profile.ticker, name: profile.name, price: quote.c }} type="BUY" />
                    <TradeDialog stock={{ ticker: profile.ticker, name: profile.name, price: quote.c }} type="SELL" />
                    <Button variant="outline" onClick={() => toggleWatchlist(selectedStock)}>
                      {isStockInWatchlist ? <X className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                      {isStockInWatchlist ? 'Remove' : 'Add to Watchlist'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <Tabs defaultValue="chart" className="mt-4">
                <TabsList>
                  <TabsTrigger value="chart"><BarChart2 className="mr-2 h-4 w-4" />Chart</TabsTrigger>
                  <TabsTrigger value="news"><Newspaper className="mr-2 h-4 w-4" />News</TabsTrigger>
                  <TabsTrigger value="note"><Eye className="mr-2 h-4 w-4" />AI Note</TabsTrigger>
                </TabsList>
                <TabsContent value="chart">
                  <Card>
                    <CardContent className="p-2 pt-4">
                      <StockChart symbol={selectedStock} />
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="news">
                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        {news.map(item => (
                          <a href={item.url} target="_blank" rel="noopener noreferrer" key={item.id} className="block hover:bg-muted/50 p-2 rounded-lg">
                            <h3 className="font-semibold">{item.headline}</h3>
                            <p className="text-xs text-muted-foreground">{item.source} - {new Date(item.datetime * 1000).toLocaleDateString()}</p>
                            <p className="text-sm mt-1">{item.summary}</p>
                          </a>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="note">
                  <AIGeneratedNote stock={{ ticker: profile.ticker, name: profile.name, price: quote.c, changePercent: quote.dp, news: news.map(n => n.headline).join('. ') }} />
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <Card>
              <CardContent className="p-6">
                <p>No data available for symbol '{selectedStock}'. Select a stock from your portfolio, watchlist, or search to view details.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Portfolio & Lists */}
        <div className="grid auto-rows-max items-start gap-4 md:col-span-1">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Portfolio Overview</CardTitle>
              <CardDescription>Total value including cash</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{formatCurrency(portfolioValue + cash)}</div>
              <div className={`flex items-center text-sm ${todaysGainLoss.value >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {todaysGainLoss.value >= 0 ? <TrendingUp className="mr-1 h-4 w-4" /> : <TrendingDown className="mr-1 h-4 w-4" />}
                <span>{formatCurrency(todaysGainLoss.value)} ({todaysGainLoss.percent.toFixed(2)}%) Today</span>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                <p>Available Cash: {formatCurrency(cash)}</p>
              </div>
               <div className="mt-4">
                 <PortfolioChart data={portfolioHistory} />
              </div>
            </CardContent>
          </Card>
          <Tabs defaultValue="portfolio">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="portfolio">Holdings</TabsTrigger>
                <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
              </TabsList>
              <TabsContent value="portfolio">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between py-4">
                    <CardTitle className="text-lg">My Holdings</CardTitle>
                     <div className="flex items-center gap-2">
                        <Button asChild size="sm" variant="outline" className="h-8 gap-1">
                          <Link href="/transactions">
                            <FileClock className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">History</span>
                          </Link>
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 gap-1" onClick={handleExportPortfolio}>
                          <Download className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Export</span>
                        </Button>
                      </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead onClick={() => requestSort('ticker')} className="cursor-pointer">
                            <div className="flex items-center">Asset <ArrowDownUp className="ml-2 h-3 w-3" /></div>
                          </TableHead>
                          <TableHead onClick={() => requestSort('value')} className="text-right cursor-pointer">
                             <div className="flex items-center justify-end">Value <ArrowDownUp className="ml-2 h-3 w-3" /></div>
                          </TableHead>
                          <TableHead onClick={() => requestSort('gainLoss')} className="text-right cursor-pointer">
                             <div className="flex items-center justify-end">Gain <ArrowDownUp className="ml-2 h-3 w-3" /></div>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedPortfolio.map((item: PortfolioItem) => {
                          const currentValue = (item.currentPrice || 0) * item.quantity;
                          const totalCost = item.avgCost * item.quantity;
                          const gainLoss = currentValue - totalCost;
                          const gainLossPercent = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;
                          return (
                            <TableRow key={item.ticker} onClick={() => handleSelectStock(item.ticker)} className="cursor-pointer">
                              <TableCell>
                                <div className="font-medium">{item.ticker}</div>
                                <div className="text-xs text-muted-foreground">{item.quantity} shares</div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div>{formatCurrency(currentValue)}</div>
                                <div className={`text-xs ${item.changePercent && item.changePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                  {item.changePercent?.toFixed(2) ?? '0.00'}%
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className={`${gainLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(gainLoss)}</div>
                                <div className={`text-xs ${gainLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                  {gainLossPercent.toFixed(2)}%
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="watchlist">
               <Card>
                  <CardHeader className="py-4">
                      <CardTitle className="text-lg">My Watchlist</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Symbol</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {watchlist.map((symbol: string) => (
                          <TableRow key={symbol}>
                            <TableCell onClick={() => handleSelectStock(symbol)} className="cursor-pointer">
                              <div className="font-medium">{symbol}</div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleWatchlist(symbol)}>
                                <X className="h-4 w-4" />
                                <span className="sr-only">Remove from watchlist</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
        </div>
      </main>
    </div>
  );
}

    