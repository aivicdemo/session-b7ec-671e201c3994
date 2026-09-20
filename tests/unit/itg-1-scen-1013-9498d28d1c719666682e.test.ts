import { listDelayRiskJudgmentByCondition } from '../../src/logic/data-persistence';

describe('SCEN-1013: 存在しないチームIDを指定した場合はエラーを返す', () => {
  it('should throw ReferentialIntegrityError when non-existent teamIds are specified', async () => {
    const input = {
      teamIds: ['TEAM_NONEXISTENT_12345'],
    };

    await expect(listDelayRiskJudgmentByCondition(input)).rejects.toThrow(
      expect.objectContaining({
        name: 'ReferentialIntegrityError',
        message: '指定された拠点・チーム・作業指示が見つかりません。',
      })
    );
  });
});