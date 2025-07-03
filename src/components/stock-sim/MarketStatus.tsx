"use client"

import { useState, useEffect } from 'react';
import { getMarketStatus } from '@/lib/finnhub';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function MarketStatus() {
    const [status, setStatus] = useState<{ isOpen: boolean, holiday: string | null }>({ isOpen: false, holiday: null });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const data = await getMarketStatus('US');
                setStatus({ isOpen: data.isOpen, holiday: data.holiday });
            } catch (error) {
                console.error("Failed to fetch market status:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStatus();
        // Refresh status every 5 minutes
        const intervalId = setInterval(fetchStatus, 5 * 60 * 1000); 

        return () => clearInterval(intervalId);
    }, []);

    if (loading) {
        return <Badge variant="outline" className="animate-pulse">Loading...</Badge>;
    }
    
    const statusText = status.holiday ? `Closed for ${status.holiday}` : status.isOpen ? 'Market Open' : 'Market Closed';
    const indicatorColor = status.isOpen ? 'bg-green-500' : 'bg-red-500';

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger>
                     <div className="flex items-center gap-2">
                        <span className={`relative flex h-2 w-2`}>
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${indicatorColor} opacity-75`}></span>
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${indicatorColor}`}></span>
                        </span>
                        <span className="text-xs text-muted-foreground hidden sm:inline">{statusText}</span>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{statusText}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
