"use client";

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePortfolio } from '@/hooks/use-portfolio';
import { downloadAsCSV } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

export default function TransactionsPage() {
    const { transactions } = usePortfolio();
    const { user } = useAuth();
    const router = useRouter();

    if (!user) {
        router.push('/login');
        return null;
    }

    const sortedTransactions = useMemo(() => {
        return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions]);

    const handleExport = () => {
        const dataToExport = sortedTransactions.map(t => ({
            Date: new Date(t.date).toLocaleString(),
            Symbol: t.ticker,
            Type: t.type,
            Shares: t.quantity,
            Price: t.price,
            'Total Value': t.quantity * t.price,
        }));
        downloadAsCSV(dataToExport, 'stocksim-transactions');
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    };

    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
             <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
                <Button asChild variant="outline" size="icon" className="h-7 w-7">
                  <Link href="/dashboard">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Back</span>
                  </Link>
                </Button>
                <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                    Transaction History
                </h1>
                <div className="ml-auto flex items-center gap-2">
                    <Button size="sm" variant="outline" className="h-8 gap-1" onClick={handleExport}>
                        <Download className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Export</span>
                    </Button>
                </div>
            </header>
            <main className="flex-1 p-4 sm:px-6 sm:py-6">
                <Card>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Symbol</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-right">Shares</TableHead>
                                    <TableHead className="text-right">Price</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedTransactions.length > 0 ? (
                                    sortedTransactions.map((t, index) => (
                                        <TableRow key={t.id || index}>
                                            <TableCell className="font-medium">{new Date(t.date).toLocaleDateString()}</TableCell>
                                            <TableCell>{t.ticker}</TableCell>
                                            <TableCell>
                                                <Badge variant={t.type === 'BUY' ? 'success' : 'destructive'}>
                                                    {t.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">{t.quantity}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(t.price)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(t.price * t.quantity)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center">No transactions yet.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
