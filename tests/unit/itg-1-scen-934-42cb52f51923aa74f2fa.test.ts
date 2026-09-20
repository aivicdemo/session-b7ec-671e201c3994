import { saveProductivityData, SaveProductivityDataInput } from '../../src/logic/data-persistence';

describe('SCEN-934: SaveProductivityData - Invalid Required Fields Error', () => {
  describe('when required field workResultId is null', () => {
    it('should throw InvalidProductivityDataInput error', async () => {
      const input: SaveProductivityDataInput = {
        productivityDataId: undefined,
        workResultId: null as any,
        workerId: 'worker-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        workDate: '2024-01-15',
        plannedWorkTime: 480,
        actualWorkTime: 450,
        completedItemCount: 100,
        productivityRate: 93.75,
        qualityScore: 95,
        errorCount: 2,
        proficiencyLevel: 'intermediate',
        createdBy: 'user-001',
      };

      await expect(saveProductivityData(input)).rejects.toThrow('InvalidProductivityDataInput');
      await expect(saveProductivityData(input)).rejects.toThrow(
        '生産性データの入力値が不正です。必須フィールドを確認してください。'
      );
    });
  });

  describe('when required field workerId is undefined', () => {
    it('should throw InvalidProductivityDataInput error', async () => {
      const input: SaveProductivityDataInput = {
        productivityDataId: undefined,
        workResultId: 'result-001',
        workerId: undefined as any,
        facilityId: 'facility-001',
        teamId: 'team-001',
        workDate: '2024-01-15',
        plannedWorkTime: 480,
        actualWorkTime: 450,
        completedItemCount: 100,
        productivityRate: 93.75,
        qualityScore: 95,
        errorCount: 2,
        proficiencyLevel: 'intermediate',
        createdBy: 'user-001',
      };

      await expect(saveProductivityData(input)).rejects.toThrow('InvalidProductivityDataInput');
      await expect(saveProductivityData(input)).rejects.toThrow(
        '生産性データの入力値が不正です。必須フィールドを確認してください。'
      );
    });
  });

  describe('when required field facilityId is empty string', () => {
    it('should throw InvalidProductivityDataInput error', async () => {
      const input: SaveProductivityDataInput = {
        productivityDataId: undefined,
        workResultId: 'result-001',
        workerId: 'worker-001',
        facilityId: '',
        teamId: 'team-001',
        workDate: '2024-01-15',
        plannedWorkTime: 480,
        actualWorkTime: 450,
        completedItemCount: 100,
        productivityRate: 93.75,
        qualityScore: 95,
        errorCount: 2,
        proficiencyLevel: 'intermediate',
        createdBy: 'user-001',
      };

      await expect(saveProductivityData(input)).rejects.toThrow('InvalidProductivityDataInput');
      await expect(saveProductivityData(input)).rejects.toThrow(
        '生産性データの入力値が不正です。必須フィールドを確認してください。'
      );
    });
  });

  describe('when required field teamId is null', () => {
    it('should throw InvalidProductivityDataInput error', async () => {
      const input: SaveProductivityDataInput = {
        productivityDataId: undefined,
        workResultId: 'result-001',
        workerId: 'worker-001',
        facilityId: 'facility-001',
        teamId: null as any,
        workDate: '2024-01-15',
        plannedWorkTime: 480,
        actualWorkTime: 450,
        completedItemCount: 100,
        productivityRate: 93.75,
        qualityScore: 95,
        errorCount: 2,
        proficiencyLevel: 'intermediate',
        createdBy: 'user-001',
      };

      await expect(saveProductivityData(input)).rejects.toThrow('InvalidProductivityDataInput');
      await expect(saveProductivityData(input)).rejects.toThrow(
        '生産性データの入力値が不正です。必須フィールドを確認してください。'
      );
    });
  });

  describe('when required field workDate has invalid ISO 8601 format', () => {
    it('should throw InvalidProductivityDataInput error', async () => {
      const input: SaveProductivityDataInput = {
        productivityDataId: undefined,
        workResultId: 'result-001',
        workerId: 'worker-001',
        facilityId: 'facility-001',
        teamId: 'team-001',
        workDate: '2024-13-45',
        plannedWorkTime: 480,
        actualWorkTime: 450,
        completedItemCount: 100,
        productivityRate: 93.75,
        qualityScore: 95,
        errorCount: 2,
        proficiencyLevel: 'intermediate',
        createdBy: 'user-001',
      };

      await expect(saveProductivityData(input)).rejects.toThrow('InvalidProductivityDataInput');
      await expect(saveProductivityData(input)).rejects.toThrow(
        '生産性データの入力値が不正です。必須フィールドを確認してください。'
      );
    });
  });
});