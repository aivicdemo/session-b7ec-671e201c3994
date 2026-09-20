import { saveWorkResult } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';

describe('saveWorkResult', () => {
  describe('SCEN-703: 指定された拠点IDが存在しないとFacilityNotFoundエラーが発生する', () => {
    it('should throw FacilityNotFound error when facilityId does not exist', async () => {
      // Arrange
      const input = {
        workResultId: null,
        workInstructionId: 'INSTR-001',
        workerId: 'WORKER-001',
        facilityId: 'FACILITY-NOTFOUND-999',
        teamId: 'TEAM-001',
        actualStartDateTime: '2024-01-15T08:00:00Z',
        actualEndDateTime: '2024-01-15T12:00:00Z',
        actualQuantity: 100,
        workStatus: '進行中',
        createdBy: 'USER-001',
      };

      jest.spyOn(dataPersistence, 'getFacilityById' as any).mockResolvedValue(null);
      jest.spyOn(dataPersistence, 'getWorkInstructionById' as any).mockResolvedValue({
        workInstructionId: 'INSTR-001',
        facilityId: 'FACILITY-001',
        teamId: 'TEAM-001',
        workInstructionNumber: 'WI-001',
        workName: 'Test Work',
        plannedStartDateTime: '2024-01-15T08:00:00Z',
        plannedEndDateTime: '2024-01-15T18:00:00Z',
        progressStatus: '進行中',
        requiredWorkerCount: 5,
        priority: '中',
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z',
        createdBy: 'USER-001',
      });
      jest.spyOn(dataPersistence, 'getWorkerById' as any).mockResolvedValue({
        workerId: 'WORKER-001',
        workerName: 'Test Worker',
        facilityId: 'FACILITY-001',
        teamId: 'TEAM-001',
        jobType: 'Type A',
        operatingStatus: '稼働中',
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z',
        createdBy: 'USER-001',
      });
      jest.spyOn(dataPersistence, 'getTeamById' as any).mockResolvedValue({
        teamId: 'TEAM-001',
        teamName: 'Test Team',
        facilityId: 'FACILITY-001',
        teamLeaderId: 'LEADER-001',
        operatingStatus: '稼働中',
        capacity: 10,
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z',
        createdBy: 'USER-001',
      });

      // Act & Assert
      await expect(saveWorkResult(input)).rejects.toThrow();
      await expect(saveWorkResult(input)).rejects.toMatchObject({
        name: 'FacilityNotFound',
        message: '拠点が見つかりません。拠点ID: FACILITY-NOTFOUND-999',
      });
    });
  });
});