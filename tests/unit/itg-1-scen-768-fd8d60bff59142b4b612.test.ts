import { saveAllocationPlan } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';

describe('SCEN-768: 予想工数がチーム定員人数と配置期間から計算される最大工数を超える場合、InvalidWorkHoursエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should throw InvalidWorkHours error when estimatedWorkHours exceeds maximum calculated hours', async () => {
    // 入力データの準備
    const input = {
      allocationPlanId: null,
      planName: '拠点A_チームB_2024-01-15_追加配置案',
      facilityId: 'FAC001',
      teamId: 'TEAM001',
      workInstructionId: 'WI001',
      allocationStartDate: '2024-01-15',
      allocationEndDate: '2024-01-20',
      estimatedWorkHours: 600,
      estimatedCompletionDate: '2024-01-20',
      status: '提案中' as const,
      description: null,
      createdBy: 'USER001',
      updatedBy: null,
    };

    // スタブgetFacilityByIdを設定する
    jest.spyOn(dataPersistence, 'getFacilityById').mockResolvedValue({
      facilityId: 'FAC001',
      facilityName: 'テスト拠点',
      facilityCode: 'FAC001',
      address: 'テスト住所',
      maxCapacity: 50,
      currentCapacity: 20,
      operatingStatus: 'active',
      responsiblePersonName: '責任者',
      contactInfo: '09012345678',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'ADMIN',
      updatedBy: null,
    });

    // スタブgetTeamByIdを設定する（チーム定員人数=10）
    jest.spyOn(dataPersistence, 'getTeamById').mockResolvedValue({
      teamId: 'TEAM001',
      teamName: 'テストチーム',
      facilityId: 'FAC001',
      teamLeaderId: 'LEADER001',
      teamDescription: null,
      operatingStatus: 'active',
      capacity: 10,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'ADMIN',
      updatedBy: null,
    });

    // スタブgetWorkInstructionByIdを設定する
    jest.spyOn(dataPersistence, 'getWorkInstructionById').mockResolvedValue({
      workInstructionId: 'WI001',
      facilityId: 'FAC001',
      teamId: 'TEAM001',
      workInstructionNumber: 'WI001',
      workName: 'テスト作業',
      workDescription: null,
      plannedStartDateTime: '2024-01-15T08:00:00Z',
      plannedEndDateTime: '2024-01-20T17:00:00Z',
      actualStartDateTime: null,
      actualEndDateTime: null,
      progressStatus: '未開始',
      progressRate: 0,
      requiredWorkerCount: 5,
      priority: '中',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'ADMIN',
      updatedBy: null,
    });

    // スタブvalidateDateTimeRangeを設定する
    jest.spyOn(dataPersistence, 'validateDateTimeRange' as any).mockResolvedValue(true);

    // 営業日数計算ロジック
    // 2024-01-15（月）から2024-01-20（土）まで
    // 営業日：1月15日月、16日火、17日水、18日木、19日金、20日土 = 6営業日（仕様に基づく）
    // チーム定員10人 × 稼働時間8時間/日 × 6営業日 = 480時間が最大工数

    // スタブvalidateNumericQuantityを設定する
    // estimatedWorkHours=600 > 最大工数480なので、バリデーション失敗
    jest.spyOn(dataPersistence, 'validateNumericQuantity' as any).mockImplementation((value: number, min: number, max: number) => {
      if (value > max) {
        const error = new Error('予想工数が不正です。0より大きく、チームの定員人数と配置期間から計算される最大工数以下である必要があります。');
        (error as any).name = 'InvalidWorkHours';
        throw error;
      }
      return true;
    });

    // saveAllocationPlanを呼び出し、エラーが発生することを確認
    try {
      await saveAllocationPlan(input);
      fail('Expected InvalidWorkHours error to be thrown');
    } catch (error: any) {
      // エラーの内容を検証
      expect(error.name).toBe('InvalidWorkHours');
      expect(error.message).toBe(
        '予想工数が不正です。0より大きく、チームの定員人数と配置期間から計算される最大工数以下である必要があります。'
      );
    }
  });
});