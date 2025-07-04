
'use server';

import { logInUser, buyStockAction, createUserInDb, sellStockAction, toggleWatchlistAction } from './actions';
import { db } from '@/lib/db';
import bcrypt from 'bcrypt';
import { getQuote } from '@/lib/finnhub';
import { revalidatePath } from 'next/cache';

// Mock dependencies
jest.mock('@/lib/db', () => ({
  db: {
    // The transaction mock must return a function that executes the callback.
    // This correctly simulates the behavior of better-sqlite3 and ensures
    // that any error thrown inside the transaction callback is caught
    // by the `try...catch` block in the action being tested.
    transaction: jest.fn((cb) => () => cb()),
    prepare: jest.fn(),
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
    // Clear all mocks before each test to ensure tests are isolated
    jest.clearAllMocks();
  });

  describe('createUserInDb', () => {
    it('should create a new user successfully', async () => {
      const mockRun = jest.fn();
      const mockStatement = { run: mockRun };
      (mockedDb.prepare as jest.Mock).mockReturnValue(mockStatement);
      (mockedBcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');

      const result = await createUserInDb('new@example.com', 'New User', 'password123');

      expect(result.success).toBe(true);
      expect(mockedDb.prepare).toHaveBeenCalledWith('INSERT INTO users (id, email, name, password, cash) VALUES (?, ?, ?, ?, ?)');
      expect(mockedBcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockRun).toHaveBeenCalledWith(expect.any(String), 'new@example.com', 'New User', 'hashedpassword', 100000);
    });

    it('should fail if the user already exists', async () => {
      const mockError = { code: 'SQLITE_CONSTRAINT_UNIQUE' };
      const mockRun = jest.fn().mockImplementation(() => { throw mockError; });
      const mockStatement = { run: mockRun };
      (mockedDb.prepare as jest.Mock).mockReturnValue(mockStatement);
      (mockedBcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');

      const result = await createUserInDb('exists@example.com', 'Existing User', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('User with this email already exists.');
    });
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

    const setupDbMocks = (mocks: { [query: string]: { run?: jest.Mock; get?: jest.Mock; all?: jest.Mock } }) => {
      (mockedDb.prepare as jest.Mock).mockImplementation((query: string) => {
        for (const key in mocks) {
          if (query.startsWith(key)) {
            return mocks[key];
          }
        }
        return { run: jest.fn(), get: jest.fn(), all: jest.fn() };
      });
    };
    
    it('should successfully buy a stock for the first time', async () => {
        const mockRun = jest.fn();
        setupDbMocks({
            'SELECT cash FROM users': { get: jest.fn().mockReturnValue({ cash: 20000 }) },
            'SELECT id, quantity, avg_cost FROM portfolio': { get: jest.fn().mockReturnValue(undefined) },
            'INSERT INTO portfolio': { run: mockRun },
            'UPDATE users SET cash': { run: mockRun },
            'INSERT INTO transactions': { run: mockRun },
            'SELECT ticker, quantity, avg_cost as avgCost FROM portfolio': { all: jest.fn().mockReturnValue([]) },
            'INSERT INTO portfolio_history': { run: mockRun },
        });
        (mockedGetQuote as jest.Mock).mockResolvedValue({ c: price });

        const result = await buyStockAction(userId, ticker, quantity, price);

        expect(result.success).toBe(true);
        expect(mockedDb.transaction).toHaveBeenCalledTimes(1);
        expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
    });

    it('should successfully buy more of an existing stock', async () => {
        const existingItem = { id: 1, quantity: 5, avg_cost: 140 };
        const newQuantity = existingItem.quantity + quantity;
        const newAvgCost = ((existingItem.avg_cost * existingItem.quantity) + (price * quantity)) / newQuantity;
        const mockRun = jest.fn();

        setupDbMocks({
            'SELECT cash FROM users': { get: jest.fn().mockReturnValue({ cash: 20000 }) },
            'SELECT id, quantity, avg_cost FROM portfolio': { get: jest.fn().mockReturnValue(existingItem) },
            'UPDATE portfolio SET quantity': { run: mockRun },
            'UPDATE users SET cash': { run: mockRun },
            'INSERT INTO transactions': { run: mockRun },
            'SELECT ticker, quantity, avg_cost as avgCost FROM portfolio': { all: jest.fn().mockReturnValue([]) },
            'INSERT INTO portfolio_history': { run: mockRun },
        });

        (mockedGetQuote as jest.Mock).mockResolvedValue({ c: price });
        
        const result = await buyStockAction(userId, ticker, quantity, price);

        expect(result.success).toBe(true);
        expect(mockRun).toHaveBeenCalledWith(newQuantity, newAvgCost, existingItem.id);
    });

    it('should fail to buy stock with insufficient funds', async () => {
       setupDbMocks({
           'SELECT cash FROM users': { get: jest.fn().mockReturnValue({ cash: 100 }) }
       });

      const result = await buyStockAction(userId, ticker, quantity, price);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not enough cash.');
      expect(mockedDb.prepare).not.toHaveBeenCalledWith(expect.stringMatching(/^INSERT/));
      expect(mockedDb.prepare).not.toHaveBeenCalledWith(expect.stringMatching(/^UPDATE/));
    });
  });

  describe('sellStockAction', () => {
    const userId = 'user-1';
    const ticker = 'AAPL';
    const quantity = 5;
    const price = 160;

    const setupDbMocks = (mocks: { [query: string]: { run?: jest.Mock; get?: jest.Mock; all?: jest.Mock } }) => {
        (mockedDb.prepare as jest.Mock).mockImplementation((query: string) => {
            for (const key in mocks) {
                if (query.startsWith(key)) {
                    return mocks[key];
                }
            }
            return { run: jest.fn(), get: jest.fn(), all: jest.fn() };
        });
    };

    it('should successfully sell some shares of a stock', async () => {
        const existingItem = { id: 1, quantity: 10 };
        const mockRun = jest.fn();
        setupDbMocks({
            'SELECT id, quantity FROM portfolio': { get: jest.fn().mockReturnValue(existingItem) },
            'UPDATE portfolio SET quantity': { run: mockRun },
            'UPDATE users SET cash': { run: mockRun },
            'INSERT INTO transactions': { run: mockRun },
            'SELECT ticker, quantity, avg_cost as avgCost FROM portfolio': { all: jest.fn().mockReturnValue([]) },
            'SELECT cash FROM users': { get: jest.fn().mockReturnValue({ cash: 10000 }) },
            'INSERT INTO portfolio_history': { run: mockRun },
        });
        (mockedGetQuote as jest.Mock).mockResolvedValue({ c: 160 });

        const result = await sellStockAction(userId, ticker, quantity, price);

        expect(result.success).toBe(true);
        expect(mockRun).toHaveBeenCalledWith(existingItem.quantity - quantity, existingItem.id);
        expect(revalidatePath).toHaveBeenCalledWith('/transactions');
    });
    
    it('should successfully sell all shares of a stock', async () => {
        const existingItem = { id: 1, quantity: 5 };
        const mockRun = jest.fn();
        setupDbMocks({
            'SELECT id, quantity FROM portfolio': { get: jest.fn().mockReturnValue(existingItem) },
            'DELETE FROM portfolio': { run: mockRun },
            'UPDATE users SET cash': { run: mockRun },
            'INSERT INTO transactions': { run: mockRun },
            'SELECT ticker, quantity, avg_cost as avgCost FROM portfolio': { all: jest.fn().mockReturnValue([]) },
            'SELECT cash FROM users': { get: jest.fn().mockReturnValue({ cash: 10000 }) },
            'INSERT INTO portfolio_history': { run: mockRun },
        });
        (mockedGetQuote as jest.Mock).mockResolvedValue({ c: 160 });

        const result = await sellStockAction(userId, ticker, 5, price);

        expect(result.success).toBe(true);
        expect(mockRun).toHaveBeenCalledWith(existingItem.id);
    });

    it('should fail if trying to sell more shares than owned', async () => {
        const existingItem = { id: 1, quantity: 4 };
        setupDbMocks({
            'SELECT id, quantity FROM portfolio': { get: jest.fn().mockReturnValue(existingItem) },
        });

        const result = await sellStockAction(userId, ticker, quantity, price);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Not enough shares to sell.');
    });

     it('should fail if stock is not in portfolio', async () => {
        setupDbMocks({
            'SELECT id, quantity FROM portfolio': { get: jest.fn().mockReturnValue(undefined) },
        });

        const result = await sellStockAction(userId, ticker, quantity, price);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Not enough shares to sell.');
     });
  });

  describe('toggleWatchlistAction', () => {
    const userId = 'user-1';
    const ticker = 'MSFT';

    it('should add a stock to the watchlist if not present', async () => {
      const mockRun = jest.fn();
      const mockStatement = { run: mockRun };
      (mockedDb.prepare as jest.Mock).mockReturnValue(mockStatement);

      const result = await toggleWatchlistAction(userId, ticker, false);

      expect(result.success).toBe(true);
      expect(mockedDb.prepare).toHaveBeenCalledWith('INSERT INTO watchlist (user_id, ticker) VALUES (?, ?)');
      expect(mockRun).toHaveBeenCalledWith(userId, ticker);
      expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
    });

    it('should remove a stock from the watchlist if present', async () => {
      const mockRun = jest.fn();
      const mockStatement = { run: mockRun };
      (mockedDb.prepare as jest.Mock).mockReturnValue(mockStatement);

      const result = await toggleWatchlistAction(userId, ticker, true);

      expect(result.success).toBe(true);
      expect(mockedDb.prepare).toHaveBeenCalledWith('DELETE FROM watchlist WHERE user_id = ? AND ticker = ?');
      expect(mockRun).toHaveBeenCalledWith(userId, ticker);
      expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
    });
  });
});
