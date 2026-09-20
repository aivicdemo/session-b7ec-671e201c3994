import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// モック設定はファイルトップレベルで実行
jest.mock('../../src/logic/validation', () => ({
  validateNumericQuantity: jest.fn().mockReturnValue(true),
  validateDateTimeRange: jest.fn().mockReturnValue(true),
  validateReferentialIntegrity: jest.fn().mockReturnValue(true),
}));

jest.mock('../../src/logic/database', () => ({
  persist: jest.fn(),
}));

import { saveProgressData } from '../../src/logic/data-persistence';
import * as database from '../../src/logic/database';

describe('SCEN-894: saveProgressData - Database persistence failure', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should throw PersistenceError when database save fails with connection error', async () => {
    const input = {
      progressDataId: null,
      workInstructionId: 'WI-001',
      facilityId: 'FAC-001',
      teamId: 'TEAM-001',
      progressDate: '2024-01-15',
      plannedQuantity: 100,
      actualQuantity: 80,
      completionRate: 80,
      delayFlag: false,
      delayDays: null,
      remarks: null,
      createdBy: 'USER-001',
      updatedBy: null,
    };

    (database.persist as jest.Mock).mockRejectedValue(
      new Error('Connection timeout')
    );

    try {
      await saveProgressData(input);
      expect.fail('Expected PersistenceError to be thrown');
    } catch (error: any) {
      expect(error.name).toBe('PersistenceError');
      expect(error.message).toBe(
        '進捗データの保存に失敗しました。システム管理者に連絡してください。'
      );
    }
  });

  it('should throw PersistenceError when database save fails with transaction error', async () => {
    const input = {
      progressDataId: null,
      workInstructionId: 'WI-001',
      facilityId: 'FAC-001',
      teamId: 'TEAM-001',
      progressDate: '2024-01-15',
      plannedQuantity: 100,
      actualQuantity: 80,
      completionRate: 80,
      delayFlag: false,
      delayDays: null,
      remarks: null,
      createdBy: 'USER-001',
      updatedBy: null,
    };

    (database.persist as jest.Mock).mockRejectedValue(
      new Error('Transaction failed')
    );

    try {
      await saveProgressData(input);
      expect.fail('Expected PersistenceError to be thrown');
    } catch (error: any) {
      expect(error.name).toBe('PersistenceError');
      expect(error.message).toBe(
        '進捗データの保存に失敗しました。システム管理者に連絡してください。'
      );
    }
  });
});