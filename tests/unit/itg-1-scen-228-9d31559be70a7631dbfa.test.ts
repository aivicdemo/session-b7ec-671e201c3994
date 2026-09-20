import { aggregateHandyTerminalWorkResults } from '../../src/logic/work-instruction-delivery-manager';

describe('SCEN-228: チームIDがnullの場合、拠点全体の実績を集約する', () => {
  it('should aggregate work results for entire facility when teamId is null', async () => {
    // テスト対象システムに権限検証スタブをセットアップする
    const mockAuthorizeOperation = jest.fn().mockResolvedValue(true);

    // listHandyTerminalSyncLogByConditionスタブをセットアップする
    const mockListHandyTerminalSyncLogByCondition = jest.fn().mockResolvedValue([
      // チームAから50件
      ...Array.from({ length: 50 }, (_, i) => ({
        handyTerminalSyncLogId: `log-team-a-${i}`,
        workInstructionId: `wi-a-${i}`,
        workerId: `worker-a-${i}`,
        facilityId: 'FAC-001',
        teamId: 'TEAM-A',
        workStartDateTime: '2024-01-15T09:00:00Z',
        workEndDateTime: '2024-01-15T10:00:00Z',
        completedQuantity: 10,
        defectiveQuantity: 0,
        syncTimestamp: '2024-01-15T10:05:00Z',
      })),
      // チームBから40件
      ...Array.from({ length: 40 }, (_, i) => ({
        handyTerminalSyncLogId: `log-team-b-${i}`,
        workInstructionId: `wi-b-${i}`,
        workerId: `worker-b-${i}`,
        facilityId: 'FAC-001',
        teamId: 'TEAM-B',
        workStartDateTime: '2024-01-15T09:00:00Z',
        workEndDateTime: '2024-01-15T10:00:00Z',
        completedQuantity: 8,
        defectiveQuantity: 1,
        syncTimestamp: '2024-01-15T10:05:00Z',
      })),
      // チームCから30件
      ...Array.from({ length: 30 }, (_, i) => ({
        handyTerminalSyncLogId: `log-team-c-${i}`,
        workInstructionId: `wi-c-${i}`,
        workerId: `worker-c-${i}`,
        facilityId: 'FAC-001',
        teamId: 'TEAM-C',
        workStartDateTime: '2024-01-15T09:00:00Z',
        workEndDateTime: '2024-01-15T10:00:00Z',
        completedQuantity: 12,
        defectiveQuantity: 2,
        syncTimestamp: '2024-01-15T10:05:00Z',
      })),
    ]);

    // getWorkerWithProficiencyAndProductivityスタブをセットアップする
    const mockGetWorkerWithProficiencyAndProductivity = jest
      .fn()
      .mockResolvedValue([
        {
          workerId: 'worker-a-0',
          proficiencyLevel: 'intermediate',
          recentProductivityRate: 0.85,
          qualityScore: 90,
        },
        {
          workerId: 'worker-b-0',
          proficiencyLevel: 'beginner',
          recentProductivityRate: 0.72,
          qualityScore: 78,
        },
        {
          workerId: 'worker-c-0',
          proficiencyLevel: 'advanced',
          recentProductivityRate: 0.95,
          qualityScore: 95,
        },
      ]);

    // aggregateWorkResultsAndCalculateProductivityスタブをセットアップする
    const mockAggregateWorkResultsAndCalculateProductivity = jest
      .fn()
      .mockResolvedValue({
        aggregatedWorkResults: [
          {
            workResultId: 'wr-agg-1',
            workerId: 'worker-a-0',
            workInstructionId: 'wi-a-0',
            workStartDateTime: '2024-01-15T09:00:00Z',
            workEndDateTime: '2024-01-15T10:00:00Z',
            completedQuantity: 500,
            defectiveQuantity: 3,
            dataSource: 'merged' as const,
          },
        ],
        calculatedProductivityMetrics: [
          {
            workerId: 'worker-a-0',
            aggregationDate: '2024-01-15',
            plannedWorkHours: 8,
            actualWorkHours: 7.5,
            completedItemCount: 500,
            productivityRate: 0.88,
            qualityScore: 0.94,
            errorCount: 3,
            proficiencyLevel: 'intermediate',
          },
        ],
      });

    // saveProductivityDataスタブをセットアップする
    const mockSaveProductivityData = jest
      .fn()
      .mockResolvedValue(['prod-data-id-1', 'prod-data-id-2']);

    // recordOperationAuditスタブをセットアップする
    const mockRecordOperationAudit = jest
      .fn()
      .mockResolvedValue('audit-log-id-001');

    // aggregateHandyTerminalWorkResultsを呼び出す
    const result = await aggregateHandyTerminalWorkResults(
      {
        facilityId: 'FAC-001',
        teamId: null,
        aggregationStartDateTime: '2024-01-01T00:00:00Z',
        aggregationEndDateTime: '2024-01-31T23:59:59Z',
        operatingUserId: 'USER-123',
        includeWmsData: true,
      },
      {
        authorizeOperation: mockAuthorizeOperation,
        listHandyTerminalSyncLogByCondition: mockListHandyTerminalSyncLogByCondition,
        getWorkerWithProficiencyAndProductivity:
          mockGetWorkerWithProficiencyAndProductivity,
        aggregateWorkResultsAndCalculateProductivity:
          mockAggregateWorkResultsAndCalculateProductivity,
        saveProductivityData: mockSaveProductivityData,
        recordOperationAudit: mockRecordOperationAudit,
      }
    );

    // 返された出力の各フィールドを検証する
    // 1. aggregationId：UUID形式の一意の集約操作識別子が生成されている
    expect(result.aggregationId).toBeDefined();
    expect(typeof result.aggregationId).toBe('string');
    expect(result.aggregationId.length).toBeGreaterThan(0);

    // 2. facilityId：'FAC-001'として返される
    expect(result.facilityId).toBe('FAC-001');

    // 3. teamId：nullとして返される（拠点全体の集約であることを示す）
    expect(result.teamId).toBeNull();

    // 4. aggregationPeriodStart：'2024-01-01T00:00:00Z'として返される
    expect(result.aggregationPeriodStart).toBe('2024-01-01T00:00:00Z');

    // 5. aggregationPeriodEnd：'2024-01-31T23:59:59Z'として返される
    expect(result.aggregationPeriodEnd).toBe('2024-01-31T23:59:59Z');

    // 6. totalHandyTerminalSyncLogsProcessed：複数チームの全ハンディターミナルログ件数の合計（120件）として返される
    expect(result.totalHandyTerminalSyncLogsProcessed).toBe(120);

    // 7. totalWmsSyncLogsProcessed：includeWmsDataがtrueであるため、WMS連携ログの処理件数が0以上の数値として返される
    expect(result.totalWmsSyncLogsProcessed).toBeGreaterThanOrEqual(0);
    expect(typeof result.totalWmsSyncLogsProcessed).toBe('number');

    // 8. aggregatedWorkResults：ReadonlyArray<AggregatedWorkResult>として、チームIDの異なる複数の作業実績データが含まれる配列が返される
    expect(Array.isArray(result.aggregatedWorkResults)).toBe(true);
    expect(result.aggregatedWorkResults.length).toBeGreaterThan(0);
    result.aggregatedWorkResults.forEach((item) => {
      expect(item.workResultId).toBeDefined();
      expect(item.workerId).toBeDefined();
      expect(item.workInstructionId).toBeDefined();
      expect(item.workStartDateTime).toBeDefined();
      expect(item.workEndDateTime).toBeDefined();
      expect(typeof item.completedQuantity).toBe('number');
      expect(typeof item.defectiveQuantity).toBe('number');
      expect(['handy_terminal', 'wms', 'merged']).toContain(item.dataSource);
    });

    // 9. calculatedProductivityMetrics：ReadonlyArray<CalculatedProductivityMetric>として、拠点全体集計の生産性指標の配列が返される。配列の要素数は0より大きい
    expect(Array.isArray(result.calculatedProductivityMetrics)).toBe(true);
    expect(result.calculatedProductivityMetrics.length).toBeGreaterThan(0);
    result.calculatedProductivityMetrics.forEach((metric) => {
      expect(metric.workerId).toBeDefined();
      expect(metric.aggregationDate).toBeDefined();
      expect(typeof metric.plannedWorkHours).toBe('number');
      expect(typeof metric.actualWorkHours).toBe('number');
      expect(typeof metric.completedItemCount).toBe('number');
      expect(metric.productivityRate).toBeGreaterThanOrEqual(0);
      expect(metric.productivityRate).toBeLessThanOrEqual(1);
      expect(metric.qualityScore).toBeGreaterThanOrEqual(0);
      expect(metric.qualityScore).toBeLessThanOrEqual(1);
      expect(typeof metric.errorCount).toBe('number');
      expect(metric.proficiencyLevel).toBeDefined();
    });

    // 10. persistedProductivityDataIds：ReadonlyArray<string>として、永続化されたデータIDの配列が返される。配列の要素数は0より大きい
    expect(Array.isArray(result.persistedProductivityDataIds)).toBe(true);
    expect(result.persistedProductivityDataIds.length).toBeGreaterThan(0);
    result.persistedProductivityDataIds.forEach((id) => {
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    // 11. aggregationCompletedTimestamp：ISO 8601形式のタイムスタンプが返される
    expect(result.aggregationCompletedTimestamp).toBeDefined();
    expect(typeof result.aggregationCompletedTimestamp).toBe('string');
    expect(() => new Date(result.aggregationCompletedTimestamp)).not.toThrow();

    // 12. auditLogId：監査ログIDが返される
    expect(result.auditLogId).toBe('audit-log-id-001');

    // 13. エラーは発生しない
    expect(result).not.toHaveProperty('error');
  });
});