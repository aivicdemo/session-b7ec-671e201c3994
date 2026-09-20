import { saveAllocationPlan, getAllocationPlanById } from '../../src/logic/data-persistence';

describe('SCEN-776: 既存レコード更新時に、updatedByが指定されて保存される', () => {
  const mockFacilityId = 'FAC-001';
  const mockTeamId = 'TEAM-001';
  const mockWorkInstructionId = 'WI-001';
  const mockAllocationPlanId = 'APL-001';
  const mockUserId1 = 'user001';
  const mockUserId2 = 'user002';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should save allocation plan with updatedBy field when updating existing record', async () => {
    // 事前条件：既存の人員配置案レコードをデータベースに作成
    const existingAllocationPlan = {
      allocationPlanId: mockAllocationPlanId,
      planName: '拠点A_チームB_2024-01-15_初期案',
      facilityId: mockFacilityId,
      teamId: mockTeamId,
      workInstructionId: mockWorkInstructionId,
      allocationStartDate: '2024-01-15',
      allocationEndDate: '2024-01-20',
      estimatedWorkHours: 40,
      estimatedCompletionDate: '2024-01-20',
      status: '提案中',
      description: undefined,
      createdBy: mockUserId1,
      updatedBy: null,
    };

    // 既存レコードを事前作成
    await saveAllocationPlan(existingAllocationPlan);

    // 手順2：updateInputを準備して saveAllocationPlan を呼び出す
    const updateInput = {
      allocationPlanId: mockAllocationPlanId,
      planName: '拠点A_チームB_2024-01-15_最適化案',
      facilityId: mockFacilityId,
      teamId: mockTeamId,
      workInstructionId: mockWorkInstructionId,
      allocationStartDate: '2024-01-15',
      allocationEndDate: '2024-01-20',
      estimatedWorkHours: 45,
      estimatedCompletionDate: '2024-01-20',
      status: '承認待ち',
      description: '工数を40時間から45時間に増加',
      createdBy: mockUserId1,
      updatedBy: mockUserId2,
    };

    const result = await saveAllocationPlan(updateInput);

    // 期待結果：saveAllocationPlan の戻り値を検証
    expect(result).toBeDefined();
    expect(result.allocationPlanId).toBe(mockAllocationPlanId);
    expect(result.planName).toBe('拠点A_チームB_2024-01-15_最適化案');
    expect(result.facilityId).toBe(mockFacilityId);
    expect(result.teamId).toBe(mockTeamId);
    expect(result.workInstructionId).toBe(mockWorkInstructionId);
    expect(result.status).toBe('承認待ち');
    expect(result.isNewRecord).toBe(false);
    expect(result.savedAt).toBeDefined();

    const savedAtDate = new Date(result.savedAt);
    expect(savedAtDate.getTime()).toBeLessThanOrEqual(Date.now());
    expect(savedAtDate.getTime()).toBeGreaterThan(Date.now() - 5000);

    // 期待結果：データベースに再度問い合わせて、updatedByが'user002'で永続化されていることを確認
    const persistedRecord = await getAllocationPlanById({
      allocationPlanId: mockAllocationPlanId,
    });

    expect(persistedRecord).toBeDefined();
    expect(persistedRecord.allocationPlanId).toBe(mockAllocationPlanId);
    expect(persistedRecord.planName).toBe('拠点A_チームB_2024-01-15_最適化案');
    expect(persistedRecord.updatedBy).toBe(mockUserId2);
    expect(persistedRecord.status).toBe('承認待ち');
    expect(persistedRecord.estimatedWorkHours).toBe(45);
  });
});