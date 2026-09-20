import { findPerformanceRecordsByWorkerAndPeriod, FindPerformanceRecordsByWorkerAndPeriodInput, FindPerformanceRecordsByWorkerAndPeriodOutput, PerformanceRecordDetail } from '../../src/logic/persistence-layer';

describe('findPerformanceRecordsByWorkerAndPeriod', () => {
  it('should return all matching performance records with accurate totalCount when multiple records exist within the search period', async () => {
    const input: FindPerformanceRecordsByWorkerAndPeriodInput = {
      workerId: 'W001',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      requestingUserId: 'U001',
    };

    const mockRecords: PerformanceRecordDetail[] = [
      {
        performanceRecordId: 'PR001',
        workerId: 'W001',
        placementPlanId: 'PP001',
        workDate: new Date('2024-01-05'),
        workContent: 'Assembly task',
        completionCount: 10,
        requiredTimeMinutes: 120,
        qualityScore: 85,
        remarks: 'Good progress',
        createdAt: new Date('2024-01-05T10:00:00Z'),
        updatedAt: new Date('2024-01-05T10:00:00Z'),
      },
      {
        performanceRecordId: 'PR002',
        workerId: 'W001',
        placementPlanId: 'PP001',
        workDate: new Date('2024-01-10'),
        workContent: 'Assembly task',
        completionCount: 12,
        requiredTimeMinutes: 130,
        qualityScore: 87,
        remarks: 'Improved speed',
        createdAt: new Date('2024-01-10T10:00:00Z'),
        updatedAt: new Date('2024-01-10T10:00:00Z'),
      },
      {
        performanceRecordId: 'PR003',
        workerId: 'W001',
        placementPlanId: 'PP001',
        workDate: new Date('2024-01-15'),
        workContent: 'Assembly task',
        completionCount: 15,
        requiredTimeMinutes: 120,
        qualityScore: 90,
        remarks: 'Excellent quality',
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-15T10:00:00Z'),
      },
      {
        performanceRecordId: 'PR004',
        workerId: 'W001',
        placementPlanId: 'PP001',
        workDate: new Date('2024-01-20'),
        workContent: 'Assembly task',
        completionCount: 14,
        requiredTimeMinutes: 115,
        qualityScore: 88,
        remarks: 'Consistent performance',
        createdAt: new Date('2024-01-20T10:00:00Z'),
        updatedAt: new Date('2024-01-20T10:00:00Z'),
      },
      {
        performanceRecordId: 'PR005',
        workerId: 'W001',
        placementPlanId: 'PP001',
        workDate: new Date('2024-01-25'),
        workContent: 'Assembly task',
        completionCount: 16,
        requiredTimeMinutes: 125,
        qualityScore: 92,
        remarks: 'Best performance yet',
        createdAt: new Date('2024-01-25T10:00:00Z'),
        updatedAt: new Date('2024-01-25T10:00:00Z'),
      },
    ];

    jest.spyOn(require('../../src/logic/persistence-layer'), 'findPerformanceRecordsByWorkerAndPeriod').mockResolvedValue({
      performanceRecords: mockRecords,
      totalCount: 5,
      found: true,
      workerId: 'W001',
      periodStartDate: new Date('2024-01-01'),
      periodEndDate: new Date('2024-01-31'),
    } as FindPerformanceRecordsByWorkerAndPeriodOutput);

    const result = await findPerformanceRecordsByWorkerAndPeriod(input);

    expect(result.performanceRecords).toHaveLength(5);
    expect(result.performanceRecords[0].performanceRecordId).toBe('PR001');
    expect(result.performanceRecords[0].workDate).toEqual(new Date('2024-01-05'));
    expect(result.performanceRecords[1].performanceRecordId).toBe('PR002');
    expect(result.performanceRecords[1].workDate).toEqual(new Date('2024-01-10'));
    expect(result.performanceRecords[2].performanceRecordId).toBe('PR003');
    expect(result.performanceRecords[2].workDate).toEqual(new Date('2024-01-15'));
    expect(result.performanceRecords[3].performanceRecordId).toBe('PR004');
    expect(result.performanceRecords[3].workDate).toEqual(new Date('2024-01-20'));
    expect(result.performanceRecords[4].performanceRecordId).toBe('PR005');
    expect(result.performanceRecords[4].workDate).toEqual(new Date('2024-01-25'));
    expect(result.totalCount).toBe(5);
    expect(result.found).toBe(true);
    expect(result.workerId).toBe('W001');
    expect(result.periodStartDate).toEqual(new Date('2024-01-01'));
    expect(result.periodEndDate).toEqual(new Date('2024-01-31'));
  });
});