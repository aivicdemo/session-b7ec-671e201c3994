import { saveDelayRiskJudgment, SaveDelayRiskJudgmentInput } from '../../src/logic/data-persistence';

describe('SCEN-975: リスクレベルが定義済み値ではないとき、InvalidRiskLevelエラーを発生させる', () => {
  const validBaseInput: SaveDelayRiskJudgmentInput = {
    riskJudgmentId: null,
    workInstructionId: 'WI-001',
    facilityId: 'FAC-001',
    teamId: 'TEAM-001',
    judgmentDateTime: '2025-01-15T10:30:00Z',
    riskLevel: 'HIGH',
    delayPredictionDays: 5,
    progressRate: 50,
    plannedProgressRate: 70,
    judgmentReason: '人員不足',
    recommendedAction: '人員追加',
    createdBy: 'USER-001',
  };

  const invalidRiskLevelValues = [
    'INVALID',
    '未定義',
    '',
    'low',
    'high',
    'MEDIUM ',
    ' MEDIUM',
    'HIGH/MEDIUM',
    '123',
    'null',
    'undefined',
  ];

  test.each(invalidRiskLevelValues)(
    'riskLevel=%p のときにInvalidRiskLevelエラーが発生すること',
    async (invalidRiskLevel) => {
      const input: SaveDelayRiskJudgmentInput = {
        ...validBaseInput,
        riskLevel: invalidRiskLevel as any,
      };

      await expect(saveDelayRiskJudgment(input)).rejects.toThrow(
        expect.objectContaining({
          code: 'InvalidRiskLevel',
          message: expect.stringContaining(`リスクレベル '${invalidRiskLevel}' は無効です。`),
        })
      );
    }
  );

  test('nullをriskLevelに設定するとInvalidRiskLevelエラーが発生すること', async () => {
    const input: SaveDelayRiskJudgmentInput = {
      ...validBaseInput,
      riskLevel: null as any,
    };

    await expect(saveDelayRiskJudgment(input)).rejects.toThrow(
      expect.objectContaining({
        code: 'InvalidRiskLevel',
      })
    );
  });

  test('undefinedをriskLevelに設定するとInvalidRiskLevelエラーが発生すること', async () => {
    const input: SaveDelayRiskJudgmentInput = {
      ...validBaseInput,
      riskLevel: undefined as any,
    };

    await expect(saveDelayRiskJudgment(input)).rejects.toThrow(
      expect.objectContaining({
        code: 'InvalidRiskLevel',
      })
    );
  });

  test('数値をriskLevelに設定するとInvalidRiskLevelエラーが発生すること', async () => {
    const input: SaveDelayRiskJudgmentInput = {
      ...validBaseInput,
      riskLevel: 1 as any,
    };

    await expect(saveDelayRiskJudgment(input)).rejects.toThrow(
      expect.objectContaining({
        code: 'InvalidRiskLevel',
      })
    );
  });

  test('エラー発生時はデータベースへの保存処理が実行されないこと', async () => {
    const input: SaveDelayRiskJudgmentInput = {
      ...validBaseInput,
      riskLevel: 'INVALID' as any,
    };

    try {
      await saveDelayRiskJudgment(input);
      fail('エラーがスローされることを期待しています');
    } catch (error: any) {
      expect(error.code).toBe('InvalidRiskLevel');
    }
  });
});