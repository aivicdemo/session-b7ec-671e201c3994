import { jest } from '@jest/globals';
import {
  listAllocationExecutionStatusByCondition,
  ListAllocationExecutionStatusByConditionInput,
  ListAllocationExecutionStatusByConditionOutput,
  GetAllocationExecutionStatusByIdOutput,
} from '../../src/logic/data-persistence';

// Mock validators
jest.mock('../../src/logic/validators', () => ({
  validateDateTimeRange: jest.fn().mockResolvedValue({ isValid: true }),
  validateNumericQuantity: jest.fn().mockResolvedValue({ isValid: true }),
  validateReferentialIntegrity: jest.fn().mockResolvedValue({ isValid: true }),
}));

// Mock database store
jest.mock('../../src/infrastructure/database-store', () => ({
  DatabaseStore: {
    getAllocationExecutionStatusByCondition: jest.fn(),
  },
}));

describe('SCEN-863: ページング指定ありで指定ページを取得する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper function to generate test data
  const generateTestAllocationExecutionStatus = (
    index: number,
  ): GetAllocationExecutionStatusByIdOutput => ({
    allocationExecutionStatusId: `alloc-exec-${index}`,
    allocationPlanId: `alloc-plan-${index}`,
    workInstructionId: `work-instr-${index}`,
    workerId: `worker-${index}`,
    facilityId: `facility-${index}`,
    teamId: `team-${index}`,
    allocationState: 'active',
    plannedStartDateTime: '2024-01-01T08:00:00Z',
    plannedEndDateTime: '2024-01-01T17:00:00Z',
    actualStartDateTime: '2024-01-01T08:05:00Z',
    actualEndDateTime: null,
    plannedWorkHours: 8,
    actualWorkHours: null,
    progressRate: index * 5,
    delayFlag: index > 50,
    remarks: `Test data ${index}`,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdBy: 'test-user',
    updatedBy: null,
  });

  it('pageNumber=2、pageSize=10でソート指定ありの場合、2ページ目のデータを正しく取得する', async () => {
    // Setup: Generate test data for 100 records
    const allTestData: GetAllocationExecutionStatusByIdOutput[] = [];
    for (let i = 0; i < 100; i++) {
      allTestData.push(generateTestAllocationExecutionStatus(i));
    }

    // Sort by progressRate ascending
    const sortedData = [...allTestData].sort(
      (a, b) => a.progressRate - b.progressRate,
    );

    // Get page 2 (records 11-20, 0-indexed: 10-19)
    const page2Data = sortedData.slice(10, 20);

    // Mock database to return page 2 data
    const { DatabaseStore } = require('../../src/infrastructure/database-store');
    DatabaseStore.getAllocationExecutionStatusByCondition.mockResolvedValueOnce({
      data: page2Data,
      totalCount: 100,
    });

    const input: ListAllocationExecutionStatusByConditionInput = {
      pageNumber: 2,
      pageSize: 10,
      sortBy: 'progressRate',
      sortOrder: 'ASC',
    };

    const result: ListAllocationExecutionStatusByConditionOutput =
      await listAllocationExecutionStatusByCondition(input);

    // (1) allocationExecutionStatuses is array of length 10 with GetAllocationExecutionStatusByIdOutput type
    expect(result.allocationExecutionStatuses).toHaveLength(10);
    result.allocationExecutionStatuses.forEach((item) => {
      expect(item.allocationExecutionStatusId).toBeDefined();
      expect(typeof item.allocationExecutionStatusId).toBe('string');
      expect(item.allocationPlanId).toBeDefined();
      expect(typeof item.allocationPlanId).toBe('string');
      expect(item.workInstructionId).toBeDefined();
      expect(typeof item.workInstructionId).toBe('string');
      expect(item.workerId).toBeDefined();
      expect(typeof item.workerId).toBe('string');
      expect(item.facilityId).toBeDefined();
      expect(typeof item.facilityId).toBe('string');
      expect(item.teamId).toBeDefined();
      expect(typeof item.teamId).toBe('string');
      expect(item.allocationState).toBeDefined();
      expect(typeof item.allocationState).toBe('string');
      expect(item.plannedStartDateTime).toBeDefined();
      expect(typeof item.plannedStartDateTime).toBe('string');
      expect(item.plannedEndDateTime).toBeDefined();
      expect(typeof item.plannedEndDateTime).toBe('string');
      expect(item.progressRate).toBeDefined();
      expect(typeof item.progressRate).toBe('number');
      expect(item.progressRate).toBeGreaterThanOrEqual(0);
      expect(item.progressRate).toBeLessThanOrEqual(100);
      expect(item.delayFlag).toBeDefined();
      expect(typeof item.delayFlag).toBe('boolean');
      expect(item.createdAt).toBeDefined();
      expect(typeof item.createdAt).toBe('string');
      expect(item.updatedAt).toBeDefined();
      expect(typeof item.updatedAt).toBe('string');
      expect(item.createdBy).toBeDefined();
      expect(typeof item.createdBy).toBe('string');
    });

    // (2) Verify data is from 11th-20th records and sorted by progressRate in ascending order
    for (let i = 0; i < result.allocationExecutionStatuses.length - 1; i++) {
      const current = result.allocationExecutionStatuses[i].progressRate;
      const next = result.allocationExecutionStatuses[i + 1].progressRate;
      expect(current).toBeLessThanOrEqual(next);
    }

    // Verify records are 11th-20th (offset = (2-1)*10 = 10)
    const expectedOffset = (input.pageNumber! - 1) * input.pageSize!;
    expect(result.allocationExecutionStatuses[0].allocationExecutionStatusId).toBe(
      sortedData[expectedOffset].allocationExecutionStatusId,
    );
    expect(
      result.allocationExecutionStatuses[
        result.allocationExecutionStatuses.length - 1
      ].allocationExecutionStatusId,
    ).toBe(sortedData[expectedOffset + input.pageSize! - 1].allocationExecutionStatusId);

    // (3) totalCount = 100 (total records before pagination)
    expect(result.totalCount).toBe(100);

    // (4) pageNumber = 2 (specified page number)
    expect(result.pageNumber).toBe(2);

    // (5) pageSize = 10 (records per page)
    expect(result.pageSize).toBe(10);

    // (6) retrievedAt is ISO 8601 format and near current time
    const iso8601Regex =
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})$/;
    expect(result.retrievedAt).toMatch(iso8601Regex);

    const retrievedTime = new Date(result.retrievedAt).getTime();
    const currentTime = Date.now();
    const timeDifference = Math.abs(currentTime - retrievedTime);
    expect(timeDifference).toBeLessThan(60000); // Within 60 seconds
  });

  it('ソートが正しく適用され、progressRateが昇順でソートされること', async () => {
    const testData = Array.from({ length: 100 }, (_, i) =>
      generateTestAllocationExecutionStatus(i),
    );

    const sortedData = [...testData].sort(
      (a, b) => a.progressRate - b.progressRate,
    );
    const page2Data = sortedData.slice(10, 20);

    const { DatabaseStore } = require('../../src/infrastructure/database-store');
    DatabaseStore.getAllocationExecutionStatusByCondition.mockResolvedValueOnce({
      data: page2Data,
      totalCount: 100,
    });

    const input: ListAllocationExecutionStatusByConditionInput = {
      pageNumber: 2,
      pageSize: 10,
      sortBy: 'progressRate',
      sortOrder: 'ASC',
    };

    const result: ListAllocationExecutionStatusByConditionOutput =
      await listAllocationExecutionStatusByCondition(input);

    expect(result.allocationExecutionStatuses.length).toBe(10);
    expect(result.pageNumber).toBe(2);
    expect(result.pageSize).toBe(10);

    // Verify progressRate ascending sort
    for (let i = 0; i < result.allocationExecutionStatuses.length - 1; i++) {
      const current = result.allocationExecutionStatuses[i].progressRate;
      const next = result.allocationExecutionStatuses[i + 1].progressRate;
      expect(current).toBeLessThanOrEqual(next);
    }
  });

  it('retrievedAt が ISO 8601 形式で、かつ現在時刻付近であること', async () => {
    const testData = Array.from({ length: 100 }, (_, i) =>
      generateTestAllocationExecutionStatus(i),
    );

    const sortedData = [...testData].sort(
      (a, b) => a.progressRate - b.progressRate,
    );
    const page2Data = sortedData.slice(10, 20);

    const { DatabaseStore } = require('../../src/infrastructure/database-store');
    DatabaseStore.getAllocationExecutionStatusByCondition.mockResolvedValueOnce({
      data: page2Data,
      totalCount: 100,
    });

    const input: ListAllocationExecutionStatusByConditionInput = {
      pageNumber: 2,
      pageSize: 10,
      sortBy: 'progressRate',
      sortOrder: 'ASC',
    };

    const beforeTime = Date.now();
    const result: ListAllocationExecutionStatusByConditionOutput =
      await listAllocationExecutionStatusByCondition(input);
    const afterTime = Date.now();

    const iso8601Regex =
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})$/;
    expect(result.retrievedAt).toMatch(iso8601Regex);

    const retrievedTime = new Date(result.retrievedAt).getTime();
    expect(retrievedTime).toBeGreaterThanOrEqual(beforeTime - 1000);
    expect(retrievedTime).toBeLessThanOrEqual(afterTime + 1000);
  });

  it('ページ2として、ページング計算により11番目～20番目のデータが取得されること', async () => {
    const testData = Array.from({ length: 100 }, (_, i) =>
      generateTestAllocationExecutionStatus(i),
    );

    const sortedData = [...testData].sort(
      (a, b) => a.progressRate - b.progressRate,
    );
    const page2Data = sortedData.slice(10, 20);

    const { DatabaseStore } = require('../../src/infrastructure/database-store');
    DatabaseStore.getAllocationExecutionStatusByCondition.mockResolvedValueOnce({
      data: page2Data,
      totalCount: 100,
    });

    const input: ListAllocationExecutionStatusByConditionInput = {
      pageNumber: 2,
      pageSize: 10,
      sortBy: 'progressRate',
      sortOrder: 'ASC',
    };

    const result: ListAllocationExecutionStatusByConditionOutput =
      await listAllocationExecutionStatusByCondition(input);

    expect(result.pageNumber).toBe(2);
    expect(result.pageSize).toBe(10);
    expect(result.allocationExecutionStatuses.length).toBe(10);
    expect(result.totalCount).toBe(100);

    // Verify pagination calculation: page 2 starts at record 11 (index 10)
    const expectedMinTotalCount =
      (input.pageNumber! - 1) * input.pageSize! +
      result.allocationExecutionStatuses.length;
    expect(result.totalCount).toBeGreaterThanOrEqual(expectedMinTotalCount);

    // Verify data corresponds to 11th-20th records
    for (
      let i = 0;
      i < result.allocationExecutionStatuses.length;
      i++
    ) {
      expect(result.allocationExecutionStatuses[i].allocationExecutionStatusId).toBe(
        sortedData[10 + i].allocationExecutionStatusId,
      );
    }
  });

  it('各要素の必須フィールドが定義されていること', async () => {
    const testData = Array.from({ length: 100 }, (_, i) =>
      generateTestAllocationExecutionStatus(i),
    );

    const sortedData = [...testData].sort(
      (a, b) => a.progressRate - b.progressRate,
    );
    const page2Data = sortedData.slice(10, 20);

    const { DatabaseStore } = require('../../src/infrastructure/database-store');
    DatabaseStore.getAllocationExecutionStatusByCondition.mockResolvedValueOnce({
      data: page2Data,
      totalCount: 100,
    });

    const input: ListAllocationExecutionStatusByConditionInput = {
      pageNumber: 2,
      pageSize: 10,
      sortBy: 'progressRate',
      sortOrder: 'ASC',
    };

    const result: ListAllocationExecutionStatusByConditionOutput =
      await listAllocationExecutionStatusByCondition(input);

    result.allocationExecutionStatuses.forEach((item) => {
      expect(item.allocationExecutionStatusId).toBeDefined();
      expect(item.allocationPlanId).toBeDefined();
      expect(item.workInstructionId).toBeDefined();
      expect(item.workerId).toBeDefined();
      expect(item.facilityId).toBeDefined();
      expect(item.teamId).toBeDefined();
      expect(item.allocationState).toBeDefined();
      expect(item.plannedStartDateTime).toBeDefined();
      expect(item.plannedEndDateTime).toBeDefined();
      expect(item.progressRate).toBeDefined();
      expect(item.delayFlag).toBeDefined();
      expect(item.createdAt).toBeDefined();
      expect(item.updatedAt).toBeDefined();
      expect(item.createdBy).toBeDefined();
    });
  });

  it('出力フィールド totalCount がページング前の全件数を正確に反映していること', async () => {
    const testData = Array.from({ length: 100 }, (_, i) =>
      generateTestAllocationExecutionStatus(i),
    );

    const sortedData = [...testData].sort(
      (a, b) => a.progressRate - b.progressRate,
    );
    const page2Data = sortedData.slice(10, 20);

    const { DatabaseStore } = require('../../src/infrastructure/database-store');
    DatabaseStore.getAllocationExecutionStatusByCondition.mockResolvedValueOnce({
      data: page2Data,
      totalCount: 100,
    });

    const input: ListAllocationExecutionStatusByConditionInput = {
      pageNumber: 2,
      pageSize: 10,
      sortBy: 'progressRate',
      sortOrder: 'ASC',
    };

    const result: ListAllocationExecutionStatusByConditionOutput =
      await listAllocationExecutionStatusByCondition(input);

    expect(result.totalCount).toBeDefined();
    expect(typeof result.totalCount).toBe('number');
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(result.totalCount).toBe(100);
  });
});