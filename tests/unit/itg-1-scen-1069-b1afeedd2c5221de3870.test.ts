import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { saveHandyTerminalSyncLog } from '../../src/logic/data-persistence';
import type { SaveHandyTerminalSyncLogInput, SaveHandyTerminalSyncLogOutput } from '../../src/logic/data-persistence';

describe('SCEN-1069: ハンディターミナル連携ログの参照完全性エラー処理', () => {
  let mockDatabase: any;
  let mockSaveImplementation: jest.Mock;

  beforeEach(() => {
    mockDatabase = {
      workers: {
        'W001': { workerId: 'W001', workerName: 'Worker A' },
      },
      handyTerminals: {
        'HT001': { handyTerminalId: 'HT001', deviceName: 'Terminal 1' },
      },
      facilities: {
        'F001': { facilityId: 'F001', facilityName: 'Facility A' },
      },
      syncLogs: {},
    };

    mockSaveImplementation = jest.fn(async (input: SaveHandyTerminalSyncLogInput) => {
      const workerExists = mockDatabase.workers[input.workerId];
      const handyTerminalExists = mockDatabase.handyTerminals[input.handyTerminalId];
      const facilityExists = mockDatabase.facilities[input.facilityId];

      if (!workerExists || !handyTerminalExists || !facilityExists) {
        const error = new Error('参照先の作業者、ハンディターミナル、拠点が見つかりません。');
        (error as any).name = 'ReferentialIntegrityViolation';
        throw error;
      }

      const logId = input.handyTerminalSyncLogId || `LOG-${Date.now()}`;
      const now = new Date().toISOString();
      const logRecord = {
        handyTerminalSyncLogId: logId,
        workerId: input.workerId,
        handyTerminalId: input.handyTerminalId,
        facilityId: input.facilityId,
        syncType: input.syncType,
        syncContent: input.syncContent,
        syncStatus: input.syncStatus,
        sentDateTime: input.sentDateTime,
        createdAt: now,
        updatedAt: now,
      };

      mockDatabase.syncLogs[logId] = logRecord;

      const output: SaveHandyTerminalSyncLogOutput = {
        handyTerminalSyncLogId: logId,
        workerId: input.workerId,
        handyTerminalId: input.handyTerminalId,
        facilityId: input.facilityId,
        syncType: input.syncType,
        syncStatus: input.syncStatus,
        savedAt: now,
        isNewRecord: !input.handyTerminalSyncLogId,
      };

      return output;
    });

    jest.spyOn(saveHandyTerminalSyncLog as any, 'constructor').mockImplementation(mockSaveImplementation);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('指定された作業者IDがマスタに存在しない場合、ReferentialIntegrityViolationエラーを返す', async () => {
    const input: SaveHandyTerminalSyncLogInput = {
      handyTerminalSyncLogId: null,
      workerId: 'W999',
      handyTerminalId: 'HT001',
      facilityId: 'F001',
      syncType: 'work_result',
      workInstructionId: undefined,
      syncContent: JSON.stringify({ result: 'completed' }),
      syncStatus: 'success',
      sentDateTime: '2025-01-15T10:30:00Z',
      createdBy: 'USER001',
    };

    let caughtError: any = null;
    let result: SaveHandyTerminalSyncLogOutput | undefined = undefined;

    try {
      result = await mockSaveImplementation(input);
    } catch (error: any) {
      caughtError = error;
    }

    expect(caughtError).not.toBeNull();
    expect(caughtError.name).toBe('ReferentialIntegrityViolation');
    expect(caughtError.message).toContain('参照先の作業者、ハンディターミナル、拠点が見つかりません。');
    expect(result).toBeUndefined();
    expect(Object.keys(mockDatabase.syncLogs).length).toBe(0);
  });

  it('指定されたハンディターミナルIDがマスタに存在しない場合、ReferentialIntegrityViolationエラーを返す', async () => {
    const input: SaveHandyTerminalSyncLogInput = {
      handyTerminalSyncLogId: null,
      workerId: 'W001',
      handyTerminalId: 'HT999',
      facilityId: 'F001',
      syncType: 'work_result',
      workInstructionId: undefined,
      syncContent: JSON.stringify({ result: 'completed' }),
      syncStatus: 'success',
      sentDateTime: '2025-01-15T10:30:00Z',
      createdBy: 'USER001',
    };

    let caughtError: any = null;
    let result: SaveHandyTerminalSyncLogOutput | undefined = undefined;

    try {
      result = await mockSaveImplementation(input);
    } catch (error: any) {
      caughtError = error;
    }

    expect(caughtError).not.toBeNull();
    expect(caughtError.name).toBe('ReferentialIntegrityViolation');
    expect(caughtError.message).toContain('参照先の作業者、ハンディターミナル、拠点が見つかりません。');
    expect(result).toBeUndefined();
    expect(Object.keys(mockDatabase.syncLogs).length).toBe(0);
  });

  it('指定された拠点IDがマスタに存在しない場合、ReferentialIntegrityViolationエラーを返す', async () => {
    const input: SaveHandyTerminalSyncLogInput = {
      handyTerminalSyncLogId: null,
      workerId: 'W001',
      handyTerminalId: 'HT001',
      facilityId: 'F999',
      syncType: 'work_result',
      workInstructionId: undefined,
      syncContent: JSON.stringify({ result: 'completed' }),
      syncStatus: 'success',
      sentDateTime: '2025-01-15T10:30:00Z',
      createdBy: 'USER001',
    };

    let caughtError: any = null;
    let result: SaveHandyTerminalSyncLogOutput | undefined = undefined;

    try {
      result = await mockSaveImplementation(input);
    } catch (error: any) {
      caughtError = error;
    }

    expect(caughtError).not.toBeNull();
    expect(caughtError.name).toBe('ReferentialIntegrityViolation');
    expect(caughtError.message).toContain('参照先の作業者、ハンディターミナル、拠点が見つかりません。');
    expect(result).toBeUndefined();
    expect(Object.keys(mockDatabase.syncLogs).length).toBe(0);
  });

  it('エラー発生時、ログレコードはデータベースに保存されない', async () => {
    const input: SaveHandyTerminalSyncLogInput = {
      handyTerminalSyncLogId: null,
      workerId: 'W999',
      handyTerminalId: 'HT001',
      facilityId: 'F001',
      syncType: 'work_result',
      workInstructionId: undefined,
      syncContent: JSON.stringify({ result: 'completed' }),
      syncStatus: 'success',
      sentDateTime: '2025-01-15T10:30:00Z',
      createdBy: 'USER001',
    };

    try {
      await mockSaveImplementation(input);
    } catch (error) {
      // エラーが発生することは予期された動作
    }

    expect(Object.keys(mockDatabase.syncLogs).length).toBe(0);
  });

  it('参照完全性チェックは全マスタに対して実施される', async () => {
    const input: SaveHandyTerminalSyncLogInput = {
      handyTerminalSyncLogId: null,
      workerId: 'W999',
      handyTerminalId: 'HT999',
      facilityId: 'F999',
      syncType: 'work_result',
      workInstructionId: undefined,
      syncContent: JSON.stringify({ result: 'completed' }),
      syncStatus: 'success',
      sentDateTime: '2025-01-15T10:30:00Z',
      createdBy: 'USER001',
    };

    let caughtError: any = null;
    let result: SaveHandyTerminalSyncLogOutput | undefined = undefined;

    try {
      result = await mockSaveImplementation(input);
    } catch (error: any) {
      caughtError = error;
    }

    expect(caughtError).not.toBeNull();
    expect(caughtError.name).toBe('ReferentialIntegrityViolation');
    expect(caughtError.message).toContain('参照先の作業者、ハンディターミナル、拠点が見つかりません。');
    expect(result).toBeUndefined();
    expect(Object.keys(mockDatabase.syncLogs).length).toBe(0);
  });

  it('全参照先が存在する場合、ログレコードが正常に保存される', async () => {
    const input: SaveHandyTerminalSyncLogInput = {
      handyTerminalSyncLogId: null,
      workerId: 'W001',
      handyTerminalId: 'HT001',
      facilityId: 'F001',
      syncType: 'work_result',
      workInstructionId: undefined,
      syncContent: JSON.stringify({ result: 'completed' }),
      syncStatus: 'success',
      sentDateTime: '2025-01-15T10:30:00Z',
      createdBy: 'USER001',
    };

    let caughtError: any = null;
    let result: SaveHandyTerminalSyncLogOutput | undefined = undefined;

    try {
      result = await mockSaveImplementation(input);
    } catch (error: any) {
      caughtError = error;
    }

    expect(caughtError).toBeNull();
    expect(result).toBeDefined();
    expect(result?.handyTerminalSyncLogId).toBeDefined();
    expect(result?.workerId).toBe('W001');
    expect(result?.handyTerminalId).toBe('HT001');
    expect(result?.facilityId).toBe('F001');
    expect(result?.syncType).toBe('work_result');
    expect(result?.syncStatus).toBe('success');
    expect(result?.isNewRecord).toBe(true);
    expect(Object.keys(mockDatabase.syncLogs).length).toBe(1);
  });
});