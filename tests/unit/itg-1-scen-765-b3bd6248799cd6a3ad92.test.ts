import { saveAllocationPlan } from '../../src/logic/data-persistence';
import { SaveAllocationPlanInput } from '../../src/logic/data-persistence';
import * as jest from 'jest';

describe('作業進捗・人員配置最適化エンジン - 配置案の日付検証', () => {
  describe('SCEN-765: 配置開始日が配置終了日より後である場合、InvalidDateRangeエラーが発生する', () => {
    it('配置開始日が配置終了日より後の場合、InvalidDateRangeエラーをスローする', async () => {
      // Arrange
      const input: SaveAllocationPlanInput = {
        allocationPlanId: null,
        planName: '拠点A_チームB_2024-02-15_追加配置案',
        facilityId: 'FAC001',
        teamId: 'TEAM001',
        workInstructionId: 'WI001',
        allocationStartDate: '2024-02-15',
        allocationEndDate: '2024-02-10',
        estimatedWorkHours: 80,
        estimatedCompletionDate: '2024-02-20',
        status: '提案中',
        description: null,
        createdBy: 'USER001',
        updatedBy: undefined,
      };

      // Act & Assert
      try {
        await saveAllocationPlan(input);
        fail('InvalidDateRangeエラーがスローされるべき');
      } catch (error: any) {
        // InvalidDateRangeエラー型の検証
        expect(error.code).toBe('InvalidDateRange');
        expect(error.message).toBe('配置期間が不正です。配置開始日は配置終了日より前である必要があります。');
        
        // データベースへの保存が実行されていないことを確認
        // SaveAllocationPlanOutput が返されていないことを暗に確認
        expect(error).toBeInstanceOf(Error);
      }
    });
  });
});