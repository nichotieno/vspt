
'use server';

import { db } from '@/lib/db';
import type { PortfolioItem, Transaction, PortfolioHistoryItem, User } from '@/types';
import { revalidatePath } from 'next/cache';
import { getQuote } from '@/lib/finnhub';
import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';

// User Actions

/**
 * Creates a new user in the database.
 * @param email - The user's email address.
 * @param name - The user's full name.
 * @param password - The user's plain-text password.
 * @returns An object indicating success or failure.
 */
export async function createUserInDb(email: string, name: string, password: string) {
    try {
        const id = randomUUID();
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const stmt = db.prepare('INSERT INTO users (id, email, name, password, cash) VALUES (?, ?, ?, ?, ?)');
        stmt.run(id, email, name, hashedPassword, 100000);
        return { success: true };
    } catch (error: any) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return { success: false, error: 'User with this email already exists.' };
        }
        return { success: false, error: error.message };
    }
}

/**
 * Authenticates a user based on email and password.
 * @param email - The user's email address.
 * @param password - The user's plain-text password.
 * @returns A promise that resolves to an object containing success status, the user object if successful, or an error message.
 */
export async function logInUser(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
        const stmt = db.prepare('SELECT id, email, password, name, investment_strategy FROM users WHERE email = ?');
        const userRow = stmt.get(email) as { id: string; email: string; password: string, name: string, investment_strategy: string } | undefined;

        if (!userRow) {
            return { success: false, error: 'Invalid email or password.' };
        }
        
        const passwordMatch = await bcrypt.compare(password, userRow.password);
        if (!passwordMatch) {
            return { success: false, error: 'Invalid email or password.' };
        }
        
        const user: User = { 
            uid: userRow.id, 
            email: userRow.email,
            name: userRow.name,
            investmentStrategy: userRow.investment_strategy,
        };

        return { success: true, user };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Fetches all relevant data for a given user, including cash, portfolio, watchlist, and transaction history.
 * @param userId - The unique identifier for the user.
 * @returns A promise that resolves to an object containing all user-related data.
 */
export async function getUserData(userId: string) {
    try {
        const userStmt = db.prepare('SELECT cash, name, investment_strategy as investmentStrategy FROM users WHERE id = ?');
        const user = userStmt.get(userId) as { cash: number, name: string, investmentStrategy: string } | undefined;

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
            name: user?.name,
            investmentStrategy: user?.investmentStrategy,
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

/**
 * Updates a user's profile information.
 * @param userId - The user's unique identifier.
 * @param name - The user's new name.
 * @param investmentStrategy - The user's new investment strategy.
 * @returns An object indicating success or failure.
 */
export async function updateUserProfile(userId: string, name: string, investmentStrategy: string) {
    try {
        const stmt = db.prepare('UPDATE users SET name = ?, investment_strategy = ? WHERE id = ?');
        stmt.run(name, investmentStrategy, userId);
        revalidatePath('/profile');
        revalidatePath('/', 'layout'); // Revalidate all pages for updated user data
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}


// Transaction Actions

/**
 * Calculates the current total value of a user's portfolio (holdings + cash)
 * and records it in the portfolio_history table.
 * @param userId - The unique identifier for the user.
 */
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

/**
 * Executes a buy transaction for a user.
 * It updates user's cash, adds or updates a portfolio holding, and records the transaction.
 * @param userId - The unique identifier for the user.
 * @param ticker - The stock ticker symbol to buy.
 * @param quantity - The number of shares to buy.
 * @param price - The price per share.
 * @returns An object indicating success or failure.
 */
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
        revalidatePath('/', 'layout');
        revalidatePath('/transactions');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Executes a sell transaction for a user.
 * It updates user's cash, updates or removes a portfolio holding, and records the transaction.
 * @param userId - The unique identifier for the user.
 * @param ticker - The stock ticker symbol to sell.
 * @param quantity - The number of shares to sell.
 * @param price - The price per share.
 * @returns An object indicating success or failure.
 */
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
        revalidatePath('/', 'layout');
        revalidatePath('/transactions');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Adds or removes a stock from a user's watchlist.
 * @param userId - The unique identifier for the user.
 * @param ticker - The stock ticker symbol to add or remove.
 * @param isWatched - A boolean indicating if the stock is currently on the watchlist.
 * @returns An object indicating success or failure.
 */
export async function toggleWatchlistAction(userId: string, ticker: string, isWatched: boolean) {
    try {
        if (isWatched) {
            const stmt = db.prepare('DELETE FROM watchlist WHERE user_id = ? AND ticker = ?');
            stmt.run(userId, ticker);
        } else {
            const stmt = db.prepare('INSERT INTO watchlist (user_id, ticker) VALUES (?, ?)');
            stmt.run(userId, ticker);
        }
        revalidatePath('/', 'layout');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
