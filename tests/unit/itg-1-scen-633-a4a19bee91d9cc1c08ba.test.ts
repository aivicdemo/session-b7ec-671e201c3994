import { saveProficiency, getProficiencyById } from '../../src/logic/data-persistence';

describe('作業進捗・人員配置最適化エンジン - 習熟度更新', () => {
  describe('SCEN-633: 更新時の出力でisNewRecordがfalseに設定される', () => {
    it('既存の習熟度レコードを更新する場合、isNewRecordがfalseに設定される', async () => {
      // Arrange
      const proficiencyId = 'P12345';
      const workerId = 'W001';
      const jobType = '仕分け';
      const proficiencyLevel = '中級';
      const evaluationDate = '2025-01-15T10:00:00Z';
      const evaluatedBy = 'E001';
      const createdBy = 'C001';
      const updatedBy = 'U001';

      // 前提条件: 作業者ID「W001」が既に存在することをスタブで設定
      jest.spyOn(require('../../src/logic/data-persistence'), 'getWorkerById').mockResolvedValue({
        workerId: 'W001',
        workerName: 'テスト作業者',
        facilityId: 'F001',
        teamId: 'T001',
        jobType: '仕分け',
        operatingStatus: 'active',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        createdBy: 'C001',
        updatedBy: null,
      });

      // 前提条件: validateDateTimeRange のスタブを設定して日付検証を成功させる
      jest.spyOn(require('../../src/logic/data-persistence'), 'validateDateTimeRange').mockResolvedValue(true);

      // 前提条件: 既存の習熟度レコード「P12345」が存在することをスタブで設定
      jest.spyOn(require('../../src/logic/data-persistence'), 'getProficiencyById').mockResolvedValue({
        proficiencyId: 'P12345',
        workerId: 'W001',
        jobType: '仕分け',
        proficiencyLevel: '初級',
        evaluationDate: '2025-01-10T10:00:00Z',
        evaluatedBy: 'E001',
        remarks: null,
        createdAt: '2025-01-10T10:00:00Z',
        updatedAt: '2025-01-10T10:00:00Z',
        createdBy: 'C001',
        updatedBy: null,
      });

      const input = {
        proficiencyId,
        workerId,
        jobType,
        proficiencyLevel,
        evaluationDate,
        evaluatedBy,
        remarks: null,
        createdBy,
        updatedBy,
      };

      // Act
      const output = await saveProficiency(input);

      // Assert
      expect(output).toBeDefined();
      expect(output.isNewRecord).toBe(false);
      expect(output.proficiencyId).toBe(proficiencyId);
      expect(output.workerId).toBe(workerId);
      expect(output.jobType).toBe(jobType);
      expect(output.proficiencyLevel).toBe(proficiencyLevel);
      expect(output.savedAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
      );

      // 検証: 保存後、getProficiencyById で実際にレコードが更新されていることを確認
      const savedRecord = await getProficiencyById({ proficiencyId });
      expect(savedRecord.proficiencyId).toBe(proficiencyId);
      expect(savedRecord.proficiencyLevel).toBe(proficiencyLevel);
    });
  });
});