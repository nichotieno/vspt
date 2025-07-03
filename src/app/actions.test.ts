'use server';

import { logInUser, buyStockAction, createUserInDb } from './actions';
import { db } from '@/lib/db';
import bcrypt from 'bcrypt';
import { getQuote } from '@/lib/finnhub';
import { revalidatePath } from 'next/cache';

// Mock dependencies
jest.mock('@/lib/db', () => ({
  db: {
    prepare: jest.fn().mockReturnThis(),
    get: jest.fn(),
    run: jest.fn(),
    all: jest.fn(),
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
      (mockedDb.prepare().get as jest.Mock).mockReturnValue(mockUser);
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
      expect(mockedBcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword');
    });

    it('should fail to log in with incorrect password', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com', password: 'hashedpassword' };
      (mockedDb.prepare().get as jest.Mock).mockReturnValue(mockUser);
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await logInUser('test@example.com', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email or password.');
    });

    it('should fail to log in if user does not exist', async () => {
      (mockedDb.prepare().get as jest.Mock).mockReturnValue(undefined);

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

    it('should successfully buy a stock and update portfolio', async () => {
      // Mock user has enough cash
      (mockedDb.prepare().get as jest.Mock).mockImplementation((query) => {
        if (query.includes('SELECT cash FROM users')) {
          return { cash: 2000 };
        }
        if (query.includes('SELECT id, quantity, avg_cost FROM portfolio')) {
          return undefined; // No existing position
        }
        return {};
      });
      (mockedGetQuote as jest.Mock).mockResolvedValue({ c: 150 });

      const result = await buyStockAction(userId, ticker, quantity, price);

      expect(result.success).toBe(true);
      expect(mockedDb.transaction).toHaveBeenCalledTimes(1);
      // Check that a new portfolio item was inserted
      expect(mockedDb.prepare).toHaveBeenCalledWith('INSERT INTO portfolio (user_id, ticker, quantity, avg_cost) VALUES (?, ?, ?, ?)');
      expect(mockedDb.prepare().run).toHaveBeenCalledWith(userId, ticker, quantity, price);
      // Check that user cash was updated
      expect(mockedDb.prepare).toHaveBeenCalledWith('UPDATE users SET cash = cash - ? WHERE id = ?');
      expect(mockedDb.prepare().run).toHaveBeenCalledWith(quantity * price, userId);
      // Check that a transaction was logged
      expect(mockedDb.prepare).toHaveBeenCalledWith('INSERT INTO transactions (user_id, ticker, quantity, price, type, date) VALUES (?, ?, ?, ?, ?, ?)');
      // Check that portfolio history was updated
      expect(mockedGetQuote).toHaveBeenCalledWith(ticker);
      expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
    });

    it('should fail to buy stock with insufficient funds', async () => {
       (mockedDb.prepare().get as jest.Mock).mockReturnValue({ cash: 100 }); // Not enough cash

      const result = await buyStockAction(userId, ticker, quantity, price);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not enough cash.');
      expect(mockedDb.prepare).not.toHaveBeenCalledWith('INSERT INTO portfolio (user_id, ticker, quantity, avg_cost) VALUES (?, ?, ?, ?)');
    });
  });
});
