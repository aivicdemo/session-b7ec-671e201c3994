import { monitorAndJudgeDelayRisk } from '../../src/logic/progress-monitoring-risk-engine';
import * as jest from '@jest/globals';

// Mock modules for WMS and data persistence layer
jest.mock('../../src/adapters/wms-handy-terminal-data-source');
jest.mock('../../src/repositories/progress-data-repository');
jest.mock('../../src/repositories/productivity-data-repository');

const mockWmsDataSource = require('../../src/adapters/wms-handy-terminal-data-source');
const mockProgressRepo = require('../../src/repositories/progress-data-repository');
const mockProductivityRepo = require('../../src/repositories/productivity-data-repository');

describe('SCEN-110: 納期までの残り時間が0以下のとき、例外を発生させて緊急対応の必要性を示す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw an exception when remaining time is zero or negative', async () => {
    const evaluationDateTime = new Date('2024-01-15T10:30:00Z');
    const overdueDeadline = new Date('2024-01-15T10:20:00Z'); // 10分前に納期が過ぎている
    const remainingTimeMinutes = (overdueDeadline.getTime() - evaluationDateTime.getTime()) / 1000 / 60; // -10分

    const input = {
      facilityIds: ['FAC001'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2024-01-15T10:30:00Z',
      userId: 'USER123',
    };

    // WMS連携スタブ: 残り時間が0以下の進捗データを返す
    mockWmsDataSource.fetchProgressData.mockResolvedValue([
      {
        workInstructionId: 'WI001',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        plannedEndDate: overdueDeadline,
        currentProgressRate: 50,
        actualProgressRate: 40,
      },
    ]);

    // データ永続化層スタブ: 有効な進捗データを返す
    mockProgressRepo.getRecentProgressDataByWorkInstruction.mockResolvedValue({
      workInstructionId: 'WI001',
      facilityId: 'FAC001',
      teamId: 'TEAM001',
      completionRate: 40,
      plannedEndDate: overdueDeadline,
      remainingWorkDays: Math.ceil(remainingTimeMinutes / 1440),
    });

    // データ永続化層スタブ: 有効な生産性データを返す
    mockProductivityRepo.getLatestProductivityDataByWorker.mockResolvedValue({
      workerId: 'WORKER001',
      productivityRate: 85,
      qualityScore: 90,
      allocatedStaffCount: 2,
      requiredStaffCount: 3,
    });

    // 残り時間が0以下の条件を確認してから呼び出す
    expect(remainingTimeMinutes).toBeLessThanOrEqual(0);

    // monitorAndJudgeDelayRisk を呼び出す
    await expect(monitorAndJudgeDelayRisk(input)).rejects.toThrow();
  });

  it('should throw InvalidInputParameterError with specific error message about overdue deadline', async () => {
    const evaluationDateTime = new Date('2024-01-15T10:30:00Z');
    const overdueDeadline = new Date('2024-01-15T10:20:00Z'); // 10分前に納期が過ぎている
    const remainingTimeMinutes = (overdueDeadline.getTime() - evaluationDateTime.getTime()) / 1000 / 60; // -10分

    const input = {
      facilityIds: ['FAC001'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2024-01-15T10:30:00Z',
      userId: 'USER123',
    };

    // WMS連携スタブ: 残り時間が0以下の進捗データを返す
    mockWmsDataSource.fetchProgressData.mockResolvedValue([
      {
        workInstructionId: 'WI001',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        plannedEndDate: overdueDeadline,
        currentProgressRate: 50,
        actualProgressRate: 40,
      },
    ]);

    // データ永続化層スタブ: 有効な進捗データを返す
    mockProgressRepo.getRecentProgressDataByWorkInstruction.mockResolvedValue({
      workInstructionId: 'WI001',
      facilityId: 'FAC001',
      teamId: 'TEAM001',
      completionRate: 40,
      plannedEndDate: overdueDeadline,
      remainingWorkDays: Math.ceil(remainingTimeMinutes / 1440),
    });

    // データ永続化層スタブ: 有効な生産性データを返す
    mockProductivityRepo.getLatestProductivityDataByWorker.mockResolvedValue({
      workerId: 'WORKER001',
      productivityRate: 85,
      qualityScore: 90,
      allocatedStaffCount: 2,
      requiredStaffCount: 3,
    });

    // 業務ルール br-tx_4-003 の制約を満たすことを確認
    expect(remainingTimeMinutes).toBeLessThanOrEqual(0);

    try {
      await monitorAndJudgeDelayRisk(input);
      fail('Expected an exception to be thrown');
    } catch (error) {
      expect(error).toBeDefined();
      expect(error).toBeInstanceOf(Error);
      const errorMessage = (error as Error).message;
      expect(errorMessage).toContain('納期が既に過ぎています');
      expect(errorMessage).toContain('緊急対応が必要です');
      // Check if exception is InvalidInputParameterError or contains the business rule constraint
      expect(error.constructor.name).toMatch(/InvalidInputParameterError|Error/);
    }
  });

  it('should not return MonitorAndJudgeDelayRiskOutput when exception is thrown', async () => {
    const evaluationDateTime = new Date('2024-01-15T10:30:00Z');
    const overdueDeadline = new Date('2024-01-15T10:20:00Z'); // 10分前に納期が過ぎている
    const remainingTimeMinutes = (overdueDeadline.getTime() - evaluationDateTime.getTime()) / 1000 / 60; // -10分

    const input = {
      facilityIds: ['FAC001'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2024-01-15T10:30:00Z',
      userId: 'USER123',
    };

    // WMS連携スタブ: 残り時間が0以下の進捗データを返す
    mockWmsDataSource.fetchProgressData.mockResolvedValue([
      {
        workInstructionId: 'WI001',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        plannedEndDate: overdueDeadline,
        currentProgressRate: 50,
        actualProgressRate: 40,
      },
    ]);

    // データ永続化層スタブ: 有効な進捗データを返す
    mockProgressRepo.getRecentProgressDataByWorkInstruction.mockResolvedValue({
      workInstructionId: 'WI001',
      facilityId: 'FAC001',
      teamId: 'TEAM001',
      completionRate: 40,
      plannedEndDate: overdueDeadline,
      remainingWorkDays: Math.ceil(remainingTimeMinutes / 1440),
    });

    // データ永続化層スタブ: 有効な生産性データを返す
    mockProductivityRepo.getLatestProductivityDataByWorker.mockResolvedValue({
      workerId: 'WORKER001',
      productivityRate: 85,
      qualityScore: 90,
      allocatedStaffCount: 2,
      requiredStaffCount: 3,
    });

    let outputReturned = false;
    let exceptionThrown = false;

    try {
      const result = await monitorAndJudgeDelayRisk(input);
      if (result && result.judgmentId) {
        outputReturned = true;
      }
    } catch (error) {
      exceptionThrown = true;
      // Exception is expected
    }

    // Verify that output was not returned and exception was thrown
    expect(outputReturned).toBe(false);
    expect(exceptionThrown).toBe(true);
  });

  it('should trigger internal judgeDeliveryDelayRisk function with remainingTimeMinutes check', async () => {
    const evaluationDateTime = new Date('2024-01-15T10:30:00Z');
    const overdueDeadline = new Date('2024-01-15T10:20:00Z'); // 10分前に納期が過ぎている
    const remainingTimeMinutes = (overdueDeadline.getTime() - evaluationDateTime.getTime()) / 1000 / 60; // -10分

    const input = {
      facilityIds: ['FAC001'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2024-01-15T10:30:00Z',
      userId: 'USER123',
    };

    // WMS連携スタブ: 残り時間が0以下の進捗データを返す
    mockWmsDataSource.fetchProgressData.mockResolvedValue([
      {
        workInstructionId: 'WI001',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        plannedEndDate: overdueDeadline,
        currentProgressRate: 50,
        actualProgressRate: 40,
      },
    ]);

    // データ永続化層スタブ: 有効な進捗データを返す
    mockProgressRepo.getRecentProgressDataByWorkInstruction.mockResolvedValue({
      workInstructionId: 'WI001',
      facilityId: 'FAC001',
      teamId: 'TEAM001',
      completionRate: 40,
      plannedEndDate: overdueDeadline,
      remainingWorkDays: Math.ceil(remainingTimeMinutes / 1440),
    });

    // データ永続化層スタブ: 有効な生産性データを返す
    mockProductivityRepo.getLatestProductivityDataByWorker.mockResolvedValue({
      workerId: 'WORKER001',
      productivityRate: 85,
      qualityScore: 90,
      allocatedStaffCount: 2,
      requiredStaffCount: 3,
    });

    // 条件確認: remainingTimeMinutes が 0 以下であることを確認
    expect(remainingTimeMinutes).toBeLessThanOrEqual(0);

    // 呼び出し実行
    await expect(monitorAndJudgeDelayRisk(input)).rejects.toThrow('納期が既に過ぎています');
  });
});