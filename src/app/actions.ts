'use server';

import { db } from '@/lib/db';
import type { PortfolioItem, Transaction, PortfolioHistoryItem, User } from '@/types';
import { revalidatePath } from 'next/cache';
import { getQuote } from '@/lib/finnhub';
import { randomUUID } from 'crypto';

// User Actions
export async function createUserInDb(email: string, password_DO_NOT_STORE_IN_PLAINTEXT: string) {
    try {
        const id = randomUUID();
        const stmt = db.prepare('INSERT INTO users (id, email, password, cash) VALUES (?, ?, ?, ?)');
        // In a real application, you should hash the password before storing it.
        stmt.run(id, email, password_DO_NOT_STORE_IN_PLAINTEXT, 100000);
        return { success: true };
    } catch (error: any) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return { success: false, error: 'User with this email already exists.' };
        }
        return { success: false, error: error.message };
    }
}

export async function logInUser(email: string, password_DO_NOT_STORE_IN_PLAINTEXT: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
        const stmt = db.prepare('SELECT id, email, password FROM users WHERE email = ?');
        const userRow = stmt.get(email) as { id: string; email: string; password: string } | undefined;

        if (!userRow) {
            return { success: false, error: 'Invalid email or password.' };
        }
        
        // In a real application, use bcrypt.compare to check the password hash.
        if (userRow.password !== password_DO_NOT_STORE_IN_PLAINTEXT) {
            return { success: false, error: 'Invalid email or password.' };
        }

        return { success: true, user: { uid: userRow.id, email: userRow.email } };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getUserData(userId: string) {
    try {
        const userStmt = db.prepare('SELECT cash FROM users WHERE id = ?');
        const user = userStmt.get(userId) as { cash: number } | undefined;

        const portfolioStmt = db.prepare('SELECT ticker, quantity, avg_cost as avgCost FROM portfolio WHERE user_id = ?');
        const portfolio = portfolioStmt.all(userId) as PortfolioItem[];

        const watchlistStmt = db.prepare('SELECT ticker FROM watchlist WHERE user_id = ?');
        const watchlistRows = watchlistStmt.all(userId) as { ticker: string }[];
        const watchlist = watchlistRows.map(w => w.ticker);

        const transactionsStmt = db.prepare('SELECT id, ticker, type, quantity, price, date FROM transactions WHERE user_id = ? ORDER BY date DESC');
        const transactions = transactionsStmt.all(userId) as Transaction[];

        const historyStmt = db.prepare('SELECT id, date, value FROM portfolio_history WHERE user_id = ? ORDER BY date ASC');
        const portfolioHistory = historyStmt.all(userId) as PortfolioHistoryItem[];
        
        return {
            cash: user?.cash ?? 100000,
            portfolio,
            watchlist,
            transactions,
            portfolioHistory,
        };
    } catch (error: any) {
        console.error('Error fetching user data:', error.message);
        throw new Error('Failed to fetch user data.');
    }
}


// Transaction Actions

async function addPortfolioHistoryRecord(userId: string) {
    // This function calculates the current portfolio value and adds a record.
    // It's called after a buy or sell transaction.
    const portfolioStmt = db.prepare('SELECT ticker, quantity, avg_cost as avgCost FROM portfolio WHERE user_id = ?');
    const portfolio = portfolioStmt.all(userId) as PortfolioItem[];
    
    let currentTotalValue = 0;
    for (const item of portfolio) {
        try {
            const quote = await getQuote(item.ticker);
            currentTotalValue += (quote.c || item.avgCost) * item.quantity;
        } catch (e) {
            // If API fails for a stock, use its average cost as a fallback
            currentTotalValue += item.avgCost * item.quantity;
        }
    }

    const userStmt = db.prepare('SELECT cash FROM users WHERE id = ?');
    const user = userStmt.get(userId) as { cash: number };

    const totalValue = user.cash + currentTotalValue;

    const stmt = db.prepare('INSERT INTO portfolio_history (user_id, date, value) VALUES (?, ?, ?)');
    stmt.run(userId, new Date().toISOString(), totalValue);
}

export async function buyStockAction(userId: string, ticker: string, quantity: number, price: number) {
    const cost = quantity * price;

    const transaction = db.transaction(() => {
        const userStmt = db.prepare('SELECT cash FROM users WHERE id = ?');
        const user = userStmt.get(userId) as { cash: number };

        if (!user || user.cash < cost) {
            throw new Error('Not enough cash.');
        }

        const existingItemStmt = db.prepare('SELECT id, quantity, avg_cost FROM portfolio WHERE user_id = ? AND ticker = ?');
        const existingItem = existingItemStmt.get(userId, ticker) as { id: number, quantity: number, avg_cost: number } | undefined;
        
        if (existingItem) {
            const newQuantity = existingItem.quantity + quantity;
            const newAvgCost = ((existingItem.avg_cost * existingItem.quantity) + cost) / newQuantity;
            const updateStmt = db.prepare('UPDATE portfolio SET quantity = ?, avg_cost = ? WHERE id = ?');
            updateStmt.run(newQuantity, newAvgCost, existingItem.id);
        } else {
            const insertStmt = db.prepare('INSERT INTO portfolio (user_id, ticker, quantity, avg_cost) VALUES (?, ?, ?, ?)');
            insertStmt.run(userId, ticker, quantity, price);
        }

        const updateUserStmt = db.prepare('UPDATE users SET cash = cash - ? WHERE id = ?');
        updateUserStmt.run(cost, userId);

        const transStmt = db.prepare('INSERT INTO transactions (user_id, ticker, quantity, price, type, date) VALUES (?, ?, ?, ?, ?, ?)');
        transStmt.run(userId, ticker, quantity, price, 'BUY', new Date().toISOString());
    });

    try {
        transaction();
        await addPortfolioHistoryRecord(userId); // Add history record after successful transaction
        revalidatePath('/');
        revalidatePath('/transactions');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function sellStockAction(userId: string, ticker: string, quantity: number, price: number) {
    const proceeds = quantity * price;

    const transaction = db.transaction(() => {
        const existingItemStmt = db.prepare('SELECT id, quantity FROM portfolio WHERE user_id = ? AND ticker = ?');
        const existingItem = existingItemStmt.get(userId, ticker) as { id: number, quantity: number } | undefined;
        
        if (!existingItem || existingItem.quantity < quantity) {
            throw new Error('Not enough shares to sell.');
        }

        if (existingItem.quantity === quantity) {
            const deleteStmt = db.prepare('DELETE FROM portfolio WHERE id = ?');
            deleteStmt.run(existingItem.id);
        } else {
            const newQuantity = existingItem.quantity - quantity;
            const updateStmt = db.prepare('UPDATE portfolio SET quantity = ? WHERE id = ?');
            updateStmt.run(newQuantity, existingItem.id);
        }

        const updateUserStmt = db.prepare('UPDATE users SET cash = cash + ? WHERE id = ?');
        updateUserStmt.run(proceeds, userId);

        const transStmt = db.prepare('INSERT INTO transactions (user_id, ticker, quantity, price, type, date) VALUES (?, ?, ?, ?, ?, ?)');
        transStmt.run(userId, ticker, quantity, price, 'SELL', new Date().toISOString());
    });
    
    try {
        transaction();
        await addPortfolioHistoryRecord(userId); // Add history record after successful transaction
        revalidatePath('/');
        revalidatePath('/transactions');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function toggleWatchlistAction(userId: string, ticker: string, isWatched: boolean) {
    try {
        if (isWatched) {
            const stmt = db.prepare('DELETE FROM watchlist WHERE user_id = ? AND ticker = ?');
            stmt.run(userId, ticker);
        } else {
            const stmt = db.prepare('INSERT INTO watchlist (user_id, ticker) VALUES (?, ?)');
            stmt.run(userId, ticker);
        }
        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
