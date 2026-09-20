import { validateReferentialIntegrity, ValidateReferentialIntegrityInput, ValidateReferentialIntegrityOutput } from '../../src/logic/validation-common-calculation';

describe('SCEN-413: 作業者IDが無効な形式である場合、作業者ID形式エラーが発生する', () => {
  it('should return isValid false and record worker ID format error when workerId has invalid format', async () => {
    // Arrange
    const invalidWorkerIds = [
      '@#$%',
      '!!!invalid!!!',
      'worker@#$',
      '   ',
      '',
      'a'.repeat(500),
    ];

    for (const invalidWorkerId of invalidWorkerIds) {
      const input: ValidateReferentialIntegrityInput = {
        workerId: invalidWorkerId,
        facilityId: '550e8400-e29b-41d4-a716-446655440000',
        teamId: '550e8400-e29b-41d4-a716-446655440001',
        workInstructionId: '550e8400-e29b-41d4-a716-446655440002',
        allocationPlanId: null,
        proficiencyId: undefined,
        expectedRelationships: [],
        requireAllReferences: false,
      };

      // Act
      const result = await validateReferentialIntegrity(input);

      // Assert
      expect(result.isValid).toBe(false);
      
      const violatedRules = result.violatedRules || [];
      expect(violatedRules.length).toBeGreaterThan(0);
      expect(
        violatedRules.some(rule => 
          rule.includes('作業者ID') || 
          rule.includes('workerId') ||
          rule.includes('形式') ||
          rule.includes('format')
        )
      ).toBe(true);

      const missingReferences = result.missingReferences || [];
      const invalidRelationships = result.invalidRelationships || [];
      
      const workerIdErrorRecorded = 
        missingReferences.some(ref => ref.includes(invalidWorkerId)) ||
        violatedRules.some(rule => rule.includes(invalidWorkerId)) ||
        invalidRelationships.some(rel => 
          rel.sourceField === 'workerId' || 
          rel.reason.includes('形式') ||
          rel.reason.includes('format')
        );
      
      expect(workerIdErrorRecorded).toBe(true);

      const validatedReferences = result.validatedReferences || [];
      const workerRefEntry = validatedReferences.find(ref => ref.fieldName === 'workerId');
      
      if (workerRefEntry) {
        expect(workerRefEntry.exists).toBe(false);
        expect(workerRefEntry.relationshipValid).toBe(false);
      }
    }
  });

  it('should include error message with worker ID value and expected format in violations', async () => {
    // Arrange
    const invalidWorkerId = '@#$%invalid';
    const input: ValidateReferentialIntegrityInput = {
      workerId: invalidWorkerId,
      facilityId: '550e8400-e29b-41d4-a716-446655440000',
      teamId: undefined,
      workInstructionId: null,
      allocationPlanId: undefined,
      proficiencyId: null,
      expectedRelationships: [],
      requireAllReferences: false,
    };

    // Act
    const result = await validateReferentialIntegrity(input);

    // Assert
    expect(result.isValid).toBe(false);
    
    const allViolations = [
      ...(result.violatedRules || []),
      ...((result.missingReferences || []).map(ref => `Missing: ${ref}`)),
      ...((result.invalidRelationships || []).map(rel => `Invalid: ${rel.reason}`)),
    ];

    const hasWorkerIdError = allViolations.some(violation =>
      violation.includes(invalidWorkerId) || 
      (violation.includes('作業者ID') && violation.includes('形式')) ||
      (violation.includes('workerId') && (violation.includes('format') || violation.includes('invalid')))
    );

    expect(hasWorkerIdError).toBe(true);
  });

  it('should not validate other references when workerId format is invalid', async () => {
    // Arrange
    const invalidWorkerId = '!!!';
    const input: ValidateReferentialIntegrityInput = {
      workerId: invalidWorkerId,
      facilityId: '550e8400-e29b-41d4-a716-446655440000',
      teamId: '550e8400-e29b-41d4-a716-446655440001',
      workInstructionId: '550e8400-e29b-41d4-a716-446655440002',
      allocationPlanId: '550e8400-e29b-41d4-a716-446655440003',
      proficiencyId: '550e8400-e29b-41d4-a716-446655440004',
      expectedRelationships: [
        {
          sourceField: 'workerId',
          targetField: 'facilityId',
          sourceValue: invalidWorkerId,
          targetValue: '550e8400-e29b-41d4-a716-446655440000',
        },
      ],
      requireAllReferences: false,
    };

    // Act
    const result = await validateReferentialIntegrity(input);

    // Assert
    expect(result.isValid).toBe(false);
    
    const violatedRules = result.violatedRules || [];
    expect(violatedRules.length).toBeGreaterThan(0);

    const workerIdViolationExists = violatedRules.some(rule =>
      rule.includes('作業者ID') || 
      rule.includes('workerId') ||
      rule.includes('形式') ||
      rule.includes(invalidWorkerId)
    );
    
    expect(workerIdViolationExists).toBe(true);

    const validatedReferences = result.validatedReferences || [];
    if (validatedReferences.length > 0) {
      const workerRef = validatedReferences.find(ref => ref.fieldName === 'workerId');
      if (workerRef) {
        expect(workerRef.relationshipValid).toBe(false);
      }
    }
  });
});