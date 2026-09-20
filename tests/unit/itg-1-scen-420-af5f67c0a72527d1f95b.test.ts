import { validateReferentialIntegrity } from '../../src/logic/validation-common-calculation';

describe('SCEN-420: 参照整合性検証 - 不正な参照関係が検出される', () => {
  it('期待される参照関係が指定されたが、実際の参照値が期待値と異なる場合、不正な参照関係の詳細が結果に含まれる', () => {
    // Arrange
    const input = {
      facilityId: 'FAC-001',
      teamId: 'TEAM-A',
      workerId: 'WRK-123',
      workInstructionId: 'WI-456',
      allocationPlanId: 'AP-789',
      proficiencyId: 'PROF-HIGH',
      expectedRelationships: [
        {
          sourceField: 'workerId',
          targetField: 'teamId',
          sourceValue: 'WRK-123',
          targetValue: 'TEAM-A',
        },
        {
          sourceField: 'teamId',
          targetField: 'facilityId',
          sourceValue: 'TEAM-A',
          targetValue: 'FAC-001',
        },
        {
          sourceField: 'workInstructionId',
          targetField: 'facilityId',
          sourceValue: 'WI-456',
          targetValue: 'FAC-999',
        },
      ],
      requireAllReferences: false,
    };

    // Act
    const result = validateReferentialIntegrity(input);

    // Assert
    expect(result.isValid).toBe(false);
    expect(result.validatedReferences).toBeDefined();
    expect(Array.isArray(result.validatedReferences)).toBe(true);

    const wiToFacilityRelation = result.validatedReferences.find(
      (ref) => ref.fieldName === 'workInstructionId'
    );
    expect(wiToFacilityRelation).toBeDefined();
    expect(wiToFacilityRelation?.relationshipValid).toBe(false);

    expect(result.violatedRules).toBeDefined();
    expect(Array.isArray(result.violatedRules)).toBe(true);
    expect(result.violatedRules.length).toBeGreaterThan(0);

    expect(result.invalidRelationships).toBeDefined();
    expect(Array.isArray(result.invalidRelationships)).toBe(true);
    expect(result.invalidRelationships.length).toBeGreaterThan(0);

    const invalidRel = result.invalidRelationships.find(
      (rel) => rel.sourceField === 'workInstructionId' && rel.targetField === 'facilityId'
    );
    expect(invalidRel).toBeDefined();
    expect(invalidRel?.reason).toContain('WI-456');
    expect(invalidRel?.reason).toContain('FAC-001');
    expect(invalidRel?.reason).toContain('FAC-999');

    expect(result.missingReferences).toBeDefined();
    expect(Array.isArray(result.missingReferences)).toBe(true);
    expect(result.missingReferences).toContain('FAC-999');
  });
});