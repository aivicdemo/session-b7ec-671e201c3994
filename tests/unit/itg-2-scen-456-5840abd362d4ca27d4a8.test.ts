import { saveProductivityData } from '../../src/logic/persistence-layer';
import * as authValidation from '../../src/logic/authorization-and-validation';
import * as persistenceLayer from '../../src/logic/persistence-layer';

describe('作業者生産性データ分析・配置最適化支援システム', () => {
  describe('SCEN-456: 指定された作業者IDが作業者マスタに存在しない場合、WorkerNotFoundErrorが発生する', () => {
    it('存在しない作業者IDで保存を試みるとWorkerNotFoundErrorが発生する', async () => {
      // Arrange
      const nonExistentWorkerId = 'WORKER-NOT-EXISTS-99999';
      const requestingUserId = 'user-001';
      
      const input = {
        productivityDataId: 'prod-data-001',
        performanceRecordId: 'perf-rec-001',
        workerId: nonExistentWorkerId,
        siteId: 'site-001',
        teamId: 'team-001',
        workDate: new Date('2024-01-15'),
        plannedWorkHours: 480,
        actualWorkHours: 500,
        completionCount: 50,
        productivityRate: 96,
        qualityScore: 95,
        errorCount: 1,
        proficiencyLevel: 'INTERMEDIATE',
        remarks: null,
        createdBy: 'admin-001',
        requestingUserId,
        operation: 'create' as const,
      };

      // スタブ化
      jest.spyOn(authValidation, 'authorizeUserAction').mockResolvedValue(true);
      jest.spyOn(authValidation, 'validateInputData').mockResolvedValue(true);
      jest.spyOn(persistenceLayer, 'findWorkerById').mockResolvedValue(null);

      // Act & Assert
      await expect(saveProductivityData(input)).rejects.toThrow();
      await expect(saveProductivityData(input)).rejects.toMatchObject({
        name: 'WorkerNotFoundError',
        message: `作業者が見つかりません。作業者ID: ${nonExistentWorkerId}`,
      });
    });
  });
});