import { getAllocationPlanById } from '../../src/logic/data-persistence';

describe('作業進捗・人員配置最適化エンジン - 人員配置案取得', () => {
  describe('SCEN-777: 指定された人員配置案IDが存在する場合、当該配置案の詳細情報が返される', () => {
    it('指定された人員配置案IDに対応する人員配置案データを検索して返す', async () => {
      // テストデータの事前準備
      const allocationPlanId = 'AP-2024-001';
      
      const input = {
        allocationPlanId: allocationPlanId,
      };

      // getAllocationPlanById関数を呼び出す
      const result = await getAllocationPlanById(input);

      // 出力型GetAllocationPlanByIdOutputの検証
      // 配置案の詳細情報が返されていることを確認
      expect(result).toBeDefined();
      expect(result.allocationPlanId).toBe(allocationPlanId);
      
      // 配置案名が存在すること
      expect(result.planName).toBeDefined();
      expect(typeof result.planName).toBe('string');
      
      // 対象拠点IDが存在すること
      expect(result.facilityId).toBeDefined();
      expect(typeof result.facilityId).toBe('string');
      
      // 対象チームIDが存在すること
      expect(result.teamId).toBeDefined();
      expect(typeof result.teamId).toBe('string');
      
      // 対応する作業指示IDが存在すること
      expect(result.workInstructionId).toBeDefined();
      expect(typeof result.workInstructionId).toBe('string');
      
      // 配置期間情報が存在すること
      expect(result.allocationStartDate).toBeDefined();
      expect(typeof result.allocationStartDate).toBe('string');
      expect(result.allocationEndDate).toBeDefined();
      expect(typeof result.allocationEndDate).toBe('string');
      
      // 予想工数が存在して数値であること
      expect(result.estimatedWorkHours).toBeDefined();
      expect(typeof result.estimatedWorkHours).toBe('number');
      expect(result.estimatedWorkHours).toBeGreaterThan(0);
      
      // 予想完了日が存在すること
      expect(result.estimatedCompletionDate).toBeDefined();
      expect(typeof result.estimatedCompletionDate).toBe('string');
      
      // 実行ステータスが有効な値であること
      expect(result.status).toBeDefined();
      expect(['提案中', '承認待ち', '承認済み', '実行中', '完了', '却下']).toContain(result.status);
      
      // 作成日時が存在すること
      expect(result.createdAt).toBeDefined();
      expect(typeof result.createdAt).toBe('string');
      
      // 更新日時が存在すること
      expect(result.updatedAt).toBeDefined();
      expect(typeof result.updatedAt).toBe('string');
      
      // 作成者が存在すること
      expect(result.createdBy).toBeDefined();
      expect(typeof result.createdBy).toBe('string');
      
      // エラーが発生していないこと
      expect(result).not.toHaveProperty('error');
    });
  });
});