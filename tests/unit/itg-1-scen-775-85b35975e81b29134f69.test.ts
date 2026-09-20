import { saveAllocationPlan, SaveAllocationPlanInput, SaveAllocationPlanOutput } from '../../src/logic/data-persistence';

describe('SCEN-775: saveAllocationPlan with optional fields as null/undefined', () => {
  it('should successfully create a new allocation plan when allocationPlanId is null and optional fields are null/undefined', async () => {
    // Arrange
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
      createdBy: 'USER001',
      updatedBy: undefined,
    };

    // Act
    const result: SaveAllocationPlanOutput = await saveAllocationPlan(input);

    // Assert
    expect(result).toBeDefined();
    expect(result.allocationPlanId).toBeDefined();
    expect(typeof result.allocationPlanId).toBe('string');
    expect(result.allocationPlanId.length).toBeGreaterThan(0);
    expect(result.planName).toBe('拠点A_チームB_2024-01-15_追加配置案');
    expect(result.facilityId).toBe('FAC001');
    expect(result.teamId).toBe('TEAM001');
    expect(result.workInstructionId).toBe('WI001');
    expect(result.status).toBe('提案中');
    expect(result.savedAt).toBeDefined();
    expect(typeof result.savedAt).toBe('string');
    expect(result.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(result.isNewRecord).toBe(true);
  });
});