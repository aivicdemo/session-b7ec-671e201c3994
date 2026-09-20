import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  deliverAllocationInstructionToFieldLeader,
  DeliverAllocationInstructionToFieldLeaderInput,
} from '../../src/logic/notification-external-integration';

// Mock the data source module
jest.mock('../../src/data/allocation-plan-data-source', () => ({
  getAllocationPlanById: jest.fn(),
}));

// Import the mocked module
import * as allocationPlanDataSource from '../../src/data/allocation-plan-data-source';

describe('SCEN-1164: 指定された人員配置案IDが存在しないとき、AllocationPlanNotFoundエラーで失敗する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('存在しないallocationPlanIdが指定された場合、AllocationPlanNotFoundエラーをスロー、またはエラー結果を返す', async () => {
    const nonExistentAllocationPlanId = 'non-existent-plan-id-12345';
    
    // Setup stub to return null for non-existent allocation plan
    (allocationPlanDataSource.getAllocationPlanById as jest.Mock).mockResolvedValue(null);

    const input: DeliverAllocationInstructionToFieldLeaderInput = {
      allocationPlanId: nonExistentAllocationPlanId,
      workInstructionId: 'work-instruction-001',
      teamId: 'team-001',
      facilityId: 'facility-001',
      allocatedWorkerIds: ['worker-001', 'worker-002'],
      deliveryChannels: ['email', 'app_notification'],
      requestedByUserId: 'admin-user-001',
      requestedAt: new Date('2024-01-15T10:00:00Z'),
    };

    try {
      const result = await deliverAllocationInstructionToFieldLeader(input);
      
      // If function returns an error result object instead of throwing
      expect(result.success).toBe(false);
      expect(result.allocationPlanId).toBe(nonExistentAllocationPlanId);
      expect(result.failureReason).toBe(`人員配置案が見つかりません。配置案ID: ${nonExistentAllocationPlanId}`);
      expect(result.deliveredChannels).toEqual([]);
      expect(result.fieldLeaderDeliveryStatus).toEqual([]);
      expect(result.workerDeliveryStatus).toEqual([]);
      expect(result.deliveryHistoryIds).toEqual([]);
    } catch (error: unknown) {
      // If function throws an exception
      expect(error).toBeDefined();
      const err = error as any;
      expect(err.name).toBe('AllocationPlanNotFound');
      expect(err.message).toBe(`人員配置案が見つかりません。配置案ID: ${nonExistentAllocationPlanId}`);
    }
  });

  it('エラーメッセージが正しい形式で生成される', async () => {
    const testAllocationPlanId = 'test-allocation-plan-uuid-99999';
    
    // Setup stub to return null for the test allocation plan
    (allocationPlanDataSource.getAllocationPlanById as jest.Mock).mockResolvedValue(null);

    const input: DeliverAllocationInstructionToFieldLeaderInput = {
      allocationPlanId: testAllocationPlanId,
      workInstructionId: 'work-instruction-002',
      teamId: 'team-002',
      facilityId: 'facility-002',
      allocatedWorkerIds: ['worker-003'],
      deliveryChannels: ['handy_terminal'],
      requestedByUserId: 'admin-user-002',
      requestedAt: new Date('2024-01-15T11:30:00Z'),
    };

    try {
      const result = await deliverAllocationInstructionToFieldLeader(input);
      
      // If function returns an error result object
      expect(result.success).toBe(false);
      expect(result.failureReason).toMatch(/人員配置案が見つかりません。配置案ID:/);
      expect(result.failureReason).toContain(testAllocationPlanId);
    } catch (error: unknown) {
      // If function throws an exception
      const err = error as any;
      expect(err.name).toBe('AllocationPlanNotFound');
      expect(err.message).toMatch(/人員配置案が見つかりません。配置案ID:/);
      expect(err.message).toContain(testAllocationPlanId);
    }
  });

  it('エラー時はデータベースへのログ記録が呼ばれない', async () => {
    const nonExistentId = 'non-existent-id';
    
    // Setup stub to return null
    (allocationPlanDataSource.getAllocationPlanById as jest.Mock).mockResolvedValue(null);

    const input: DeliverAllocationInstructionToFieldLeaderInput = {
      allocationPlanId: nonExistentId,
      workInstructionId: 'work-instruction-003',
      teamId: 'team-003',
      facilityId: 'facility-003',
      allocatedWorkerIds: ['worker-004', 'worker-005'],
      deliveryChannels: ['email'],
      requestedByUserId: 'admin-user-003',
      requestedAt: new Date('2024-01-15T12:00:00Z'),
    };

    try {
      const result = await deliverAllocationInstructionToFieldLeader(input);
      
      // If function returns an error result object
      expect(result.success).toBe(false);
      expect(result.deliveryHistoryIds).toHaveLength(0);
      expect(result.fieldLeaderDeliveryStatus).toHaveLength(0);
      expect(result.workerDeliveryStatus).toHaveLength(0);
    } catch (error: unknown) {
      // If function throws an exception, verify it's the correct error type
      const err = error as any;
      expect(err.name).toBe('AllocationPlanNotFound');
    }
  });

  it('複数の配置案候補があるが指定されたIDが存在しない場合、エラーを返す', async () => {
    const targetAllocationPlanId = 'plan-999-does-not-exist';
    
    // Setup stub to return null for the target allocation plan
    (allocationPlanDataSource.getAllocationPlanById as jest.Mock).mockResolvedValue(null);

    const input: DeliverAllocationInstructionToFieldLeaderInput = {
      allocationPlanId: targetAllocationPlanId,
      workInstructionId: 'work-instruction-004',
      teamId: 'team-004',
      facilityId: 'facility-004',
      allocatedWorkerIds: ['worker-006'],
      deliveryChannels: ['app_notification', 'handy_terminal'],
      requestedByUserId: 'admin-user-004',
      requestedAt: new Date('2024-01-15T13:00:00Z'),
    };

    try {
      const result = await deliverAllocationInstructionToFieldLeader(input);
      
      // If function returns an error result object
      expect(result.success).toBe(false);
      expect(result.failureReason).toContain(targetAllocationPlanId);
      expect(result.failureReason).toContain('人員配置案が見つかりません');
    } catch (error: unknown) {
      // If function throws an exception
      const err = error as any;
      expect(err.name).toBe('AllocationPlanNotFound');
      expect(err.message).toContain(targetAllocationPlanId);
      expect(err.message).toContain('人員配置案が見つかりません');
    }
  });
});