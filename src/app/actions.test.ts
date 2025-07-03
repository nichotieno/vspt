
'use server';

import { logInUser, buyStockAction, createUserInDb } from './actions';
import { db } from '@/lib/db';
import bcrypt from 'bcrypt';
import { getQuote } from '@/lib/finnhub';
import { revalidatePath } from 'next/cache';

// Mock dependencies
jest.mock('@/lib/db', () => ({
  db: {
    prepare: jest.fn(),
    transaction: jest.fn((cb) => cb()), // Mock transaction to just run the callback
  },
}));

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

jest.mock('@/lib/finnhub', () => ({
  getQuote: jest.fn(),
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

// Typecast mocks for easier use in tests
const mockedDb = db as jest.Mocked<typeof db>;
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockedGetQuote = getQuote as jest.Mocked<typeof getQuote>;

describe('Server Actions', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('logInUser', () => {
    it('should log in a user with correct credentials', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com', password: 'hashedpassword', name: 'Test User', investment_strategy: 'growth' };
      const mockStatement = { get: jest.fn().mockReturnValue(mockUser) };
      (mockedDb.prepare as jest.Mock).mockReturnValue(mockStatement);
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await logInUser('test@example.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.user).toEqual({
        uid: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        investmentStrategy: 'growth',
      });
      expect(mockedDb.prepare).toHaveBeenCalledWith('SELECT id, email, password, name, investment_strategy FROM users WHERE email = ?');
      expect(mockStatement.get).toHaveBeenCalledWith('test@example.com');
      expect(mockedBcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword');
    });

    it('should fail to log in with incorrect password', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com', password: 'hashedpassword' };
      const mockStatement = { get: jest.fn().mockReturnValue(mockUser) };
      (mockedDb.prepare as jest.Mock).mockReturnValue(mockStatement);
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await logInUser('test@example.com', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email or password.');
    });

    it('should fail to log in if user does not exist', async () => {
      const mockStatement = { get: jest.fn().mockReturnValue(undefined) };
      (mockedDb.prepare as jest.Mock).mockReturnValue(mockStatement);

      const result = await logInUser('nouser@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email or password.');
    });
  });

  describe('buyStockAction', () => {
    const userId = 'user-1';
    const ticker = 'AAPL';
    const quantity = 10;
    const price = 150;

    // This is a helper to setup mocks for all DB calls in the action flow
    const setupDbMocks = (userCash: number, existingPortfolioItem: any, finalPortfolioState: any) => {
      const mockRun = jest.fn();
      
      (mockedDb.prepare as jest.Mock).mockImplementation((query: string) => {
        if (query.startsWith('SELECT cash FROM users')) {
          return { get: jest.fn().mockReturnValue({ cash: userCash }) };
        }
        if (query.startsWith('SELECT id, quantity, avg_cost FROM portfolio')) {
          return { get: jest.fn().mockReturnValue(existingPortfolioItem) };
        }
        if (query.startsWith('SELECT ticker, quantity, avg_cost as avgCost FROM portfolio')) {
            return { all: jest.fn().mockReturnValue(finalPortfolioState) };
        }
        // For all INSERT/UPDATE statements, we return the same mock 'run' function
        if (query.startsWith('INSERT') || query.startsWith('UPDATE')) {
          return { run: mockRun };
        }
        // Fallback for any unhandled query
        return { run: jest.fn(), get: jest.fn(), all: jest.fn() };
      });

      return mockRun;
    };
    
    it('should successfully buy a stock for the first time', async () => {
        const mockRun = setupDbMocks(20000, undefined, [{ ticker, quantity, avgCost: price }]);
        (mockedGetQuote as jest.Mock).mockResolvedValue({ c: price });

        const result = await buyStockAction(userId, ticker, quantity, price);

        expect(result.success).toBe(true);
        expect(mockedDb.transaction).toHaveBeenCalledTimes(1);

        // Check that the INSERT for a new portfolio item was called correctly
        expect(mockedDb.prepare).toHaveBeenCalledWith('INSERT INTO portfolio (user_id, ticker, quantity, avg_cost) VALUES (?, ?, ?, ?)');
        expect(mockRun).toHaveBeenCalledWith(userId, ticker, quantity, price);
        
        // Check that cash was updated
        expect(mockedDb.prepare).toHaveBeenCalledWith('UPDATE users SET cash = cash - ? WHERE id = ?');
        expect(mockRun).toHaveBeenCalledWith(quantity * price, userId);
        
        expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
    });

    it('should successfully buy more of an existing stock', async () => {
        const existingItem = { id: 1, quantity: 5, avg_cost: 140 };
        const newQuantity = existingItem.quantity + quantity;
        const newAvgCost = ((existingItem.avg_cost * existingItem.quantity) + (price * quantity)) / newQuantity;

        const mockRun = setupDbMocks(20000, existingItem, [{ ticker, quantity: newQuantity, avgCost: newAvgCost }]);
        (mockedGetQuote as jest.Mock).mockResolvedValue({ c: price });
        
        const result = await buyStockAction(userId, ticker, quantity, price);

        expect(result.success).toBe(true);
        
        // Check that the UPDATE for an existing portfolio item was called correctly
        expect(mockedDb.prepare).toHaveBeenCalledWith('UPDATE portfolio SET quantity = ?, avg_cost = ? WHERE id = ?');
        expect(mockRun).toHaveBeenCalledWith(newQuantity, newAvgCost, existingItem.id);
    });

    it('should fail to buy stock with insufficient funds', async () => {
       setupDbMocks(100, undefined, []);

      const result = await buyStockAction(userId, ticker, quantity, price);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not enough cash.');
      expect(mockedDb.prepare).not.toHaveBeenCalledWith(expect.stringMatching(/^INSERT INTO portfolio/));
      expect(mockedDb.prepare).not.toHaveBeenCalledWith(expect.stringMatching(/^UPDATE portfolio/));
    });
  });
});
