import { validateReferentialIntegrity } from '../../src/logic/validation-common-calculation';

describe('SCEN-418: 業務ルール上必須の参照フィールドが未指定で、すべての参照フィールド必須フラグが有効な場合、必須参照フィールドエラーが発生する', () => {
  test('すべての参照フィールドがnullで、requireAllReferencesがtrueの場合、必須参照フィールドエラーが発生する', () => {
    // Arrange
    const input = {
      facilityId: null,
      teamId: null,
      workerId: null,
      workInstructionId: null,
      allocationPlanId: null,
      proficiencyId: null,
      expectedRelationships: [],
      requireAllReferences: true,
    };

    // Act
    const result = validateReferentialIntegrity(input);

    // Assert
    expect(result.isValid).toBe(false);
    expect(result.violatedRules).toContain(expect.stringMatching(/必須の参照フィールド.*が指定されていません/));
    expect(result.violatedRules.length).toBeGreaterThan(0);
    expect(result.missingReferences.length).toBeGreaterThan(0);
  });
});