import { monitorAndJudgeDelayRisk, MonitorAndJudgeDelayRiskInput } from '../../src/logic/progress-monitoring-risk-engine';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

describe('SCEN-1564: 配置人員数がゼロの拠点について、エラーメッセージがスローされる', () => {
  let mockDatabaseQuery: jest.Mock;
  let mockDatabaseSave: jest.Mock;

  beforeEach(() => {
    // テストデータの準備：facility-001は配置人員数0、他の拠点は正常値
    const facilityData = {
      'facility-001': {
        facilityId: 'facility-001',
        facilityName: 'Test Facility 001',
        currentStaffCount: 0, // 配置人員数がゼロ
        maxStaffCount: 10,
        operatingStatus: 'active',
      },
      'facility-002': {
        facilityId: 'facility-002',
        facilityName: 'Test Facility 002',
        currentStaffCount: 5, // 他の拠点は正常値
        maxStaffCount: 10,
        operatingStatus: 'active',
      },
    };

    const progressData = {
      'facility-001': {
        facilityId: 'facility-001',
        remainingWorkQuantity: 100,
        currentProgress: 30,
        plannedProgress: 50,
        workInstructions: [],
      },
      'facility-002': {
        facilityId: 'facility-002',
        remainingWorkQuantity: 100,
        currentProgress: 50,
        plannedProgress: 50,
        workInstructions: [],
      },
    };

    const productivityData = {
      'facility-001': {
        facilityId: 'facility-001',
        averageProductivityRate: 80,
        qualityScore: 85,
      },
      'facility-002': {
        facilityId: 'facility-002',
        averageProductivityRate: 85,
        qualityScore: 88,
      },
    };

    // モック化：データベースクエリとデータ取得
    mockDatabaseQuery = jest.fn().mockImplementation((query: string, params?: unknown[]) => {
      if (query.includes('facility')) {
        const facilityId = (params?.[0] as string) || 'facility-001';
        return Promise.resolve([facilityData[facilityId as keyof typeof facilityData]]);
      }
      if (query.includes('progress')) {
        const facilityId = (params?.[0] as string) || 'facility-001';
        return Promise.resolve([progressData[facilityId as keyof typeof progressData]]);
      }
      if (query.includes('productivity')) {
        const facilityId = (params?.[0] as string) || 'facility-001';
        return Promise.resolve([productivityData[facilityId as keyof typeof productivityData]]);
      }
      return Promise.resolve([]);
    });

    mockDatabaseSave = jest.fn().mockResolvedValue({ id: 'result-123' });

    // グローバルモックに登録
    (global as any).__MOCK_DB_QUERY__ = mockDatabaseQuery;
    (global as any).__MOCK_DB_SAVE__ = mockDatabaseSave;
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete (global as any).__MOCK_DB_QUERY__;
    delete (global as any).__MOCK_DB_SAVE__;
  });

  it('配置人員数がゼロの拠点に対してmonitorAndJudgeDelayRiskを呼び出すとエラーがスローされ、その後の処理は実行されない', async () => {
    const input: MonitorAndJudgeDelayRiskInput = {
      facilityIds: ['facility-001'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2024-01-15T10:30:00Z',
      userId: 'user-123',
    };

    let errorThrown: Error | null = null;

    try {
      await monitorAndJudgeDelayRisk(input);
    } catch (err) {
      errorThrown = err as Error;
    }

    // エラーがスローされていることを確認
    expect(errorThrown).not.toBeNull();
    expect(errorThrown).toBeInstanceOf(Error);

    // エラーメッセージが仕様に定義されたものであることを確認
    expect(errorThrown!.message).toContain('配置人員がいない拠点は評価できません');

    // その後の処理（判定結果の保存）が実行されていないことを確認
    // エラーが発生した場合、結果保存処理は呼ばれない
    expect(mockDatabaseSave).not.toHaveBeenCalled();

    // エラーが拠点facility-001の評価プロセス内で発生したことを確認
    // エラーメッセージに拠点識別子または拠点評価に関する情報が含まれることを確認
    expect(
      errorThrown!.message.includes('facility-001') || errorThrown!.message.includes('配置人員がいない拠点'),
    ).toBe(true);

    // テストデータ確認：facility-001の配置人員数が0であることが検出可能であることを確認
    mockDatabaseQuery('SELECT * FROM facility WHERE id = ?', ['facility-001']).then((result) => {
      expect(result[0]).toBeDefined();
      expect(result[0].currentStaffCount).toBe(0);
    });
  });

  it('複数拠点が入力された場合、facility-001でエラーが発生した後、他の拠点の処理が継続されない', async () => {
    const input: MonitorAndJudgeDelayRiskInput = {
      facilityIds: ['facility-001', 'facility-002'],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime: '2024-01-15T10:30:00Z',
      userId: 'user-123',
    };

    let errorThrown: Error | null = null;

    try {
      await monitorAndJudgeDelayRisk(input);
    } catch (err) {
      errorThrown = err as Error;
    }

    // facility-001でエラーが発生していることを確認
    expect(errorThrown).not.toBeNull();
    expect(errorThrown!.message).toContain('配置人員がいない拠点は評価できません');

    // データベース保存処理が呼ばれていないことを確認
    // これにより、facility-001でのエラーがプロセスを中断させ、他の拠点の結果保存も実行されていないことが確認できる
    expect(mockDatabaseSave).not.toHaveBeenCalled();
  });
});