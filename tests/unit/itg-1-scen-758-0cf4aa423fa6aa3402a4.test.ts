import { saveAllocationPlan } from '../../src/logic/data-persistence';
import type { SaveAllocationPlanInput, SaveAllocationPlanOutput } from '../../src/logic/data-persistence';

describe('SCEN-758: 人員配置案の新規作成と永続化', () => {
  it('新規作成時に必須フィールドがすべて正しい形式で入力された場合、新しい配置案IDが採番されて保存され、出力に新規作成フラグがtrueで返される', async () => {
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
      createdBy: 'USER001',
      description: 'テスト配置案',
    };

    const result = await saveAllocationPlan(input);

    expect(result).toBeDefined();
    expect(result.allocationPlanId).toBeTruthy();
    expect(typeof result.allocationPlanId).toBe('string');
    expect(result.allocationPlanId).not.toBeNull();
    expect(result.allocationPlanId).not.toBeUndefined();
    
    expect(result.planName).toBe('拠点A_チームB_2024-01-15_追加配置案');
    expect(result.facilityId).toBe('FAC001');
    expect(result.teamId).toBe('TEAM001');
    expect(result.workInstructionId).toBe('WI001');
    expect(result.status).toBe('提案中');
    
    expect(result.isNewRecord).toBe(true);
    
    expect(result.savedAt).toBeTruthy();
    expect(typeof result.savedAt).toBe('string');
    const savedAtDate = new Date(result.savedAt);
    expect(savedAtDate.getTime()).toBeGreaterThan(0);
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.savedAt)).toBe(true);
  });
});