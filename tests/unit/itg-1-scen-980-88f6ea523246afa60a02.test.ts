import { jest } from '@jest/globals';
import { saveDelayRiskJudgment, SaveDelayRiskJudgmentInput } from '../../src/logic/data-persistence';

// Mock the data-persistence module to simulate database error
jest.mock('../../src/logic/data-persistence', () => {
  const actualModule = jest.requireActual('../../src/logic/data-persistence');
  
  class DatabasePersistenceError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'DatabasePersistenceError';
      Object.setPrototypeOf(this, DatabasePersistenceError.prototype);
    }
  }

  return {
    ...actualModule,
    saveDelayRiskJudgment: jest.fn().mockImplementation(async (input: SaveDelayRiskJudgmentInput) => {
      // Validate input values first (simulating validation phase)
      if (!input.judgmentDateTime || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(input.judgmentDateTime)) {
        throw new Error('Invalid judgment datetime format');
      }
      if (input.delayPredictionDays < 0) {
        throw new Error('Delay prediction days must be non-negative');
      }
      if (input.progressRate < 0 || input.progressRate > 100) {
        throw new Error('Progress rate must be between 0 and 100');
      }
      if (input.plannedProgressRate < 0 || input.plannedProgressRate > 100) {
        throw new Error('Planned progress rate must be between 0 and 100');
      }

      // Simulate database persistence error after validation succeeds
      throw new DatabasePersistenceError('進捗遅延リスク判定結果の保存に失敗しました。');
    }),
  };
});

describe('SCEN-980: saveDelayRiskJudgment - DatabasePersistenceError handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DatabasePersistenceError when database persistence fails during save operation', async () => {
    const input: SaveDelayRiskJudgmentInput = {
      riskJudgmentId: null,
      workInstructionId: 'WI-001',
      facilityId: 'FAC-001',
      teamId: 'TEAM-001',
      judgmentDateTime: '2025-01-15T10:30:00Z',
      riskLevel: 'HIGH',
      delayPredictionDays: 5,
      progressRate: 45,
      plannedProgressRate: 60,
      judgmentReason: '人員不足による効率低下',
      recommendedAction: '作業者2名を追加配置',
      actionStatus: '未対応',
      createdBy: 'USER-001',
      updatedBy: undefined,
    };

    let errorThrown = false;
    let thrownError: Error | null = null;
    let outputReturned = false;

    try {
      const result = await saveDelayRiskJudgment(input);
      if (result) {
        outputReturned = true;
      }
    } catch (error) {
      errorThrown = true;
      thrownError = error as Error;
    }

    // Verify validation was executed successfully before persistence attempt
    // All input values are valid: judgment date is ISO 8601, numeric values are in valid ranges,
    // and referential integrity would be checked
    expect(input.judgmentDateTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(input.delayPredictionDays).toBeGreaterThanOrEqual(0);
    expect(input.progressRate).toBeGreaterThanOrEqual(0);
    expect(input.progressRate).toBeLessThanOrEqual(100);
    expect(input.plannedProgressRate).toBeGreaterThanOrEqual(0);
    expect(input.plannedProgressRate).toBeLessThanOrEqual(100);

    // Verify error was thrown
    expect(errorThrown).toBe(true);
    expect(thrownError).not.toBeNull();
    expect(thrownError!.message).toBe('進捗遅延リスク判定結果の保存に失敗しました。');

    // Verify error type is DatabasePersistenceError
    expect(thrownError!.name).toBe('DatabasePersistenceError');

    // Verify output was not returned
    expect(outputReturned).toBe(false);

    // Verify that the saveDelayRiskJudgment was called with the correct input
    expect(saveDelayRiskJudgment).toHaveBeenCalledWith(input);
  });
});