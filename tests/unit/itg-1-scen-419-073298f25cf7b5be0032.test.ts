import { validateReferentialIntegrity, ValidateReferentialIntegrityInput } from '../../src/logic/validation-common-calculation';

describe('SCEN-419: 参照関係が循環している場合、循環参照エラーが発生する', () => {
  it('should detect circular references and return ValidateReferentialIntegrityOutput with violation details', () => {
    const input: ValidateReferentialIntegrityInput = {
      workInstructionId: 'WI-001',
      facilityId: 'FAC-001',
      teamId: 'TEAM-001',
      workerId: 'WKR-001',
      expectedRelationships: [
        {
          sourceField: 'workInstructionId',
          targetField: 'workInstructionId',
          sourceValue: 'WI-001',
          targetValue: 'WI-001',
        },
        {
          sourceField: 'teamId',
          targetField: 'facilityId',
          sourceValue: 'TEAM-001',
          targetValue: 'FAC-001',
        },
        {
          sourceField: 'facilityId',
          targetField: 'teamId',
          sourceValue: 'FAC-001',
          targetValue: 'TEAM-001',
        },
      ],
      requireAllReferences: true,
    };

    let thrownError: Error | null = null;
    let result = null;

    try {
      result = validateReferentialIntegrity(input);
    } catch (e) {
      thrownError = e as Error;
    }

    // エラーが発生することを確認
    expect(thrownError).not.toBeNull();
    if (thrownError) {
      expect(thrownError.message).toContain('循環参照が検出されました：');
    }

    // 関数が ValidateReferentialIntegrityOutput を返す場合、その構造を検証
    if (result) {
      expect(result.isValid).toBe(false);
      expect(Array.isArray(result.violatedRules)).toBe(true);
      expect(result.violatedRules.length).toBeGreaterThan(0);
      expect(result.violatedRules.some((rule: string) => rule.includes('循環参照'))).toBe(true);
      
      expect(Array.isArray(result.invalidRelationships)).toBe(true);
      expect(result.invalidRelationships.length).toBeGreaterThanOrEqual(2);

      // 直接循環参照（workInstructionId → workInstructionId）の検証
      const directCircular = result.invalidRelationships.find(
        (rel: { sourceField: string; targetField: string; reason: string }) =>
          rel.sourceField === 'workInstructionId' &&
          rel.targetField === 'workInstructionId'
      );
      expect(directCircular).toBeDefined();
      if (directCircular) {
        expect(directCircular.reason).toContain('循環参照が検出されました：');
        expect(directCircular.reason).toContain('workInstructionId(WI-001)');
      }

      // 間接循環参照（teamId → facilityId → teamId）の検証
      const indirectCircular = result.invalidRelationships.find(
        (rel: { sourceField: string; targetField: string; reason: string }) =>
          rel.sourceField === 'teamId' &&
          rel.targetField === 'facilityId'
      );
      expect(indirectCircular).toBeDefined();
      if (indirectCircular) {
        expect(indirectCircular.reason).toContain('循環参照が検出されました：');
        expect(indirectCircular.reason).toContain('teamId(TEAM-001)');
        expect(indirectCircular.reason).toContain('facilityId(FAC-001)');
      }
    }
  });
});