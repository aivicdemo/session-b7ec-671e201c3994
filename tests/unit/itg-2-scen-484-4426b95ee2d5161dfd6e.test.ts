import { findProductivityDataBySiteAndPeriod } from '../../src/logic/persistence-layer';
import * as persistenceLayer from '../../src/logic/persistence-layer';

jest.mock('../../src/logic/persistence-layer');

describe('SCEN-484: findProductivityDataBySiteAndPeriod', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should search productivity records by site and period, and return results successfully', async () => {
    const siteId = 'SITE001';
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');
    const requestingUserId = 'USER123';

    const mockProductivityRecords = [
      {
        productivityDataId: 'PROD001',
        performanceRecordId: 'PERF001',
        workerId: 'WORKER001',
        siteId: 'SITE001',
        teamId: 'TEAM001',
        workDate: new Date('2024-01-05'),
        plannedWorkHours: 8,
        actualWorkHours: 8.5,
        completionCount: 100,
        productivityRate: 95,
        qualityScore: 90,
        errorCount: 2,
        proficiencyLevel: 'INTERMEDIATE',
        remarks: null,
        createdAt: new Date('2024-01-05T09:00:00Z'),
        updatedAt: new Date('2024-01-05T09:00:00Z'),
      },
      {
        productivityDataId: 'PROD002',
        performanceRecordId: 'PERF002',
        workerId: 'WORKER002',
        siteId: 'SITE001',
        teamId: 'TEAM001',
        workDate: new Date('2024-01-10'),
        plannedWorkHours: 8,
        actualWorkHours: 7.8,
        completionCount: 98,
        productivityRate: 97,
        qualityScore: 92,
        errorCount: 1,
        proficiencyLevel: 'INTERMEDIATE',
        remarks: null,
        createdAt: new Date('2024-01-10T09:00:00Z'),
        updatedAt: new Date('2024-01-10T09:00:00Z'),
      },
    ];

    (persistenceLayer.findProductivityDataBySiteAndPeriod as jest.Mock).mockResolvedValue({
      productivityRecords: mockProductivityRecords,
      totalCount: 2,
      found: true,
      siteId: siteId,
      periodStartDate: startDate,
      periodEndDate: endDate,
      averageProductivityRate: 96,
      averageQualityScore: 91,
    });

    const result = await findProductivityDataBySiteAndPeriod({
      siteId,
      startDate,
      endDate,
      requestingUserId,
    });

    expect(result).toBeDefined();
    expect(result.found).toBe(true);
    expect(result.siteId).toBe(siteId);
    expect(result.periodStartDate).toEqual(startDate);
    expect(result.periodEndDate).toEqual(endDate);
    expect(result.productivityRecords).toBeDefined();
    expect(Array.isArray(result.productivityRecords)).toBe(true);
    expect(result.totalCount).toBe(result.productivityRecords.length);
    expect(result.totalCount).toBe(2);
    expect(result.averageProductivityRate).toBe(96);
    expect(result.averageQualityScore).toBe(91);
  });
});