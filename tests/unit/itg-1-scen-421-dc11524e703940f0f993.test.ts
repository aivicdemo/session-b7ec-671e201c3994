import { validateReferentialIntegrity } from '../../src/logic/validation-common-calculation';

describe('SCEN-421: 参照整合性検証 - すべてnull/undefinedで必須フラグ無効', () => {
  it('入力値がすべてnull・undefinedで、すべての参照フィールド必須フラグが無効な場合、検証が成功して空の整合性結果を返す', async () => {
    const input = {
      facilityId: null,
      teamId: undefined,
      workerId: null,
      workInstructionId: undefined,
      allocationPlanId: null,
      proficiencyId: undefined,
      expectedRelationships: [],
      requireAllReferences: false,
    };

    const result = await validateReferentialIntegrity(input);

    expect(result.isValid).toBe(true);
    expect(result.validatedReferences).toEqual([]);
    expect(result.violatedRules).toEqual([]);
    expect(result.missingReferences).toEqual([]);
    expect(result.invalidRelationships).toEqual([]);
  });
});