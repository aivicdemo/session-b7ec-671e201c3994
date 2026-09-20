import { saveWorkResult } from '../../src/logic/data-persistence';

describe('作業進捗・人員配置最適化エンジン - SCEN-713', () => {
  describe('不良数がnullで指定されると正常に保存される', () => {
    it('defectCountがnullの場合、作業実績データが正常に保存される', async () => {
      // Arrange
      const input = {
        workResultId: null,
        workInstructionId: 'WI-001',
        workerId: 'WR-001',
        facilityId: 'FAC-001',
        teamId: 'TM-001',
        actualStartDateTime: '2025-01-15T08:00:00Z',
        actualEndDateTime: '2025-01-15T12:00:00Z',
        actualQuantity: 100,
        workStatus: '完了',
        defectCount: null,
        remarks: null,
        createdBy: 'USER-001',
        updatedBy: null,
      };

      // Act
      const output = await saveWorkResult(input);

      // Assert
      expect(output).toBeDefined();
      expect(output.workResultId).toBeDefined();
      expect(output.workResultId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(output.workInstructionId).toBe('WI-001');
      expect(output.workerId).toBe('WR-001');
      expect(output.facilityId).toBe('FAC-001');
      expect(output.teamId).toBe('TM-001');
      expect(output.actualQuantity).toBe(100);
      expect(output.workStatus).toBe('完了');
      expect(output.savedAt).toBeDefined();
      expect(output.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
      expect(output.isNewRecord).toBe(true);
    });
  });
});