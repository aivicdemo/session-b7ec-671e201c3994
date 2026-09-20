import { saveDelayRiskJudgment, SaveDelayRiskJudgmentInput } from '../../src/logic/data-persistence';

describe('SCEN-971: 進捗遅延リスク判定結果の新規保存時にsavedAtが現在時刻のISO 8601形式である', () => {
  it('saveDelayRiskJudgmentで新規作成時、savedAtは呼び出し時点のシステム時刻をISO 8601形式で返す', async () => {
    // Arrange: システム時刻を固定値に設定
    const fixedSystemTime = new Date('2025-01-15T15:00:00.000Z');
    const originalNow = Date.now;
    jest.spyOn(global, 'Date').mockImplementation(
      ((target: typeof Date) => {
        function MockDate(...args: any[]): any {
          if (args.length === 0) {
            return new target(fixedSystemTime);
          }
          return new target(...args);
        }
        Object.assign(MockDate, target);
        MockDate.now = () => fixedSystemTime.getTime();
        return MockDate;
      })(Date)
    );

    const input: SaveDelayRiskJudgmentInput = {
      riskJudgmentId: null,
      workInstructionId: 'WI-001',
      facilityId: 'FAC-001',
      teamId: 'TEAM-001',
      judgmentDateTime: '2025-01-15T14:30:00Z',
      riskLevel: 'HIGH',
      delayPredictionDays: 3,
      progressRate: 45,
      plannedProgressRate: 60,
      judgmentReason: '人員不足',
      recommendedAction: '人員追加',
      createdBy: 'USER-001',
    };

    // Act: saveDelayRiskJudgment処理を実行
    const output = await saveDelayRiskJudgment(input);

    // Assert: savedAtがISO 8601形式で現在時刻を返していることを確認
    expect(output.savedAt).toBeDefined();
    
    // ISO 8601形式の正規表現パターン
    const iso8601Pattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})$/;
    expect(output.savedAt).toMatch(iso8601Pattern);

    // 返された時刻が設定されたシステム時刻と一致することを確認（秒単位）
    const savedAtDate = new Date(output.savedAt);
    expect(savedAtDate.getUTCFullYear()).toBe(fixedSystemTime.getUTCFullYear());
    expect(savedAtDate.getUTCMonth()).toBe(fixedSystemTime.getUTCMonth());
    expect(savedAtDate.getUTCDate()).toBe(fixedSystemTime.getUTCDate());
    expect(savedAtDate.getUTCHours()).toBe(fixedSystemTime.getUTCHours());
    expect(savedAtDate.getUTCMinutes()).toBe(fixedSystemTime.getUTCMinutes());
    expect(savedAtDate.getUTCSeconds()).toBe(fixedSystemTime.getUTCSeconds());

    // isNewRecordがtrueであることを確認
    expect(output.isNewRecord).toBe(true);

    // その他の戻り値フィールドを確認
    expect(output.riskJudgmentId).toBeDefined();
    expect(output.workInstructionId).toBe('WI-001');
    expect(output.facilityId).toBe('FAC-001');
    expect(output.teamId).toBe('TEAM-001');
    expect(output.riskLevel).toBe('HIGH');
    expect(output.delayPredictionDays).toBe(3);
    expect(output.recommendedAction).toBe('人員追加');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
});