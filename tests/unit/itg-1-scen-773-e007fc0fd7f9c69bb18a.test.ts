import { saveAllocationPlan, SaveAllocationPlanInput } from '../../src/logic/data-persistence';

describe('SCEN-773: UnauthorizedOperation when user lacks saveAllocationPlan permission', () => {
  it('should throw UnauthorizedOperation error when user does not have permission to save allocation plan', async () => {
    const input: SaveAllocationPlanInput = {
      allocationPlanId: null,
      planName: '拠点A_チームB_2024-01-15_追加配置案',
      facilityId: 'FAC001',
      teamId: 'TEAM001',
      workInstructionId: 'WI001',
      allocationStartDate: '2024-01-15',
      allocationEndDate: '2024-01-20',
      estimatedWorkHours: 40,
      estimatedCompletionDate: '2024-01-20',
      status: '提案中',
      description: null,
      createdBy: 'USER_NO_PERMISSION',
      updatedBy: null,
    };

    // saveAllocationPlanを呼び出す際、権限チェック機構が
    // createdByで指定されたユーザーUSER_NO_PERMISSIONに対して
    // 人員配置案の保存権限を確認し、権限がないことを返す
    // 結果として、UnauthorizedOperationエラーがスローされる
    let thrownError: any = null;

    try {
      await saveAllocationPlan(input);
      fail('Expected UnauthorizedOperation to be thrown');
    } catch (error: any) {
      thrownError = error;
    }

    // saveAllocationPlanは設計済みエラーUnauthorizedOperationをスロー（throw）する
    expect(thrownError).toBeDefined();
    expect(thrownError.name).toBe('UnauthorizedOperation');
    // エラーメッセージが『この操作を実行する権限がありません。』である
    expect(thrownError.message).toBe('この操作を実行する権限がありません。');

    // SaveAllocationPlanOutputは返されず、
    // データベースには新規レコードが作成されない
    // （エラーがスローされるため、データベース操作に到達しない）
  });
});