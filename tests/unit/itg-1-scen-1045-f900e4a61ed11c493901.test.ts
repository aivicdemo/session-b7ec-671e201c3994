import { getWorkInstructionReceptionHistoryById, DatabaseAccessError } from '../../src/logic/data-persistence';
import { GetWorkInstructionReceptionHistoryByIdInput, GetWorkInstructionReceptionHistoryByIdOutput } from '../../src/logic/data-persistence';

// Mock the database access layer
jest.mock('../../src/logic/database', () => ({
  executeQuery: jest.fn(),
}));

describe('SCEN-1045: getWorkInstructionReceptionHistoryById', () => {
  let mockExecuteQuery: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    const database = require('../../src/logic/database');
    mockExecuteQuery = database.executeQuery;
  });

  describe('Normal Operation', () => {
    it('should retrieve work instruction reception history and provide receptionDateTime, receptionStatus, and deliveryMethod', async () => {
      // Arrange
      const input: GetWorkInstructionReceptionHistoryByIdInput = {
        receptionHistoryId: 'RH-20240115-001',
      };

      const mockResult: GetWorkInstructionReceptionHistoryByIdOutput = {
        receptionHistoryId: 'RH-20240115-001',
        workInstructionId: 'WI-20240115-001',
        workerId: 'W-001',
        receptionDateTime: '2024-01-15T10:30:00Z',
        receptionStatus: 'confirmed',
        confirmationDateTime: '2024-01-15T10:31:00Z',
        deliveryMethod: 'handy_terminal',
        remarks: 'Received via handy terminal',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:31:00Z',
        createdBy: 'USER-001',
        updatedBy: 'USER-001',
      };

      mockExecuteQuery.mockResolvedValueOnce([mockResult]);

      // Act
      const result = await getWorkInstructionReceptionHistoryById(input);

      // Assert
      expect(result).toBeDefined();
      expect(result.receptionDateTime).toBe('2024-01-15T10:30:00Z');
      expect(result.receptionStatus).toBe('confirmed');
      expect(result.deliveryMethod).toBe('handy_terminal');
    });
  });

  describe('Error Handling', () => {
    it('should throw DatabaseAccessError when database connection fails', async () => {
      // Arrange
      const input: GetWorkInstructionReceptionHistoryByIdInput = {
        receptionHistoryId: 'RH-20240115-001',
      };

      // Simulate database connection error at the access layer
      mockExecuteQuery.mockRejectedValueOnce(
        new Error('Connection refused: unable to connect to database')
      );

      // Act & Assert
      try {
        await getWorkInstructionReceptionHistoryById(input);
        fail('Expected DatabaseAccessError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(DatabaseAccessError);
        expect((error as DatabaseAccessError).message).toBe('Failed to retrieve work instruction reception history from database.');
      }
    });
  });
});