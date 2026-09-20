import { validateReferentialIntegrity } from '../../src/logic/validation-common-calculation';

describe('SCEN-414: 作業指示IDが無効な形式である場合、作業指示ID形式エラーが発生する', () => {
  it('無効な形式の作業指示IDでInvalidWorkInstructionIdErrorをスローする', () => {
    const invalidFormats = [
      'invalid@format#',
      '!@#$%',
      'test space',
      '***',
      '',
    ];

    invalidFormats.forEach((invalidWorkInstructionId) => {
      const input = {
        facilityId: null,
        teamId: null,
        workerId: null,
        workInstructionId: invalidWorkInstructionId,
        allocationPlanId: null,
        proficiencyId: null,
      };

      expect(() => {
        validateReferentialIntegrity(input);
      }).toThrow();

      try {
        validateReferentialIntegrity(input);
      } catch (error: unknown) {
        const err = error as Error;
        expect(err.constructor.name).toBe('InvalidWorkInstructionIdError');
        expect(err.message).toContain(`作業指示ID '${invalidWorkInstructionId}' の形式が不正です`);
        expect(err.message).toContain('期待される形式');
      }
    });
  });

  it('無効な形式の作業指示IDで他のフィールドが有効な場合でもエラーをスローする', () => {
    const input = {
      facilityId: '550e8400-e29b-41d4-a716-446655440000',
      teamId: '550e8400-e29b-41d4-a716-446655440001',
      workerId: '550e8400-e29b-41d4-a716-446655440002',
      workInstructionId: '@invalid',
      allocationPlanId: null,
      proficiencyId: null,
    };

    expect(() => {
      validateReferentialIntegrity(input);
    }).toThrow();

    try {
      validateReferentialIntegrity(input);
    } catch (error: unknown) {
      const err = error as Error;
      expect(err.constructor.name).toBe('InvalidWorkInstructionIdError');
      expect(err.message).toContain(`作業指示ID '@invalid' の形式が不正です`);
      expect(err.message).toContain('期待される形式');
    }
  });
});