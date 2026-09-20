import { saveProductivityData, findProductivityDataByWorkerAndPeriod } from '../../src/logic/persistence-layer';

describe('SCEN-454: 作業者生産性データ新規保存', () => {
  it('新規作成時に有効な入力データで生産性データが正常に保存され、成功フラグと生成されたIDが返される', async () => {
    const input = {
      productivityDataId: '550e8400-e29b-41d4-a716-446655440000',
      performanceRecordId: 'perf-001',
      workerId: 'worker-123',
      siteId: 'site-45',
      teamId: 'team-78',
      workDate: new Date('2024-01-15'),
      plannedWorkHours: 480,
      actualWorkHours: 500,
      completionCount: 150,
      productivityRate: 104.17,
      qualityScore: 95.33,
      errorCount: 7,
      proficiencyLevel: 'ADVANCED',
      remarks: '通常稼働、特記事項なし',
      createdBy: 'user-admin-001',
      updatedBy: undefined,
      requestingUserId: 'user-requester-002',
      operation: 'create' as const,
    };

    const result = await saveProductivityData(input);

    expect(result.success).toBe(true);
    expect(result.productivityDataId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.operation).toBe('create');
    expect(result.savedAt).toBeInstanceOf(Date);
    expect(result.savedAt.getTime()).toBeLessThanOrEqual(Date.now());

    // 永続化層に保存されたレコードの確認
    const retrievalInput = {
      workerId: 'worker-123',
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-01-15'),
      requestingUserId: 'user-requester-002',
    };

    const retrievedData = await findProductivityDataByWorkerAndPeriod(retrievalInput);

    expect(retrievedData.found).toBe(true);
    expect(retrievedData.totalCount).toBeGreaterThan(0);
    expect(retrievedData.productivityRecords).toContainEqual(
      expect.objectContaining({
        productivityDataId: '550e8400-e29b-41d4-a716-446655440000',
        workerId: 'worker-123',
        siteId: 'site-45',
        teamId: 'team-78',
        workDate: expect.any(Date),
        plannedWorkHours: 480,
        actualWorkHours: 500,
        completionCount: 150,
        productivityRate: 104.17,
        qualityScore: 95.33,
        errorCount: 7,
        proficiencyLevel: 'ADVANCED',
        remarks: '通常稼働、特記事項なし',
      })
    );
  });
});