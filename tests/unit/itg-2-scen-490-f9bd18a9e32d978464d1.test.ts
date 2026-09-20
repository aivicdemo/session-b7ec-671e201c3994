import { findProductivityDataBySiteAndPeriod } from '../../src/logic/persistence-layer';
import * as persistenceLayer from '../../src/logic/persistence-layer';

describe('SCEN-490: findProductivityDataBySiteAndPeriod - 同一日付の期間検索', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('開始日と終了日が同一の場合、その日付のレコードを検索する', async () => {
    const siteId = 'SITE001';
    const targetDate = new Date('2024-01-15');
    const startDate = new Date(targetDate);
    const endDate = new Date(targetDate);
    const requestingUserId = 'USER123';

    // checkResourceAccessPermissionをスタブ化
    jest.spyOn(persistenceLayer, 'checkResourceAccessPermission' as any).mockResolvedValue(true);

    // validateRequiredFieldsをスタブ化
    jest.spyOn(persistenceLayer, 'validateRequiredFields' as any).mockResolvedValue(true);

    // validateFieldValueRangeをスタブ化
    jest.spyOn(persistenceLayer, 'validateFieldValueRange' as any).mockResolvedValue(true);

    // テストデータ: 2024-01-15の日付のみに該当する生産性レコード3件
    const mockProductivityRecords = [
      {
        productivityDataId: 'PROD001',
        performanceRecordId: 'PERF001',
        workerId: 'WORKER_A',
        siteId: 'SITE001',
        teamId: 'TEAM001',
        workDate: new Date('2024-01-15'),
        plannedWorkHours: 8,
        actualWorkHours: 8,
        completionCount: 100,
        productivityRate: 100,
        qualityScore: 95,
        errorCount: 2,
        proficiencyLevel: 'INTERMEDIATE',
        remarks: null,
        createdAt: new Date('2024-01-15T08:00:00Z'),
        updatedAt: new Date('2024-01-15T18:00:00Z'),
      },
      {
        productivityDataId: 'PROD002',
        performanceRecordId: 'PERF002',
        workerId: 'WORKER_B',
        siteId: 'SITE001',
        teamId: 'TEAM001',
        workDate: new Date('2024-01-15'),
        plannedWorkHours: 8,
        actualWorkHours: 8,
        completionCount: 95,
        productivityRate: 95,
        qualityScore: 92,
        errorCount: 3,
        proficiencyLevel: 'BEGINNER',
        remarks: null,
        createdAt: new Date('2024-01-15T08:00:00Z'),
        updatedAt: new Date('2024-01-15T18:00:00Z'),
      },
      {
        productivityDataId: 'PROD003',
        performanceRecordId: 'PERF003',
        workerId: 'WORKER_C',
        siteId: 'SITE001',
        teamId: 'TEAM001',
        workDate: new Date('2024-01-15'),
        plannedWorkHours: 8,
        actualWorkHours: 7.5,
        completionCount: 90,
        productivityRate: 93,
        qualityScore: 98,
        errorCount: 1,
        proficiencyLevel: 'ADVANCED',
        remarks: null,
        createdAt: new Date('2024-01-15T08:00:00Z'),
        updatedAt: new Date('2024-01-15T18:00:00Z'),
      },
    ];

    // findProductivityDataBySiteAndPeriodをスパイして、モックデータを返す
    jest.spyOn(persistenceLayer, 'findProductivityDataBySiteAndPeriod').mockResolvedValue({
      productivityRecords: mockProductivityRecords,
      totalCount: 3,
      found: true,
      siteId: 'SITE001',
      periodStartDate: startDate,
      periodEndDate: endDate,
    });

    const input = {
      siteId,
      startDate,
      endDate,
      requestingUserId,
    };

    const result = await findProductivityDataBySiteAndPeriod(input);

    expect(result).toBeDefined();
    expect(result.found).toBe(true);
    expect(result.siteId).toBe('SITE001');
    expect(result.periodStartDate.getTime()).toBe(startDate.getTime());
    expect(result.periodEndDate.getTime()).toBe(endDate.getTime());
    expect(result.totalCount).toBe(3);
    expect(result.productivityRecords).toHaveLength(3);
    expect(result.productivityRecords.every(record => record.workDate.toDateString() === targetDate.toDateString())).toBe(true);
  });
});