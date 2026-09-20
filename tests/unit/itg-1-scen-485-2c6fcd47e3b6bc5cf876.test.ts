import {
  calculateAllocationFeasibilityScore,
  validateReferentialIntegrity,
  validateNumericQuantity,
  calculateWorkHours,
  calculateWeightedScore,
} from '../../src/logic/validation-common-calculation';

describe('SCEN-485: 人員配置案の実現可能性スコア算出', () => {
  it('代表的な正常入力で、人員数・習熟度・稼働時間の3つの制約を加味した0～100の実現可能性スコアが算出される', () => {
    const input = {
      allocationPlanId: 'PLAN-001',
      facilityId: 'FAC-001',
      teamId: 'TEAM-001',
      workInstructionId: 'WI-001',
      allocatedWorkerIds: ['W001', 'W002', 'W003'],
      requiredWorkerCount: 3,
      maxFacilityCapacity: 50,
      currentFacilityOccupancy: 20,
      planStartDateTime: '2025-01-15T08:00:00',
      planEndDateTime: '2025-01-15T17:00:00',
      workerProficiencyData: [
        { workerId: 'W001', proficiencyLevel: 'ADVANCED' as const, jobType: 'ASSEMBLY' },
        { workerId: 'W002', proficiencyLevel: 'INTERMEDIATE' as const, jobType: 'ASSEMBLY' },
        { workerId: 'W003', proficiencyLevel: 'ADVANCED' as const, jobType: 'ASSEMBLY' },
      ],
      workerMaxWorkingHours: [
        { workerId: 'W001', maxHours: 8 },
        { workerId: 'W002', maxHours: 8 },
        { workerId: 'W003', maxHours: 8 },
      ],
      plannedWorkHours: 24,
      requiredProficiencyLevel: 'INTERMEDIATE' as const,
      staffingWeightFactor: 0.4,
      proficiencyWeightFactor: 0.35,
      workingHoursWeightFactor: 0.25,
      timeZone: 'Asia/Tokyo',
    };

    // 必須フィールドと参照整合性の検証
    const referentialIntegrityResult = validateReferentialIntegrity({
      facilityId: input.facilityId,
      teamId: input.teamId,
      workInstructionId: input.workInstructionId,
      allocationPlanId: input.allocationPlanId,
    });
    expect(referentialIntegrityResult.isValid).toBe(true);
    expect(referentialIntegrityResult.violatedRules).toEqual([]);

    // 数値入力の妥当性確認
    const requiredWorkerCountValidation = validateNumericQuantity({
      value: input.requiredWorkerCount,
      minValue: 1,
      maxValue: 100,
      allowNegative: false,
      fieldName: 'requiredWorkerCount',
    });
    expect(requiredWorkerCountValidation.isValid).toBe(true);

    const maxFacilityCapacityValidation = validateNumericQuantity({
      value: input.maxFacilityCapacity,
      minValue: 1,
      fieldName: 'maxFacilityCapacity',
    });
    expect(maxFacilityCapacityValidation.isValid).toBe(true);

    const currentFacilityOccupancyValidation = validateNumericQuantity({
      value: input.currentFacilityOccupancy,
      minValue: 0,
      maxValue: input.maxFacilityCapacity,
      fieldName: 'currentFacilityOccupancy',
    });
    expect(currentFacilityOccupancyValidation.isValid).toBe(true);

    const plannedWorkHoursValidation = validateNumericQuantity({
      value: input.plannedWorkHours,
      minValue: 0,
      fieldName: 'plannedWorkHours',
    });
    expect(plannedWorkHoursValidation.isValid).toBe(true);

    for (const workerHour of input.workerMaxWorkingHours) {
      const maxHoursValidation = validateNumericQuantity({
        value: workerHour.maxHours,
        minValue: 0,
        fieldName: `maxHours for ${workerHour.workerId}`,
      });
      expect(maxHoursValidation.isValid).toBe(true);
    }

    // 各作業者の習熟度レベル検証
    for (const workerProficiency of input.workerProficiencyData) {
      const proficiencyValidation = validateNumericQuantity({
        value: workerProficiency.proficiencyLevel === 'ADVANCED' ? 3 : 2,
        minValue: 2, // INTERMEDIATE = 2
        fieldName: `proficiencyLevel for ${workerProficiency.workerId}`,
      });
      expect(proficiencyValidation.isValid).toBe(true);
    }

    // 配置期間内の稼働時間検証
    const workHoursResult = calculateWorkHours({
      startDateTime: input.planStartDateTime,
      endDateTime: input.planEndDateTime,
      businessHoursStart: '08:00',
      businessHoursEnd: '18:00',
      breakStartTime: '12:00',
      breakEndTime: '13:00',
      applyBreakAdjustment: true,
      applyBusinessHoursAdjustment: true,
      timeZone: input.timeZone,
    });
    expect(workHoursResult.durationMinutes).toBeGreaterThan(0);

    // 人員充足度の検証
    const allocatedCount = input.allocatedWorkerIds.length;
    expect(allocatedCount).toBe(input.requiredWorkerCount);
    const availableCapacity = input.maxFacilityCapacity - input.currentFacilityOccupancy;
    expect(availableCapacity).toBeGreaterThanOrEqual(allocatedCount);

    // 中間スコアの計算検証
    // 人員充足度スコア = 100（配置人員数3人が要求数3人と一致、収容可能人員超過なし）
    const staffingScore = 100;

    // 習熟度適合度スコア = 90（ADVANCED2人とINTERMEDIATE1人の平均）
    const proficiencyScore = 90;

    // 稼働時間適合度スコア = 100（配置人員の合計稼働時間24時間が計画作業時間24時間と一致）
    const workingHoursScore = 100;

    // 加重平均スコア = (100×0.4) + (90×0.35) + (100×0.25) = 96.5
    const expectedWeightedScore = calculateWeightedScore({
      scoreIndicators: [staffingScore, proficiencyScore, workingHoursScore],
      weights: [input.staffingWeightFactor, input.proficiencyWeightFactor, input.workingHoursWeightFactor],
      normalizeWeights: false,
      minScore: 0,
      maxScore: 100,
      decimalPlaces: 2,
    });
    expect(expectedWeightedScore.isValid).toBe(true);
    expect(expectedWeightedScore.normalizedValue).toBeGreaterThanOrEqual(96);
    expect(expectedWeightedScore.normalizedValue).toBeLessThanOrEqual(97);

    // 実現可能性スコア算出
    const result = calculateAllocationFeasibilityScore(input);

    // 戻り値が 0 以上 100 以下の数値であることを確認
    expect(result).toBeDefined();
    expect(typeof result).toBe('number');
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);

    // 代表的な正常入力の場合、スコアは 65 以上 100 以下であることを確認
    expect(result).toBeGreaterThanOrEqual(65);
    expect(result).toBeLessThanOrEqual(100);

    // 具体的な計算結果の検証（96～97の範囲を想定）
    expect(result).toBeGreaterThanOrEqual(96);
    expect(result).toBeLessThanOrEqual(97);
  });
});