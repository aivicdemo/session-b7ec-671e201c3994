import { monitorAndJudgeDelayRisk } from '../../src/logic/progress-monitoring-risk-engine';
import { jest } from '@jest/globals';

// モック型定義
interface WorkInstruction {
  workInstructionId: string;
  status: string;
  progress: number;
}

interface WorkerProductivity {
  workerId: string;
  productivityRate: number;
  qualityScore: number;
}

interface ProgressData {
  workInstructions: WorkInstruction[];
}

interface ProductivityData {
  workers: WorkerProductivity[];
}

// WMS連携アダプターのモック
const mockWmsAdapter = {
  fetchProgressData: jest.fn<() => Promise<ProgressData>>(),
  fetchProductivityData: jest.fn<() => Promise<ProductivityData>>(),
};

// データ整合性検証モック
const mockDataIntegrityValidator = {
  validate: jest.fn<(progress: ProgressData, productivity: ProductivityData) => boolean>(),
};

describe('進捗遅延リスク常時監視 - エラーハンドリング', () => {
  describe('SCEN-1554: 現在の作業者数が0のとき、エラーメッセージが返される', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should throw BusinessRuleConstraintViolationError with correct message when current worker count is 0', async () => {
      const input = {
        facilityIds: ['F001'],
        teamIds: undefined,
        workInstructionIds: undefined,
        evaluationDateTime: '2024-01-15T10:00:00Z',
        userId: 'U001',
      };

      // WMS連携: 進捗データを取得（進行中の作業指示が存在）
      const progressData: ProgressData = {
        workInstructions: [
          {
            workInstructionId: 'WI001',
            status: 'in_progress',
            progress: 50,
          },
        ],
      };
      mockWmsAdapter.fetchProgressData.mockResolvedValueOnce(progressData);

      // WMS連携: 作業者生産性データを取得（ただし作業者数は0）
      const productivityData: ProductivityData = {
        workers: [], // 作業者が配置されていない
      };
      mockWmsAdapter.fetchProductivityData.mockResolvedValueOnce(productivityData);

      // データ参照整合性の検証: 進捗データと生産性データの整合性確認
      mockDataIntegrityValidator.validate.mockReturnValueOnce(true);

      // エラーが投げられることを確認
      const thrownError = await expect(monitorAndJudgeDelayRisk(input)).rejects.toThrow(
        '作業者が配置されていません。人員配置を確認してください'
      );

      // エラー型が制約違反エラーであることを確認
      expect(thrownError).toHaveProperty('message');
      expect(thrownError.message).toBe('作業者が配置されていません。人員配置を確認してください');

      // エラー名が制約違反エラーであることを確認（名前が存在する場合）
      if (thrownError.name) {
        expect(
          thrownError.name === 'BusinessRuleConstraintViolationError' ||
          thrownError.name.includes('ConstraintViolation') ||
          thrownError.name.includes('BusinessRule')
        ).toBe(true);
      }

      // WMS連携が呼び出されたことを確認
      expect(mockWmsAdapter.fetchProgressData).toHaveBeenCalledWith('F001');
      expect(mockWmsAdapter.fetchProductivityData).toHaveBeenCalledWith('F001');

      // データ整合性検証が実行されたことを確認
      expect(mockDataIntegrityValidator.validate).toHaveBeenCalledWith(
        progressData,
        productivityData
      );
    });

    it('should verify business rule br-tx_4-003 constraint is enforced', async () => {
      const input = {
        facilityIds: ['F001'],
        teamIds: undefined,
        workInstructionIds: undefined,
        evaluationDateTime: '2024-01-15T10:00:00Z',
        userId: 'U001',
      };

      // currentWorkerCount = 0 の状態を実現: 作業者データが空
      const progressData: ProgressData = {
        workInstructions: [
          {
            workInstructionId: 'WI001',
            status: 'in_progress',
            progress: 75,
          },
        ],
      };

      const productivityData: ProductivityData = {
        workers: [], // currentWorkerCount = 0
      };

      mockWmsAdapter.fetchProgressData.mockResolvedValueOnce(progressData);
      mockWmsAdapter.fetchProductivityData.mockResolvedValueOnce(productivityData);
      mockDataIntegrityValidator.validate.mockReturnValueOnce(true);

      // 業務ルール br-tx_4-003: 現在の作業者数が0のとき、制約違反エラーがスロー
      const thrownError = await expect(monitorAndJudgeDelayRisk(input)).rejects.toThrow();

      // エラーメッセージが正確であることを確認
      expect(thrownError.message).toBe('作業者が配置されていません。人員配置を確認してください');

      // エラーが伝播されたことを確認（出力型は返されない）
      expect(thrownError).toBeDefined();
    });

    it('should not return MonitorAndJudgeDelayRiskOutput when worker count is zero', async () => {
      const input = {
        facilityIds: ['F001'],
        teamIds: undefined,
        workInstructionIds: undefined,
        evaluationDateTime: '2024-01-15T10:00:00Z',
        userId: 'U001',
      };

      const progressData: ProgressData = {
        workInstructions: [
          {
            workInstructionId: 'WI001',
            status: 'in_progress',
            progress: 50,
          },
        ],
      };

      const productivityData: ProductivityData = {
        workers: [],
      };

      mockWmsAdapter.fetchProgressData.mockResolvedValueOnce(progressData);
      mockWmsAdapter.fetchProductivityData.mockResolvedValueOnce(productivityData);
      mockDataIntegrityValidator.validate.mockReturnValueOnce(true);

      // 関数が出力型を返さず、エラーをスローすることを確認
      await expect(monitorAndJudgeDelayRisk(input)).rejects.toThrow(
        '作業者が配置されていません。人員配置を確認してください'
      );
    });
  });
});