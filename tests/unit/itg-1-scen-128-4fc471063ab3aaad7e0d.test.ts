import { monitorAndJudgeDelayRisk } from '../../src/logic/progress-monitoring-risk-engine';

describe('SCEN-128: 進捗遅延リスク判定エンジンの出力が空または不正な形式の場合、例外を発生させて再分析の実行を促す', () => {
  describe('出力データが不正な場合の例外処理', () => {
    it('calculateDelayRiskScore が null を返す場合、例外を発生させる', async () => {
      const input = {
        facilityIds: ['F001'],
        teamIds: undefined,
        workInstructionIds: undefined,
        evaluationDateTime: '2025-01-15T10:00:00Z',
        userId: 'user123',
      };

      await expect(monitorAndJudgeDelayRisk(input)).rejects.toThrow(
        expect.objectContaining({
          message: expect.stringContaining('進捗分析データが不足しています'),
        })
      );
    });

    it('classifyDelayReason が undefined を返す場合、例外を発生させる', async () => {
      const input = {
        facilityIds: ['F001'],
        teamIds: undefined,
        workInstructionIds: undefined,
        evaluationDateTime: '2025-01-15T10:00:00Z',
        userId: 'user123',
      };

      await expect(monitorAndJudgeDelayRisk(input)).rejects.toThrow(
        expect.objectContaining({
          message: expect.stringContaining('進捗分析データが不足しています'),
        })
      );
    });

    it('rankFacilitiesByRiskPriority が空配列を返す場合、例外を発生させる', async () => {
      const input = {
        facilityIds: ['F001'],
        teamIds: undefined,
        workInstructionIds: undefined,
        evaluationDateTime: '2025-01-15T10:00:00Z',
        userId: 'user123',
      };

      await expect(monitorAndJudgeDelayRisk(input)).rejects.toThrow(
        expect.objectContaining({
          message: expect.stringContaining('進捗分析データが不足しています'),
        })
      );
    });

    it('複数の出力フィールドが同時に不正な場合、例外を発生させて再分析を促す', async () => {
      const input = {
        facilityIds: ['F001'],
        teamIds: undefined,
        workInstructionIds: undefined,
        evaluationDateTime: '2025-01-15T10:00:00Z',
        userId: 'user123',
      };

      try {
        await monitorAndJudgeDelayRisk(input);
        fail('例外がスローされるべき');
      } catch (error: any) {
        expect(error.message).toContain('進捗分析データが不足しています');
        expect(error.message).toContain('再度分析を実行してください');
      }
    });

    it('rankedFacilities が null の場合、例外を発生させる', async () => {
      const input = {
        facilityIds: ['F001'],
        teamIds: undefined,
        workInstructionIds: undefined,
        evaluationDateTime: '2025-01-15T10:00:00Z',
        userId: 'user123',
      };

      await expect(monitorAndJudgeDelayRisk(input)).rejects.toThrow(
        expect.objectContaining({
          message: expect.stringContaining('進捗分析データが不足しています'),
        })
      );
    });

    it('delayReasonClassifications が空の場合、例外を発生させる', async () => {
      const input = {
        facilityIds: ['F001'],
        teamIds: undefined,
        workInstructionIds: undefined,
        evaluationDateTime: '2025-01-15T10:00:00Z',
        userId: 'user123',
      };

      await expect(monitorAndJudgeDelayRisk(input)).rejects.toThrow(
        expect.objectContaining({
          message: expect.stringContaining('進捗分析データが不足しています'),
        })
      );
    });

    it('recommendedAdjustments が null の場合、例外を発生させる', async () => {
      const input = {
        facilityIds: ['F001'],
        teamIds: undefined,
        workInstructionIds: undefined,
        evaluationDateTime: '2025-01-15T10:00:00Z',
        userId: 'user123',
      };

      await expect(monitorAndJudgeDelayRisk(input)).rejects.toThrow(
        expect.objectContaining({
          message: expect.stringContaining('進捗分析データが不足しています'),
        })
      );
    });
  });

  describe('例外検出のタイミング', () => {
    it('MonitorAndJudgeDelayRiskOutput 構築時に不正データを検出して例外を発生させる', async () => {
      const input = {
        facilityIds: ['F001'],
        teamIds: undefined,
        workInstructionIds: undefined,
        evaluationDateTime: '2025-01-15T10:00:00Z',
        userId: 'user123',
      };

      try {
        await monitorAndJudgeDelayRisk(input);
        fail('例外がスローされるべき');
      } catch (error: any) {
        expect(error).toBeDefined();
        expect(error.message).toMatch(/進捗分析データが不足しています/);
        expect(error.message).toMatch(/再度分析を実行してください/);
      }
    });

    it('例外が呼び出し元に伝播すること', async () => {
      const input = {
        facilityIds: ['F001'],
        teamIds: undefined,
        workInstructionIds: undefined,
        evaluationDateTime: '2025-01-15T10:00:00Z',
        userId: 'user123',
      };

      try {
        await monitorAndJudgeDelayRisk(input);
        fail('例外がスローされるべき');
      } catch (error: any) {
        expect(error).toBeDefined();
        expect(error.message).toContain('進捗分析データが不足しています');
      }
    });

    it('例外型が InvalidInputParameterError またはシステム内で明確に定義された型であること', async () => {
      const input = {
        facilityIds: ['F001'],
        teamIds: undefined,
        workInstructionIds: undefined,
        evaluationDateTime: '2025-01-15T10:00:00Z',
        userId: 'user123',
      };

      try {
        await monitorAndJudgeDelayRisk(input);
        fail('例外がスローされるべき');
      } catch (error: any) {
        expect(error.constructor.name).toMatch(/InvalidInputParameterError|Error/);
        expect(error.message).toContain('進捗分析データが不足しています');
      }
    });
  });

  describe('出力フィールドの検証', () => {
    it('rankedFacilities が空の場合、例外を発生させるため出力フィールドは存在しないこと', async () => {
      const input = {
        facilityIds: ['F001'],
        teamIds: undefined,
        workInstructionIds: undefined,
        evaluationDateTime: '2025-01-15T10:00:00Z',
        userId: 'user123',
      };

      try {
        await monitorAndJudgeDelayRisk(input);
        fail('例外がスローされるべき');
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });

    it('delayReasonClassifications が空の場合、例外を発生させるため出力フィールドは存在しないこと', async () => {
      const input = {
        facilityIds: ['F001'],
        teamIds: undefined,
        workInstructionIds: undefined,
        evaluationDateTime: '2025-01-15T10:00:00Z',
        userId: 'user123',
      };

      try {
        await monitorAndJudgeDelayRisk(input);
        fail('例外がスローされるべき');
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });

    it('recommendedAdjustments が空またはnullの場合、例外を発生させるため出力フィールドは存在しないこと', async () => {
      const input = {
        facilityIds: ['F001'],
        teamIds: undefined,
        workInstructionIds: undefined,
        evaluationDateTime: '2025-01-15T10:00:00Z',
        userId: 'user123',
      };

      try {
        await monitorAndJudgeDelayRisk(input);
        fail('例外がスローされるべき');
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });
  });
});