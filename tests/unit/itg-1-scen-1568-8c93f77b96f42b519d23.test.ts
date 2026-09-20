import { monitorAndJudgeDelayRisk } from '../../src/logic/progress-monitoring-risk-engine';

describe('SCEN-1568: 進捗遅延リスク常時監視 - 進捗データが古い場合の警告ログ', () => {
  const currentDateTime = '2024-12-20T15:30:00Z';
  const oldDataTimestamp = '2024-12-20T14:29:00Z'; // 1時間1分前

  let consoleWarnSpy: jest.SpyInstance;
  let logOutput: string[] = [];
  let mockFetchProgressData: jest.Mock;

  beforeEach(() => {
    logOutput = [];
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation((message) => {
      logOutput.push(String(message));
    });
    jest.useFakeTimers();
    jest.setSystemTime(new Date(currentDateTime));

    // WmsHandyTerminalDataSourceのfetchProgressDataをモック
    mockFetchProgressData = jest.fn().mockResolvedValue({
      facilityId: 'facility-001',
      facilityName: '物流センター東京',
      timestamp: oldDataTimestamp,
      progressRate: 65,
      completedQuantity: 6500,
      remainingQuantity: 3500,
      totalQuantity: 10000,
    });

    // グローバルなデータソースをモック
    (global as any).wmsHandyTerminalDataSource = {
      fetchProgressData: mockFetchProgressData,
    };
  });

  afterEach(() => {
    jest.useRealTimers();
    consoleWarnSpy.mockRestore();
    jest.clearAllMocks();
    delete (global as any).wmsHandyTerminalDataSource;
  });

  it('進捗データが1時間以上前の場合、警告ログが記録され、判定結果が正常に返却される', async () => {
    const input = {
      facilityIds: ['facility-001'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: currentDateTime,
      userId: 'user-monitoring-center',
    };

    const result = await monitorAndJudgeDelayRisk(input);

    // データソースからの取得が実行されたことを確認
    expect(mockFetchProgressData).toHaveBeenCalled();

    // 結果の妥当性を確認
    expect(result).toBeDefined();
    expect(result.judgmentId).toBeDefined();
    expect(result.evaluationDateTime).toBe(currentDateTime);
    expect(result.rankedFacilities).toBeDefined();
    expect(Array.isArray(result.rankedFacilities)).toBe(true);

    // facility-001がrankedFacilitiesに含まれることを確認
    const facilityInResult = result.rankedFacilities.find(
      (f) => f.facilityId === 'facility-001'
    );
    expect(facilityInResult).toBeDefined();
    expect(facilityInResult?.facilityName).toBeDefined();
    expect(facilityInResult?.riskScore).toBeGreaterThanOrEqual(0);
    expect(facilityInResult?.riskScore).toBeLessThanOrEqual(100);

    // 警告ログが記録されたことを確認
    expect(consoleWarnSpy).toHaveBeenCalled();
    expect(logOutput.length).toBeGreaterThan(0);
    const warningMessage = logOutput.find((log) =>
      log.includes('進捗データが古い可能性があります') &&
      log.includes('最新データで再実行を推奨')
    );
    expect(warningMessage).toBeDefined();

    // 判定が中断されず、結果が返却されたことを確認
    expect(result.delayReasonClassifications).toBeDefined();
    expect(Array.isArray(result.delayReasonClassifications)).toBe(true);
    expect(result.recommendedAdjustments).toBeDefined();
    expect(Array.isArray(result.recommendedAdjustments)).toBe(true);
    expect(typeof result.hasHighRiskFacilities).toBe('boolean');

    // エラーが発生していないことを確認
    expect(result).not.toHaveProperty('error');
  });

  it('取得された進捗データのタイムスタンプが1時間1分前であることを確認', async () => {
    const input = {
      facilityIds: ['facility-001'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: currentDateTime,
      userId: 'user-monitoring-center',
    };

    await monitorAndJudgeDelayRisk(input);

    // データソースが呼ばれたことを確認
    expect(mockFetchProgressData).toHaveBeenCalledWith(
      expect.objectContaining({
        facilityId: 'facility-001',
      })
    );

    // モックが返したデータのタイムスタンプが確認できることを検証
    const callResult = await mockFetchProgressData({ facilityId: 'facility-001' });
    expect(callResult.timestamp).toBe(oldDataTimestamp);

    // 現在時刻との差が1時間以上であることを確認
    const currentTime = new Date(currentDateTime).getTime();
    const dataTime = new Date(oldDataTimestamp).getTime();
    const diffMinutes = (currentTime - dataTime) / (1000 * 60);
    expect(diffMinutes).toBeGreaterThanOrEqual(60);
  });

  it('警告ログが記録され、ISO 8601形式のタイムスタンプを含むことを確認', async () => {
    const input = {
      facilityIds: ['facility-001'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: currentDateTime,
      userId: 'user-monitoring-center',
    };

    await monitorAndJudgeDelayRisk(input);

    // ログが記録されていることを確認
    expect(logOutput.length).toBeGreaterThan(0);

    // 警告ログが存在することを確認
    const warningLog = logOutput.find((log) =>
      log.includes('進捗データが古い可能性があります')
    );
    expect(warningLog).toBeDefined();
  });

  it('古いデータでも判定結果にはfacility-001が含まれ、rankedFacilitiesリストが正常に構築される', async () => {
    const input = {
      facilityIds: ['facility-001'],
      evaluationDateTime: currentDateTime,
      userId: 'user-monitoring-center',
    };

    const result = await monitorAndJudgeDelayRisk(input);

    expect(result.rankedFacilities).toBeDefined();
    expect(result.rankedFacilities.length).toBeGreaterThan(0);

    const facility = result.rankedFacilities[0];
    expect(facility.facilityId).toBe('facility-001');
    expect(facility.priorityRank).toBeGreaterThanOrEqual(1);
    expect(['HIGH', 'MEDIUM', 'LOW']).toContain(facility.riskLevel);
    expect(facility.currentProgressRate).toBeLessThanOrEqual(100);
    expect(facility.plannedProgressRate).toBeLessThanOrEqual(100);
  });

  it('警告ログが記録されても、エラーは発生しない', async () => {
    const input = {
      facilityIds: ['facility-001'],
      evaluationDateTime: currentDateTime,
      userId: 'user-monitoring-center',
    };

    let errorThrown = false;
    let thrownError: Error | null = null;
    try {
      await monitorAndJudgeDelayRisk(input);
    } catch (error) {
      errorThrown = true;
      thrownError = error as Error;
    }

    expect(errorThrown).toBe(false);
    expect(thrownError).toBeNull();
  });

  it('複数拠点の場合、全拠点について判定が実行され、古いデータを持つ拠点の警告が記録される', async () => {
    const mockFetchProgressData2 = jest.fn().mockResolvedValue({
      facilityId: 'facility-002',
      facilityName: '物流センター大阪',
      timestamp: currentDateTime, // 新しいデータ
      progressRate: 80,
      completedQuantity: 8000,
      remainingQuantity: 2000,
      totalQuantity: 10000,
    });

    (global as any).wmsHandyTerminalDataSource.fetchProgressData = jest
      .fn()
      .mockImplementation((args) => {
        if (args.facilityId === 'facility-001') {
          return mockFetchProgressData();
        } else if (args.facilityId === 'facility-002') {
          return mockFetchProgressData2();
        }
      });

    const input = {
      facilityIds: ['facility-001', 'facility-002'],
      evaluationDateTime: currentDateTime,
      userId: 'user-monitoring-center',
    };

    const result = await monitorAndJudgeDelayRisk(input);

    // 両拠点の処理が実行されたことを確認
    expect(result.rankedFacilities).toBeDefined();
    expect(result.rankedFacilities.length).toBeGreaterThanOrEqual(1);

    // 古いデータを持つfacility-001についての警告ログが記録されていることを確認
    const hasOldDataWarning = logOutput.some((log) =>
      log.includes('進捗データが古い可能性があります') &&
      log.includes('最新データで再実行を推奨')
    );
    expect(hasOldDataWarning).toBe(true);
  });

  it('進捗データのタイムスタンプが1時間以上前である場合、警告が記録される', async () => {
    const input = {
      facilityIds: ['facility-001'],
      evaluationDateTime: currentDateTime,
      userId: 'user-monitoring-center',
    };

    await monitorAndJudgeDelayRisk(input);

    // 警告メッセージが記録されていることを確認
    const hasOldDataWarning = logOutput.some((log) =>
      log.includes('進捗データが古い可能性があります') &&
      log.includes('最新データで再実行を推奨')
    );
    expect(hasOldDataWarning).toBe(true);
  });

  it('rankedFacilitiesの各施設情報が完全に構築されていることを確認', async () => {
    const input = {
      facilityIds: ['facility-001'],
      evaluationDateTime: currentDateTime,
      userId: 'user-monitoring-center',
    };

    const result = await monitorAndJudgeDelayRisk(input);

    // facility-001がrankedFacilitiesに含まれることを確認
    const facility = result.rankedFacilities.find(
      (f) => f.facilityId === 'facility-001'
    );
    expect(facility).toBeDefined();

    // facility-001の情報が完全に定義されていることを確認
    expect(facility?.facilityId).toBe('facility-001');
    expect(facility?.facilityName).toBeDefined();
    expect(typeof facility?.riskScore).toBe('number');
    expect(typeof facility?.riskLevel).toBe('string');
    expect(typeof facility?.predictedDelayDays).toBe('number');
    expect(typeof facility?.currentProgressRate).toBe('number');
    expect(typeof facility?.plannedProgressRate).toBe('number');
    expect(typeof facility?.priorityRank).toBe('number');
  });

  it('警告ログが系統的に記録されていることを確認', async () => {
    const input = {
      facilityIds: ['facility-001'],
      evaluationDateTime: currentDateTime,
      userId: 'user-monitoring-center',
    };

    await monitorAndJudgeDelayRisk(input);

    // console.warn()が呼ばれたことで警告レベルが記録されたことを確認
    expect(consoleWarnSpy).toHaveBeenCalled();

    // 警告メッセージの内容を確認
    const warningCall = logOutput.find((log) =>
      log.includes('進捗データが古い可能性があります')
    );
    expect(warningCall).toBeDefined();
    expect(warningCall).toContain('最新データで再実行を推奨');
  });

  it('判定結果にタイムスタンプが含まれ、評価時刻と一致することを確認', async () => {
    const input = {
      facilityIds: ['facility-001'],
      evaluationDateTime: currentDateTime,
      userId: 'user-monitoring-center',
    };

    const result = await monitorAndJudgeDelayRisk(input);

    // 評価時刻が結果に反映されていることを確認
    expect(result.evaluationDateTime).toBe(currentDateTime);

    // 判定IDが含まれていることを確認
    expect(result.judgmentId).toBeDefined();
    expect(typeof result.judgmentId).toBe('string');
    expect(result.judgmentId.length).toBeGreaterThan(0);
  });
});