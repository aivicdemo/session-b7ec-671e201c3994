import { calculateAllocationFeasibilityScore, validateReferentialIntegrity, validateNumericQuantity, judgeProficiencyLevel, calculateWorkHours, calculateWeightedScore } from '../../src/logic/validation-common-calculation';

describe('SCEN-492: calculateAllocationFeasibilityScore with custom weight factors', () => {
  it('should calculate feasibility score using custom weight factors for staffing, proficiency, and working hours', async () => {
    const input = {
      allocationPlanId: 'plan-custom-weights-001',
      facilityId: 'fac-tokyo-01',
      teamId: 'team-a',
      workInstructionId: 'wi-20240115-001',
      allocatedWorkerIds: ['worker-01', 'worker-02', 'worker-03'],
      requiredWorkerCount: 3,
      maxFacilityCapacity: 50,
      currentFacilityOccupancy: 10,
      planStartDateTime: '2024-01-15T08:00:00Z',
      planEndDateTime: '2024-01-15T17:00:00Z',
      workerProficiencyData: [
        {
          workerId: 'worker-01',
          proficiencyLevel: 'ADVANCED' as const,
          jobType: 'picking',
        },
        {
          workerId: 'worker-02',
          proficiencyLevel: 'INTERMEDIATE' as const,
          jobType: 'picking',
        },
        {
          workerId: 'worker-03',
          proficiencyLevel: 'BEGINNER' as const,
          jobType: 'picking',
        },
      ],
      workerMaxWorkingHours: [
        { workerId: 'worker-01', maxHours: 8 },
        { workerId: 'worker-02', maxHours: 8 },
        { workerId: 'worker-03', maxHours: 8 },
      ],
      plannedWorkHours: 24,
      requiredProficiencyLevel: 'INTERMEDIATE' as const,
      staffingWeightFactor: 0.5,
      proficiencyWeightFactor: 0.3,
      workingHoursWeightFactor: 0.2,
      timeZone: 'Asia/Tokyo',
    };

    // Step: validateReferentialIntegrity を呼び出し、入力データの参照整合性が正常に検証されることを確認する
    const referentialIntegrityInput = {
      facilityId: input.facilityId,
      teamId: input.teamId,
      workInstructionId: input.workInstructionId,
      workerId: undefined,
      allocationPlanId: input.allocationPlanId,
      proficiencyId: undefined,
      expectedRelationships: [
        {
          sourceField: 'allocationPlanId',
          targetField: 'workInstructionId',
          sourceValue: input.allocationPlanId,
          targetValue: input.workInstructionId,
        },
      ],
      requireAllReferences: false,
    };

    const referentialIntegrityResult = await validateReferentialIntegrity(referentialIntegrityInput);
    expect(referentialIntegrityResult.isValid).toBe(true);
    expect(referentialIntegrityResult.violatedRules).toEqual([]);

    // Step: validateNumericQuantity を呼び出し、人員数・稼働時間・拠点容量の数値制約が正常に検証されることを確認する
    const staffingValidationResult = await validateNumericQuantity({
      value: input.allocatedWorkerIds.length,
      minValue: 1,
      maxValue: input.maxFacilityCapacity - input.currentFacilityOccupancy,
      allowNegative: false,
      fieldName: 'allocatedWorkerCount',
    });
    expect(staffingValidationResult.isValid).toBe(true);

    const workHoursValidationResult = await validateNumericQuantity({
      value: input.plannedWorkHours,
      minValue: 0,
      maxValue: input.allocatedWorkerIds.length * 8,
      allowNegative: false,
      fieldName: 'plannedWorkHours',
    });
    expect(workHoursValidationResult.isValid).toBe(true);

    const capacityValidationResult = await validateNumericQuantity({
      value: input.currentFacilityOccupancy + input.allocatedWorkerIds.length,
      minValue: 0,
      maxValue: input.maxFacilityCapacity,
      allowNegative: false,
      fieldName: 'facilityOccupancy',
    });
    expect(capacityValidationResult.isValid).toBe(true);

    // Step: judgeProficiencyLevel を呼び出し、各作業者の習熟度レベルが要求される最低習熟度レベル（INTERMEDIATE）に対して評価される
    const proficiencyEvaluationResults = await Promise.all(
      input.workerProficiencyData.map((worker) =>
        judgeProficiencyLevel({
          workerId: worker.workerId,
          jobType: worker.jobType,
          evaluationDateTime: input.planStartDateTime,
          pastProductivityRecords: [
            {
              workDate: '2024-01-14',
              productivityRate: worker.proficiencyLevel === 'ADVANCED' ? 100 : worker.proficiencyLevel === 'INTERMEDIATE' ? 80 : 60,
              qualityScore: worker.proficiencyLevel === 'ADVANCED' ? 95 : worker.proficiencyLevel === 'INTERMEDIATE' ? 85 : 70,
            },
          ],
          lookbackDays: 90,
          timeZone: input.timeZone,
        })
      )
    );

    proficiencyEvaluationResults.forEach((result) => {
      expect(result).toBeDefined();
      expect(result.proficiencyLevel).toBeDefined();
    });

    // Step: calculateWorkHours を呼び出し、配置期間内の各作業者の稼働時間適合度が計算される
    const workHoursResult = await calculateWorkHours({
      startDateTime: input.planStartDateTime,
      endDateTime: input.planEndDateTime,
      businessHoursStart: '08:00',
      businessHoursEnd: '17:00',
      breakStartTime: '12:00',
      breakEndTime: '13:00',
      applyBreakAdjustment: true,
      applyBusinessHoursAdjustment: true,
      timeZone: input.timeZone,
      allowPastDateTime: false,
    });

    expect(workHoursResult).toBeDefined();
    const totalAvailableHours = workHoursResult;

    // Step: calculateWeightedScore を呼び出す際に、重み付け係数がパラメータとして渡される
    const staffingScore = 100; // 3人必要、3人配置
    const proficiencyScore = 66.67; // ADVANCED 1名・INTERMEDIATE 1名・BEGINNER 1名
    const workingHoursScore = 100; // 計画作業時間24時間 ≤ 最大稼働時間24時間

    const weightedScoreResult = await calculateWeightedScore({
      scoreIndicators: [staffingScore, proficiencyScore, workingHoursScore],
      weights: [
        input.staffingWeightFactor,
        input.proficiencyWeightFactor,
        input.workingHoursWeightFactor,
      ],
      normalizeWeights: true,
      minScore: 0,
      maxScore: 100,
      decimalPlaces: 2,
    });

    expect(weightedScoreResult).toBeDefined();
    // Verify the weighted calculation: (100 × 0.5) + (66.67 × 0.3) + (100 × 0.2) = 90.001
    const expectedScore = (staffingScore * input.staffingWeightFactor) +
                         (proficiencyScore * input.proficiencyWeightFactor) +
                         (workingHoursScore * input.workingHoursWeightFactor);
    expect(weightedScoreResult).toBeCloseTo(expectedScore, 1);

    // Step: 最終スコアが返される
    const result = await calculateAllocationFeasibilityScore(input);

    expect(result).toBeDefined();
    expect(result.allocationPlanId).toBe('plan-custom-weights-001');
    expect(result.feasibilityScore).toBeGreaterThanOrEqual(0);
    expect(result.feasibilityScore).toBeLessThanOrEqual(100);

    // 期待される計算: (100 × 0.5) + (66.67 × 0.3) + (100 × 0.2) = 90.001
    expect(result.feasibilityScore).toBeCloseTo(90.0, 1);

    // カスタム係数が適用されたことを検証
    expect(result.feasibilityScore).toBeGreaterThan(89);
    expect(result.feasibilityScore).toBeLessThan(91);
  });
});