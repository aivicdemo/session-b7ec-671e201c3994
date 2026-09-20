import { validateReferentialIntegrity } from '../../src/logic/validation-common-calculation';

describe('SCEN-417: 参照IDの形式が期待される形式と異なる場合、参照形式エラーが発生する', () => {
  it('facilityId に形式が不正な値を指定した場合、InvalidFacilityIdError が発生する', () => {
    const invalidFacilityId = 'FAC@#$%';
    
    const input = {
      facilityId: invalidFacilityId,
      teamId: null,
      workerId: undefined,
      workInstructionId: undefined,
      allocationPlanId: undefined,
      proficiencyId: undefined,
      expectedRelationships: [],
      requireAllReferences: false,
    };

    expect(() => {
      validateReferentialIntegrity(input);
    }).toThrow();

    try {
      validateReferentialIntegrity(input);
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(error.message).toContain('拠点ID');
        expect(error.message).toContain('FAC@#$%');
        expect(error.message).toContain('形式が不正');
        expect(error.message).toContain('英数字とハイフン');
      }
    }
  });
});