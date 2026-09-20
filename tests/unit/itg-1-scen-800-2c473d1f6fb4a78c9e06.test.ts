import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { listAllocationPlansByCondition, saveAllocationPlan } from '../../src/logic/data-persistence';
import type {
  ListAllocationPlansByConditionInput,
  ListAllocationPlansByConditionOutput,
  SaveAllocationPlanInput,
  SaveAllocationPlanOutput,
} from '../../src/logic/data-persistence';

describe('SCEN-800: 複数のステータスを指定した場合にいずれかに合致する配置案を取得できる', () => {
  let allocationPlanAId: string;
  let allocationPlanBId: string;
  let allocationPlanCId: string;
  let allocationPlanDId: string;

  const testFacilityId = 'test-facility-001';
  const testTeamId = 'test-team-001';
  const testWorkInstructionId = 'test-work-instruction-001';
  const testUserId = 'test-user-001';

  beforeAll(async () => {
    // テスト前提条件：データベースに配置案データを作成
    const planAInput: SaveAllocationPlanInput = {
      allocationPlanId: null,
      planName: 'Allocation Plan A',
      facilityId: testFacilityId,
      teamId: testTeamId,
      workInstructionId: testWorkInstructionId,
      allocationStartDate: '2025-01-01',
      allocationEndDate: '2025-01-05',
      estimatedWorkHours: 40,
      estimatedCompletionDate: '2025-01-05',
      status: '提案中',
      description: 'Test allocation plan A',
      createdBy: testUserId,
    };

    const planBInput: SaveAllocationPlanInput = {
      allocationPlanId: null,
      planName: 'Allocation Plan B',
      facilityId: testFacilityId,
      teamId: testTeamId,
      workInstructionId: testWorkInstructionId,
      allocationStartDate: '2025-01-05',
      allocationEndDate: '2025-01-10',
      estimatedWorkHours: 50,
      estimatedCompletionDate: '2025-01-10',
      status: '承認済み',
      description: 'Test allocation plan B',
      createdBy: testUserId,
    };

    const planCInput: SaveAllocationPlanInput = {
      allocationPlanId: null,
      planName: 'Allocation Plan C',
      facilityId: testFacilityId,
      teamId: testTeamId,
      workInstructionId: testWorkInstructionId,
      allocationStartDate: '2025-01-10',
      allocationEndDate: '2025-01-15',
      estimatedWorkHours: 60,
      estimatedCompletionDate: '2025-01-15',
      status: '実行中',
      description: 'Test allocation plan C',
      createdBy: testUserId,
    };

    const planDInput: SaveAllocationPlanInput = {
      allocationPlanId: null,
      planName: 'Allocation Plan D',
      facilityId: testFacilityId,
      teamId: testTeamId,
      workInstructionId: testWorkInstructionId,
      allocationStartDate: '2025-01-15',
      allocationEndDate: '2025-01-20',
      estimatedWorkHours: 45,
      estimatedCompletionDate: '2025-01-20',
      status: '提案中',
      description: 'Test allocation plan D',
      createdBy: testUserId,
    };

    // 各配置案を保存
    const resultA = await saveAllocationPlan(planAInput);
    expect(resultA).toBeDefined();
    expect(resultA.allocationPlanId).toBeTruthy();
    allocationPlanAId = resultA.allocationPlanId;

    const resultB = await saveAllocationPlan(planBInput);
    expect(resultB).toBeDefined();
    expect(resultB.allocationPlanId).toBeTruthy();
    allocationPlanBId = resultB.allocationPlanId;

    const resultC = await saveAllocationPlan(planCInput);
    expect(resultC).toBeDefined();
    expect(resultC.allocationPlanId).toBeTruthy();
    allocationPlanCId = resultC.allocationPlanId;

    const resultD = await saveAllocationPlan(planDInput);
    expect(resultD).toBeDefined();
    expect(resultD.allocationPlanId).toBeTruthy();
    allocationPlanDId = resultD.allocationPlanId;
  });

  afterAll(async () => {
    // テスト後片付け：作成したデータを削除
    // 必要に応じて削除処理を実装
  });

  it('複数のステータス条件で配置案を検索し、合致するレコードのみを取得できる', async () => {
    // listAllocationPlansByCondition処理を呼び出し
    const input: ListAllocationPlansByConditionInput = {
      statuses: ['提案中', '承認済み'],
      pageNumber: 1,
      pageSize: 10,
      sortBy: 'allocationStartDate',
      sortOrder: 'ASC',
    };

    const output = await listAllocationPlansByCondition(input);

    // 出力値の検証
    // (1) allocationPlans配列の長さが3であることを確認
    expect(output.allocationPlans).toHaveLength(3);

    // (2) allocationPlans[0]のstatusが'提案中'であることを確認
    expect(output.allocationPlans[0].status).toBe('提案中');
    expect(output.allocationPlans[0].allocationStartDate).toBe('2025-01-01');

    // (3) allocationPlans[1]のstatusが'承認済み'であることを確認
    expect(output.allocationPlans[1].status).toBe('承認済み');
    expect(output.allocationPlans[1].allocationStartDate).toBe('2025-01-05');

    // (4) allocationPlans[2]のstatusが'提案中'であることを確認
    expect(output.allocationPlans[2].status).toBe('提案中');
    expect(output.allocationPlans[2].allocationStartDate).toBe('2025-01-15');

    // (5) allocationPlans配列がsortBy='allocationStartDate'、sortOrder='ASC'で昇順にソートされていることを確認
    const startDates = output.allocationPlans.map((plan) => new Date(plan.allocationStartDate).getTime());
    for (let i = 0; i < startDates.length - 1; i++) {
      expect(startDates[i]).toBeLessThanOrEqual(startDates[i + 1]);
    }

    // (6) totalCount=3であることを確認
    expect(output.totalCount).toBe(3);

    // (7) pageNumber=1、pageSize=10であることを確認
    expect(output.pageNumber).toBe(1);
    expect(output.pageSize).toBe(10);

    // (8) retrievedAtがISO 8601形式のタイムスタンプであることを確認
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(output.retrievedAt).toMatch(iso8601Regex);
  });
});