import { saveAllocationExecutionStatus } from '../../src/logic/data-persistence';

describe('作業進捗・人員配置最適化エンジン - SCEN-813', () => {
  describe('必須フィールドが欠けている場合、InvalidAllocationExecutionStatusInput エラーが発生する', () => {
    it('allocationPlanId が null の場合、エラーが発生すること', async () => {
      const input = {
        allocationPlanId: null,
        workInstructionId: 'wi-001',
        workerId: 'w-001',
        facilityId: 'f-001',
        teamId: 't-001',
        allocationState: 'active',
        plannedStartDateTime: '2024-01-15T09:00:00Z',
        plannedEndDateTime: '2024-01-15T17:00:00Z',
        plannedWorkHours: 8,
        progressRate: 50,
        delayFlag: false,
        createdBy: 'user-001',
      };

      await expect(saveAllocationExecutionStatus(input)).rejects.toThrow(
        expect.objectContaining({
          name: 'InvalidAllocationExecutionStatusInput',
          message: '人員配置実行状況の入力データが不正です。必須フィールドと日時・数値の妥当性を確認してください。',
        })
      );
    });

    it('workInstructionId が null の場合、エラーが発生すること', async () => {
      const input = {
        allocationPlanId: 'ap-001',
        workInstructionId: null,
        workerId: 'w-001',
        facilityId: 'f-001',
        teamId: 't-001',
        allocationState: 'active',
        plannedStartDateTime: '2024-01-15T09:00:00Z',
        plannedEndDateTime: '2024-01-15T17:00:00Z',
        plannedWorkHours: 8,
        progressRate: 50,
        delayFlag: false,
        createdBy: 'user-001',
      };

      await expect(saveAllocationExecutionStatus(input)).rejects.toThrow(
        expect.objectContaining({
          name: 'InvalidAllocationExecutionStatusInput',
          message: '人員配置実行状況の入力データが不正です。必須フィールドと日時・数値の妥当性を確認してください。',
        })
      );
    });

    it('workerId が null の場合、エラーが発生すること', async () => {
      const input = {
        allocationPlanId: 'ap-001',
        workInstructionId: 'wi-001',
        workerId: null,
        facilityId: 'f-001',
        teamId: 't-001',
        allocationState: 'active',
        plannedStartDateTime: '2024-01-15T09:00:00Z',
        plannedEndDateTime: '2024-01-15T17:00:00Z',
        plannedWorkHours: 8,
        progressRate: 50,
        delayFlag: false,
        createdBy: 'user-001',
      };

      await expect(saveAllocationExecutionStatus(input)).rejects.toThrow(
        expect.objectContaining({
          name: 'InvalidAllocationExecutionStatusInput',
          message: '人員配置実行状況の入力データが不正です。必須フィールドと日時・数値の妥当性を確認してください。',
        })
      );
    });

    it('facilityId が null の場合、エラーが発生すること', async () => {
      const input = {
        allocationPlanId: 'ap-001',
        workInstructionId: 'wi-001',
        workerId: 'w-001',
        facilityId: null,
        teamId: 't-001',
        allocationState: 'active',
        plannedStartDateTime: '2024-01-15T09:00:00Z',
        plannedEndDateTime: '2024-01-15T17:00:00Z',
        plannedWorkHours: 8,
        progressRate: 50,
        delayFlag: false,
        createdBy: 'user-001',
      };

      await expect(saveAllocationExecutionStatus(input)).rejects.toThrow(
        expect.objectContaining({
          name: 'InvalidAllocationExecutionStatusInput',
          message: '人員配置実行状況の入力データが不正です。必須フィールドと日時・数値の妥当性を確認してください。',
        })
      );
    });

    it('teamId が null の場合、エラーが発生すること', async () => {
      const input = {
        allocationPlanId: 'ap-001',
        workInstructionId: 'wi-001',
        workerId: 'w-001',
        facilityId: 'f-001',
        teamId: null,
        allocationState: 'active',
        plannedStartDateTime: '2024-01-15T09:00:00Z',
        plannedEndDateTime: '2024-01-15T17:00:00Z',
        plannedWorkHours: 8,
        progressRate: 50,
        delayFlag: false,
        createdBy: 'user-001',
      };

      await expect(saveAllocationExecutionStatus(input)).rejects.toThrow(
        expect.objectContaining({
          name: 'InvalidAllocationExecutionStatusInput',
          message: '人員配置実行状況の入力データが不正です。必須フィールドと日時・数値の妥当性を確認してください。',
        })
      );
    });

    it('allocationState が null の場合、エラーが発生すること', async () => {
      const input = {
        allocationPlanId: 'ap-001',
        workInstructionId: 'wi-001',
        workerId: 'w-001',
        facilityId: 'f-001',
        teamId: 't-001',
        allocationState: null,
        plannedStartDateTime: '2024-01-15T09:00:00Z',
        plannedEndDateTime: '2024-01-15T17:00:00Z',
        plannedWorkHours: 8,
        progressRate: 50,
        delayFlag: false,
        createdBy: 'user-001',
      };

      await expect(saveAllocationExecutionStatus(input)).rejects.toThrow(
        expect.objectContaining({
          name: 'InvalidAllocationExecutionStatusInput',
          message: '人員配置実行状況の入力データが不正です。必須フィールドと日時・数値の妥当性を確認してください。',
        })
      );
    });

    it('plannedStartDateTime が null の場合、エラーが発生すること', async () => {
      const input = {
        allocationPlanId: 'ap-001',
        workInstructionId: 'wi-001',
        workerId: 'w-001',
        facilityId: 'f-001',
        teamId: 't-001',
        allocationState: 'active',
        plannedStartDateTime: null,
        plannedEndDateTime: '2024-01-15T17:00:00Z',
        plannedWorkHours: 8,
        progressRate: 50,
        delayFlag: false,
        createdBy: 'user-001',
      };

      await expect(saveAllocationExecutionStatus(input)).rejects.toThrow(
        expect.objectContaining({
          name: 'InvalidAllocationExecutionStatusInput',
          message: '人員配置実行状況の入力データが不正です。必須フィールドと日時・数値の妥当性を確認してください。',
        })
      );
    });

    it('plannedEndDateTime が null の場合、エラーが発生すること', async () => {
      const input = {
        allocationPlanId: 'ap-001',
        workInstructionId: 'wi-001',
        workerId: 'w-001',
        facilityId: 'f-001',
        teamId: 't-001',
        allocationState: 'active',
        plannedStartDateTime: '2024-01-15T09:00:00Z',
        plannedEndDateTime: null,
        plannedWorkHours: 8,
        progressRate: 50,
        delayFlag: false,
        createdBy: 'user-001',
      };

      await expect(saveAllocationExecutionStatus(input)).rejects.toThrow(
        expect.objectContaining({
          name: 'InvalidAllocationExecutionStatusInput',
          message: '人員配置実行状況の入力データが不正です。必須フィールドと日時・数値の妥当性を確認してください。',
        })
      );
    });

    it('plannedWorkHours が null の場合、エラーが発生すること', async () => {
      const input = {
        allocationPlanId: 'ap-001',
        workInstructionId: 'wi-001',
        workerId: 'w-001',
        facilityId: 'f-001',
        teamId: 't-001',
        allocationState: 'active',
        plannedStartDateTime: '2024-01-15T09:00:00Z',
        plannedEndDateTime: '2024-01-15T17:00:00Z',
        plannedWorkHours: null,
        progressRate: 50,
        delayFlag: false,
        createdBy: 'user-001',
      };

      await expect(saveAllocationExecutionStatus(input)).rejects.toThrow(
        expect.objectContaining({
          name: 'InvalidAllocationExecutionStatusInput',
          message: '人員配置実行状況の入力データが不正です。必須フィールドと日時・数値の妥当性を確認してください。',
        })
      );
    });

    it('progressRate が null の場合、エラーが発生すること', async () => {
      const input = {
        allocationPlanId: 'ap-001',
        workInstructionId: 'wi-001',
        workerId: 'w-001',
        facilityId: 'f-001',
        teamId: 't-001',
        allocationState: 'active',
        plannedStartDateTime: '2024-01-15T09:00:00Z',
        plannedEndDateTime: '2024-01-15T17:00:00Z',
        plannedWorkHours: 8,
        progressRate: null,
        delayFlag: false,
        createdBy: 'user-001',
      };

      await expect(saveAllocationExecutionStatus(input)).rejects.toThrow(
        expect.objectContaining({
          name: 'InvalidAllocationExecutionStatusInput',
          message: '人員配置実行状況の入力データが不正です。必須フィールドと日時・数値の妥当性を確認してください。',
        })
      );
    });

    it('delayFlag が null の場合、エラーが発生すること', async () => {
      const input = {
        allocationPlanId: 'ap-001',
        workInstructionId: 'wi-001',
        workerId: 'w-001',
        facilityId: 'f-001',
        teamId: 't-001',
        allocationState: 'active',
        plannedStartDateTime: '2024-01-15T09:00:00Z',
        plannedEndDateTime: '2024-01-15T17:00:00Z',
        plannedWorkHours: 8,
        progressRate: 50,
        delayFlag: null,
        createdBy: 'user-001',
      };

      await expect(saveAllocationExecutionStatus(input)).rejects.toThrow(
        expect.objectContaining({
          name: 'InvalidAllocationExecutionStatusInput',
          message: '人員配置実行状況の入力データが不正です。必須フィールドと日時・数値の妥当性を確認してください。',
        })
      );
    });

    it('createdBy が null の場合、エラーが発生すること', async () => {
      const input = {
        allocationPlanId: 'ap-001',
        workInstructionId: 'wi-001',
        workerId: 'w-001',
        facilityId: 'f-001',
        teamId: 't-001',
        allocationState: 'active',
        plannedStartDateTime: '2024-01-15T09:00:00Z',
        plannedEndDateTime: '2024-01-15T17:00:00Z',
        plannedWorkHours: 8,
        progressRate: 50,
        delayFlag: false,
        createdBy: null,
      };

      await expect(saveAllocationExecutionStatus(input)).rejects.toThrow(
        expect.objectContaining({
          name: 'InvalidAllocationExecutionStatusInput',
          message: '人員配置実行状況の入力データが不正です。必須フィールドと日時・数値の妥当性を確認してください。',
        })
      );
    });
  });
});