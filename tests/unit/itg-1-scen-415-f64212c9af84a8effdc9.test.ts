import { validateReferentialIntegrity, ValidateReferentialIntegrityInput } from '../../src/logic/validation-common-calculation';

describe('SCEN-415: 人員配置案IDが無効な形式である場合、人員配置案ID形式エラーが発生する', () => {
  it('should throw InvalidAllocationPlanIdError when allocationPlanId has invalid format', async () => {
    const input: ValidateReferentialIntegrityInput = {
      allocationPlanId: 'invalid-format-@#$',
      facilityId: null,
      teamId: null,
      workerId: null,
      workInstructionId: null,
      proficiencyId: null,
    };

    try {
      const result = await validateReferentialIntegrity(input);
      fail('InvalidAllocationPlanIdError should be thrown, but no error was raised');
    } catch (error: any) {
      expect(error.name).toBe('InvalidAllocationPlanIdError');
      expect(error.message).toContain('人員配置案ID');
      expect(error.message).toContain("'invalid-format-@#$'");
      expect(error.message).toContain('形式が不正です');
      expect(error.message).toContain('期待される形式');
    }
  });

  it('should throw InvalidAllocationPlanIdError with invalid format using undefined for other fields', async () => {
    const input: ValidateReferentialIntegrityInput = {
      allocationPlanId: 'invalid-format-@#$',
      facilityId: undefined,
      teamId: undefined,
      workerId: undefined,
      workInstructionId: undefined,
      proficiencyId: undefined,
    };

    try {
      const result = await validateReferentialIntegrity(input);
      fail('InvalidAllocationPlanIdError should be thrown, but no error was raised');
    } catch (error: any) {
      expect(error.name).toBe('InvalidAllocationPlanIdError');
      expect(error.message).toContain('人員配置案ID');
      expect(error.message).toContain("'invalid-format-@#$'");
      expect(error.message).toContain('形式が不正です');
      expect(error.message).toContain('期待される形式');
    }
  });
});