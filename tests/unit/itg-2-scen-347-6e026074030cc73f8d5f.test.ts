import { jest } from '@jest/globals';
import {
  analyzeInitialAssignmentPerformance,
  AnalyzeInitialAssignmentPerformanceInput,
  AnalyzeInitialAssignmentPerformanceOutput,
} from '../../src/logic/initial-assignment-performance-analysis';

// Mock the data access dependencies
jest.mock('../../src/data-access/worker-repository', () => ({
  findWorkerById: jest.fn(),
}));

jest.mock('../../src/data-access/initial-assignment-repository', () => ({
  findInitialAssignmentByWorkerId: jest.fn(),
}));

jest.mock('../../src/data-access/performance-record-repository', () => ({
  findPerformanceRecordsByWorkerAndPeriod: jest.fn(),
}));

jest.mock('../../src/data-access/productivity-data-repository', () => ({
  findProductivityDataByWorkerAndPeriod: jest.fn(),
}));

jest.mock('../../src/data-access/work-type-repository', () => ({
  findWorkTypeById: jest.fn(),
}));

jest.mock('../../src/utils/validation', () => ({
  validateInputData: jest.fn(),
}));

import { findWorkerById } from '../../src/data-access/worker-repository';
import { findInitialAssignmentByWorkerId } from '../../src/data-access/initial-assignment-repository';
import { findPerformanceRecordsByWorkerAndPeriod } from '../../src/data-access/performance-record-repository';
import { findProductivityDataByWorkerAndPeriod } from '../../src/data-access/productivity-data-repository';
import { findWorkTypeById } from '../../src/data-access/work-type-repository';
import { validateInputData } from '../../src/utils/validation';

describe('SCEN-347: Next review schedule is included in output', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should include nextReviewSchedule in output as a Date type with future timestamp', async () => {
    const now = new Date();
    const analysisStartDateTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const analysisEndDateTime = new Date(now);

    // Setup input validation
    (validateInputData as jest.Mock).mockResolvedValue(true);

    // Setup worker data
    (findWorkerById as jest.Mock).mockResolvedValue({
      workerId: 'worker-001',
      workerName: 'Test Worker',
      status: 'active',
    });

    // Setup initial assignment data
    (findInitialAssignmentByWorkerId as jest.Mock).mockResolvedValue({
      assignmentId: 'assign-001',
      workerId: 'worker-001',
      workTypeId: 'wt-001',
      assignmentStartDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      status: 'active',
    });

    // Setup performance records
    (findPerformanceRecordsByWorkerAndPeriod as jest.Mock).mockResolvedValue([
      {
        recordId: 'perf-001',
        workerId: 'worker-001',
        workTypeId: 'wt-001',
        workDate: new Date(now.getTime() - 6 * 60 * 60 * 1000),
        completedQuantity: 35,
        workTimeMinutes: 160,
        qualityScore: 92,
      },
      {
        recordId: 'perf-002',
        workerId: 'worker-001',
        workTypeId: 'wt-001',
        workDate: new Date(now.getTime() - 12 * 60 * 60 * 1000),
        completedQuantity: 32,
        workTimeMinutes: 160,
        qualityScore: 88,
      },
      {
        recordId: 'perf-003',
        workerId: 'worker-001',
        workTypeId: 'wt-001',
        workDate: new Date(now.getTime() - 18 * 60 * 60 * 1000),
        completedQuantity: 33,
        workTimeMinutes: 160,
        qualityScore: 90,
      },
    ]);

    // Setup productivity data
    (findProductivityDataByWorkerAndPeriod as jest.Mock).mockResolvedValue([
      {
        productivityDataId: 'prod-001',
        workTypeId: 'wt-001',
        standardProductivityRate: 80,
        standardQualityScore: 85,
      },
    ]);

    // Setup work type data
    (findWorkTypeById as jest.Mock).mockResolvedValue({
      workTypeId: 'wt-001',
      workTypeName: 'Assembly',
      standardProductivity: 80,
      difficultyLevel: 3,
    });

    const input: AnalyzeInitialAssignmentPerformanceInput = {
      workerId: 'worker-001',
      initialAssignmentId: 'assign-001',
      analysisStartDateTime,
      analysisEndDateTime,
      requestingUserId: 'leader-001',
    };

    const result = await analyzeInitialAssignmentPerformance(input);

    expect(result).toBeDefined();
    expect(result.nextReviewSchedule).toBeDefined();
    expect(result.nextReviewSchedule instanceof Date).toBe(true);
    expect(result.nextReviewSchedule.getTime()).toBeGreaterThan(now.getTime());
  });

  test('should calculate nextReviewSchedule 1-2 hours after analysis execution at shift boundary time', async () => {
    const now = new Date();
    const analysisStartDateTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const analysisEndDateTime = new Date(now);

    // Setup input validation
    (validateInputData as jest.Mock).mockResolvedValue(true);

    // Setup worker data
    (findWorkerById as jest.Mock).mockResolvedValue({
      workerId: 'worker-001',
      workerName: 'Test Worker',
      status: 'active',
    });

    // Setup initial assignment data
    (findInitialAssignmentByWorkerId as jest.Mock).mockResolvedValue({
      assignmentId: 'assign-001',
      workerId: 'worker-001',
      workTypeId: 'wt-001',
      assignmentStartDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      status: 'active',
    });

    // Setup performance records
    (findPerformanceRecordsByWorkerAndPeriod as jest.Mock).mockResolvedValue([
      {
        recordId: 'perf-001',
        workerId: 'worker-001',
        workTypeId: 'wt-001',
        workDate: new Date(now.getTime() - 6 * 60 * 60 * 1000),
        completedQuantity: 35,
        workTimeMinutes: 160,
        qualityScore: 92,
      },
      {
        recordId: 'perf-002',
        workerId: 'worker-001',
        workTypeId: 'wt-001',
        workDate: new Date(now.getTime() - 12 * 60 * 60 * 1000),
        completedQuantity: 32,
        workTimeMinutes: 160,
        qualityScore: 88,
      },
      {
        recordId: 'perf-003',
        workerId: 'worker-001',
        workTypeId: 'wt-001',
        workDate: new Date(now.getTime() - 18 * 60 * 60 * 1000),
        completedQuantity: 33,
        workTimeMinutes: 160,
        qualityScore: 90,
      },
    ]);

    // Setup productivity data
    (findProductivityDataByWorkerAndPeriod as jest.Mock).mockResolvedValue([
      {
        productivityDataId: 'prod-001',
        workTypeId: 'wt-001',
        standardProductivityRate: 80,
        standardQualityScore: 85,
      },
    ]);

    // Setup work type data
    (findWorkTypeById as jest.Mock).mockResolvedValue({
      workTypeId: 'wt-001',
      workTypeName: 'Assembly',
      standardProductivity: 80,
      difficultyLevel: 3,
    });

    const input: AnalyzeInitialAssignmentPerformanceInput = {
      workerId: 'worker-001',
      initialAssignmentId: 'assign-001',
      analysisStartDateTime,
      analysisEndDateTime,
      requestingUserId: 'leader-001',
    };

    const result = await analyzeInitialAssignmentPerformance(input);

    const hoursUntilReview =
      (result.nextReviewSchedule.getTime() - now.getTime()) / (60 * 60 * 1000);
    expect(hoursUntilReview).toBeGreaterThanOrEqual(1);
    expect(hoursUntilReview).toBeLessThanOrEqual(2);
    expect(result.nextReviewSchedule.getMinutes()).toBe(0);
    expect(result.nextReviewSchedule.getSeconds()).toBe(0);
  });

  test('should ensure nextReviewSchedule is a business day (excludes weekends)', async () => {
    const now = new Date();
    const analysisStartDateTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const analysisEndDateTime = new Date(now);

    // Setup input validation
    (validateInputData as jest.Mock).mockResolvedValue(true);

    // Setup worker data
    (findWorkerById as jest.Mock).mockResolvedValue({
      workerId: 'worker-001',
      workerName: 'Test Worker',
      status: 'active',
    });

    // Setup initial assignment data
    (findInitialAssignmentByWorkerId as jest.Mock).mockResolvedValue({
      assignmentId: 'assign-001',
      workerId: 'worker-001',
      workTypeId: 'wt-001',
      assignmentStartDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      status: 'active',
    });

    // Setup performance records
    (findPerformanceRecordsByWorkerAndPeriod as jest.Mock).mockResolvedValue([
      {
        recordId: 'perf-001',
        workerId: 'worker-001',
        workTypeId: 'wt-001',
        workDate: new Date(now.getTime() - 6 * 60 * 60 * 1000),
        completedQuantity: 35,
        workTimeMinutes: 160,
        qualityScore: 92,
      },
      {
        recordId: 'perf-002',
        workerId: 'worker-001',
        workTypeId: 'wt-001',
        workDate: new Date(now.getTime() - 12 * 60 * 60 * 1000),
        completedQuantity: 32,
        workTimeMinutes: 160,
        qualityScore: 88,
      },
      {
        recordId: 'perf-003',
        workerId: 'worker-001',
        workTypeId: 'wt-001',
        workDate: new Date(now.getTime() - 18 * 60 * 60 * 1000),
        completedQuantity: 33,
        workTimeMinutes: 160,
        qualityScore: 90,
      },
    ]);

    // Setup productivity data
    (findProductivityDataByWorkerAndPeriod as jest.Mock).mockResolvedValue([
      {
        productivityDataId: 'prod-001',
        workTypeId: 'wt-001',
        standardProductivityRate: 80,
        standardQualityScore: 85,
      },
    ]);

    // Setup work type data
    (findWorkTypeById as jest.Mock).mockResolvedValue({
      workTypeId: 'wt-001',
      workTypeName: 'Assembly',
      standardProductivity: 80,
      difficultyLevel: 3,
    });

    const input: AnalyzeInitialAssignmentPerformanceInput = {
      workerId: 'worker-001',
      initialAssignmentId: 'assign-001',
      analysisStartDateTime,
      analysisEndDateTime,
      requestingUserId: 'leader-001',
    };

    const result = await analyzeInitialAssignmentPerformance(input);

    const reviewDayOfWeek = result.nextReviewSchedule.getDay();
    expect(reviewDayOfWeek).not.toBe(0);
    expect(reviewDayOfWeek).not.toBe(6);
  });

  test('should include analysisTimestamp that precedes nextReviewSchedule', async () => {
    const now = new Date();
    const analysisStartDateTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const analysisEndDateTime = new Date(now);

    // Setup input validation
    (validateInputData as jest.Mock).mockResolvedValue(true);

    // Setup worker data
    (findWorkerById as jest.Mock).mockResolvedValue({
      workerId: 'worker-001',
      workerName: 'Test Worker',
      status: 'active',
    });

    // Setup initial assignment data
    (findInitialAssignmentByWorkerId as jest.Mock).mockResolvedValue({
      assignmentId: 'assign-001',
      workerId: 'worker-001',
      workTypeId: 'wt-001',
      assignmentStartDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      status: 'active',
    });

    // Setup performance records
    (findPerformanceRecordsByWorkerAndPeriod as jest.Mock).mockResolvedValue([
      {
        recordId: 'perf-001',
        workerId: 'worker-001',
        workTypeId: 'wt-001',
        workDate: new Date(now.getTime() - 6 * 60 * 60 * 1000),
        completedQuantity: 35,
        workTimeMinutes: 160,
        qualityScore: 92,
      },
      {
        recordId: 'perf-002',
        workerId: 'worker-001',
        workTypeId: 'wt-001',
        workDate: new Date(now.getTime() - 12 * 60 * 60 * 1000),
        completedQuantity: 32,
        workTimeMinutes: 160,
        qualityScore: 88,
      },
      {
        recordId: 'perf-003',
        workerId: 'worker-001',
        workTypeId: 'wt-001',
        workDate: new Date(now.getTime() - 18 * 60 * 60 * 1000),
        completedQuantity: 33,
        workTimeMinutes: 160,
        qualityScore: 90,
      },
    ]);

    // Setup productivity data
    (findProductivityDataByWorkerAndPeriod as jest.Mock).mockResolvedValue([
      {
        productivityDataId: 'prod-001',
        workTypeId: 'wt-001',
        standardProductivityRate: 80,
        standardQualityScore: 85,
      },
    ]);

    // Setup work type data
    (findWorkTypeById as jest.Mock).mockResolvedValue({
      workTypeId: 'wt-001',
      workTypeName: 'Assembly',
      standardProductivity: 80,
      difficultyLevel: 3,
    });

    const input: AnalyzeInitialAssignmentPerformanceInput = {
      workerId: 'worker-001',
      initialAssignmentId: 'assign-001',
      analysisStartDateTime,
      analysisEndDateTime,
      requestingUserId: 'leader-001',
    };

    const result = await analyzeInitialAssignmentPerformance(input);

    expect(result.analysisTimestamp).toBeDefined();
    expect(result.analysisTimestamp instanceof Date).toBe(true);
    expect(result.nextReviewSchedule.getTime()).toBeGreaterThan(
      result.analysisTimestamp.getTime()
    );
  });
});