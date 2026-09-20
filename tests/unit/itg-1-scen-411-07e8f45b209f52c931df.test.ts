import { validateReferentialIntegrity, ValidateReferentialIntegrityInput } from '../../src/logic/validation-common-calculation';

describe('SCEN-411: 拠点IDが無効な形式である場合、拠点ID形式エラーが発生する', () => {
  test('無効な形式の拠点IDを入力するとInvalidFacilityIdErrorが発生する', () => {
    const invalidFacilityId = 'INVALID#@!';
    const input: ValidateReferentialIntegrityInput = {
      facilityId: invalidFacilityId,
      teamId: undefined,
      workerId: undefined,
      workInstructionId: undefined,
      allocationPlanId: undefined,
      proficiencyId: undefined,
      expectedRelationships: [],
      requireAllReferences: false,
    };

    let thrownError: Error | undefined;
    try {
      validateReferentialIntegrity(input);
    } catch (error) {
      thrownError = error as Error;
    }

    expect(thrownError).toBeDefined();
    expect(thrownError?.constructor.name).toBe('InvalidFacilityIdError');
    
    const errorMessage = thrownError?.message || '';
    expect(errorMessage).toContain('拠点ID');
    expect(errorMessage).toContain(invalidFacilityId);
    expect(errorMessage).toContain('形式が不正です');
    expect(errorMessage).toContain('期待される形式');
    expect(errorMessage).toMatch(/英数字|ハイフン|UUID|uuid/);
  });
});