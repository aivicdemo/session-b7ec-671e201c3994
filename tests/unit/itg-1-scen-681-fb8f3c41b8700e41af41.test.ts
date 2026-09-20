import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { saveWorkInstruction } from '../../src/logic/data-persistence';
import type { SaveWorkInstructionInput } from '../../src/logic/data-persistence';

describe('SCEN-681: saveWorkInstruction - Invalid Priority Error', () => {
  const VALID_PRIORITY_VALUES = ['高', '中', '低'];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidPriority error when priority is "緊急" (invalid value)', async () => {
    const input: SaveWorkInstructionInput = {
      workInstructionId: null,
      facilityId: 'fac001',
      teamId: 'team001',
      workInstructionNumber: 'WI-001',
      workName: 'テスト作業',
      workDescription: null,
      plannedStartDateTime: '2025-01-15T09:00:00',
      plannedEndDateTime: '2025-01-15T17:00:00',
      progressStatus: '未開始',
      progressRate: null,
      requiredWorkerCount: 5,
      priority: '緊急',
      createdBy: 'user001',
      updatedBy: null,
    };

    await expect(saveWorkInstruction(input)).rejects.toThrow(expect.objectContaining({
      name: 'InvalidPriority',
      message: expect.stringContaining('優先度は定義済みの値である必要があります。'),
    }));
  });

  it('should throw InvalidPriority error when priority is "最高" (invalid value)', async () => {
    const input: SaveWorkInstructionInput = {
      workInstructionId: null,
      facilityId: 'fac001',
      teamId: 'team001',
      workInstructionNumber: 'WI-001',
      workName: 'テスト作業',
      workDescription: null,
      plannedStartDateTime: '2025-01-15T09:00:00',
      plannedEndDateTime: '2025-01-15T17:00:00',
      progressStatus: '未開始',
      progressRate: null,
      requiredWorkerCount: 5,
      priority: '最高',
      createdBy: 'user001',
      updatedBy: null,
    };

    await expect(saveWorkInstruction(input)).rejects.toThrow(expect.objectContaining({
      name: 'InvalidPriority',
      message: expect.stringContaining('優先度は定義済みの値である必要があります。'),
    }));
  });

  it('should throw InvalidPriority error when priority is empty string', async () => {
    const input: SaveWorkInstructionInput = {
      workInstructionId: null,
      facilityId: 'fac001',
      teamId: 'team001',
      workInstructionNumber: 'WI-001',
      workName: 'テスト作業',
      workDescription: null,
      plannedStartDateTime: '2025-01-15T09:00:00',
      plannedEndDateTime: '2025-01-15T17:00:00',
      progressStatus: '未開始',
      progressRate: null,
      requiredWorkerCount: 5,
      priority: '',
      createdBy: 'user001',
      updatedBy: null,
    };

    await expect(saveWorkInstruction(input)).rejects.toThrow(expect.objectContaining({
      name: 'InvalidPriority',
      message: expect.stringContaining('優先度は定義済みの値である必要があります。'),
    }));
  });

  it('should throw InvalidPriority error when priority is numeric "1"', async () => {
    const input = {
      workInstructionId: null,
      facilityId: 'fac001',
      teamId: 'team001',
      workInstructionNumber: 'WI-001',
      workName: 'テスト作業',
      workDescription: null,
      plannedStartDateTime: '2025-01-15T09:00:00',
      plannedEndDateTime: '2025-01-15T17:00:00',
      progressStatus: '未開始',
      progressRate: null,
      requiredWorkerCount: 5,
      priority: 1 as unknown as string,
      createdBy: 'user001',
      updatedBy: null,
    } as SaveWorkInstructionInput;

    await expect(saveWorkInstruction(input)).rejects.toThrow(expect.objectContaining({
      name: 'InvalidPriority',
      message: expect.stringContaining('優先度は定義済みの値である必要があります。'),
    }));
  });

  it('should throw InvalidPriority error and not persist data when priority is invalid', async () => {
    const input: SaveWorkInstructionInput = {
      workInstructionId: null,
      facilityId: 'fac001',
      teamId: 'team001',
      workInstructionNumber: 'WI-001',
      workName: 'テスト作業',
      workDescription: null,
      plannedStartDateTime: '2025-01-15T09:00:00',
      plannedEndDateTime: '2025-01-15T17:00:00',
      progressStatus: '未開始',
      progressRate: null,
      requiredWorkerCount: 5,
      priority: '無効な優先度',
      createdBy: 'user001',
      updatedBy: null,
    };

    const savePromise = saveWorkInstruction(input);

    await expect(savePromise).rejects.toThrow(expect.objectContaining({
      name: 'InvalidPriority',
      message: expect.stringContaining('優先度は定義済みの値である必要があります。'),
    }));
  });

  it('should throw InvalidPriority error when priority is null', async () => {
    const input = {
      workInstructionId: null,
      facilityId: 'fac001',
      teamId: 'team001',
      workInstructionNumber: 'WI-001',
      workName: 'テスト作業',
      workDescription: null,
      plannedStartDateTime: '2025-01-15T09:00:00',
      plannedEndDateTime: '2025-01-15T17:00:00',
      progressStatus: '未開始',
      progressRate: null,
      requiredWorkerCount: 5,
      priority: null as unknown as string,
      createdBy: 'user001',
      updatedBy: null,
    } as SaveWorkInstructionInput;

    await expect(saveWorkInstruction(input)).rejects.toThrow(expect.objectContaining({
      name: 'InvalidPriority',
      message: expect.stringContaining('優先度は定義済みの値である必要があります。'),
    }));
  });

  it('should throw InvalidPriority error when priority is undefined', async () => {
    const input = {
      workInstructionId: null,
      facilityId: 'fac001',
      teamId: 'team001',
      workInstructionNumber: 'WI-001',
      workName: 'テスト作業',
      workDescription: null,
      plannedStartDateTime: '2025-01-15T09:00:00',
      plannedEndDateTime: '2025-01-15T17:00:00',
      progressStatus: '未開始',
      progressRate: null,
      requiredWorkerCount: 5,
      priority: undefined as unknown as string,
      createdBy: 'user001',
      updatedBy: null,
    } as SaveWorkInstructionInput;

    await expect(saveWorkInstruction(input)).rejects.toThrow(expect.objectContaining({
      name: 'InvalidPriority',
      message: expect.stringContaining('優先度は定義済みの値である必要があります。'),
    }));
  });
});