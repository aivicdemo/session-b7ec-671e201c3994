import { saveProgressData } from '../../src/logic/data-persistence';

describe('作業進捗・人員配置最適化エンジン - SCEN-884', () => {
  describe('完了率が省略された場合、実績数量を計画数量で除算して自動計算される', () => {
    it('completionRateが未定義の場合、完了率が自動計算される', async () => {
      // Arrange
      const input = {
        progressDataId: null,
        workInstructionId: 'WI-001',
        facilityId: 'FAC-001',
        teamId: 'TEAM-001',
        progressDate: '2024-01-15',
        plannedQuantity: 100,
        actualQuantity: 75,
        completionRate: undefined,
        delayFlag: false,
        remarks: undefined,
        createdBy: 'USER-001',
        updatedBy: undefined,
      };

      // Act
      const output = await saveProgressData(input);

      // Assert
      expect(output).toBeDefined();
      expect(output.progressDataId).toBeDefined();
      expect(typeof output.progressDataId).toBe('string');
      expect(output.progressDataId).toMatch(/^[a-zA-Z0-9\-]+$/);
      expect(output.workInstructionId).toBe('WI-001');
      expect(output.facilityId).toBe('FAC-001');
      expect(output.teamId).toBe('TEAM-001');
      expect(output.progressDate).toBe('2024-01-15');
      expect(output.actualQuantity).toBe(75);
      expect(output.completionRate).toBe(75);
      expect(output.delayFlag).toBe(false);
      expect(output.isNewRecord).toBe(true);
      expect(output.savedAt).toBeDefined();
      expect(output.savedAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
      );
    });

    it('completionRateがnullの場合、完了率が自動計算される', async () => {
      // Arrange
      const input = {
        progressDataId: null,
        workInstructionId: 'WI-002',
        facilityId: 'FAC-002',
        teamId: 'TEAM-002',
        progressDate: '2024-01-16',
        plannedQuantity: 200,
        actualQuantity: 150,
        completionRate: null as any,
        delayFlag: false,
        remarks: undefined,
        createdBy: 'USER-002',
        updatedBy: undefined,
      };

      // Act
      const output = await saveProgressData(input);

      // Assert
      expect(output.completionRate).toBe(75);
      expect(output.actualQuantity).toBe(150);
      expect(output.isNewRecord).toBe(true);
    });

    it('実績数量が計画数量を超過する場合、完了率は100を超える値で計算される', async () => {
      // Arrange
      const input = {
        progressDataId: null,
        workInstructionId: 'WI-003',
        facilityId: 'FAC-003',
        teamId: 'TEAM-003',
        progressDate: '2024-01-17',
        plannedQuantity: 100,
        actualQuantity: 125,
        completionRate: undefined,
        delayFlag: false,
        remarks: undefined,
        createdBy: 'USER-003',
        updatedBy: undefined,
      };

      // Act
      const output = await saveProgressData(input);

      // Assert
      expect(output.completionRate).toBe(125);
      expect(output.actualQuantity).toBe(125);
      expect(output.isNewRecord).toBe(true);
    });

    it('実績数量が計画数量の半分以下の場合、完了率は50以下で計算される', async () => {
      // Arrange
      const input = {
        progressDataId: null,
        workInstructionId: 'WI-004',
        facilityId: 'FAC-004',
        teamId: 'TEAM-004',
        progressDate: '2024-01-18',
        plannedQuantity: 100,
        actualQuantity: 45,
        completionRate: undefined,
        delayFlag: false,
        remarks: undefined,
        createdBy: 'USER-004',
        updatedBy: undefined,
      };

      // Act
      const output = await saveProgressData(input);

      // Assert
      expect(output.completionRate).toBe(45);
      expect(output.actualQuantity).toBe(45);
      expect(output.isNewRecord).toBe(true);
    });

    it('実績数量がゼロの場合、完了率は0で計算される', async () => {
      // Arrange
      const input = {
        progressDataId: null,
        workInstructionId: 'WI-005',
        facilityId: 'FAC-005',
        teamId: 'TEAM-005',
        progressDate: '2024-01-19',
        plannedQuantity: 100,
        actualQuantity: 0,
        completionRate: undefined,
        delayFlag: false,
        remarks: undefined,
        createdBy: 'USER-005',
        updatedBy: undefined,
      };

      // Act
      const output = await saveProgressData(input);

      // Assert
      expect(output.completionRate).toBe(0);
      expect(output.actualQuantity).toBe(0);
      expect(output.isNewRecord).toBe(true);
    });

    it('小数点を含む計算結果は適切に丸める', async () => {
      // Arrange
      const input = {
        progressDataId: null,
        workInstructionId: 'WI-006',
        facilityId: 'FAC-006',
        teamId: 'TEAM-006',
        progressDate: '2024-01-20',
        plannedQuantity: 3,
        actualQuantity: 1,
        completionRate: undefined,
        delayFlag: false,
        remarks: undefined,
        createdBy: 'USER-006',
        updatedBy: undefined,
      };

      // Act
      const output = await saveProgressData(input);

      // Assert
      expect(typeof output.completionRate).toBe('number');
      expect(output.completionRate).toBeGreaterThan(0);
      expect(output.completionRate).toBeLessThanOrEqual(100);
    });

    it('progressDataIdが既に存在する場合、更新操作として処理される', async () => {
      // Arrange - 先に新規作成
      const createInput = {
        progressDataId: null,
        workInstructionId: 'WI-007',
        facilityId: 'FAC-007',
        teamId: 'TEAM-007',
        progressDate: '2024-01-21',
        plannedQuantity: 100,
        actualQuantity: 50,
        completionRate: undefined,
        delayFlag: false,
        remarks: undefined,
        createdBy: 'USER-007',
        updatedBy: undefined,
      };

      const createOutput = await saveProgressData(createInput);
      const existingProgressDataId = createOutput.progressDataId;

      // Arrange - 更新入力
      const updateInput = {
        progressDataId: existingProgressDataId,
        workInstructionId: 'WI-007',
        facilityId: 'FAC-007',
        teamId: 'TEAM-007',
        progressDate: '2024-01-21',
        plannedQuantity: 100,
        actualQuantity: 75,
        completionRate: undefined,
        delayFlag: false,
        remarks: undefined,
        createdBy: 'USER-007',
        updatedBy: 'USER-008',
      };

      // Act
      const updateOutput = await saveProgressData(updateInput);

      // Assert
      expect(updateOutput.progressDataId).toBe(existingProgressDataId);
      expect(updateOutput.completionRate).toBe(75);
      expect(updateOutput.actualQuantity).toBe(75);
      expect(updateOutput.isNewRecord).toBe(false);
    });

    it('savedAtがISO 8601形式の現在時刻で返される', async () => {
      // Arrange
      const input = {
        progressDataId: null,
        workInstructionId: 'WI-008',
        facilityId: 'FAC-008',
        teamId: 'TEAM-008',
        progressDate: '2024-01-22',
        plannedQuantity: 100,
        actualQuantity: 80,
        completionRate: undefined,
        delayFlag: false,
        remarks: undefined,
        createdBy: 'USER-009',
        updatedBy: undefined,
      };

      const beforeTime = new Date();

      // Act
      const output = await saveProgressData(input);

      const afterTime = new Date();

      // Assert
      expect(output.savedAt).toBeDefined();
      const savedAtTime = new Date(output.savedAt);
      expect(savedAtTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(savedAtTime.getTime()).toBeLessThanOrEqual(afterTime.getTime() + 1000);
      expect(output.savedAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
      );
    });
  });
});