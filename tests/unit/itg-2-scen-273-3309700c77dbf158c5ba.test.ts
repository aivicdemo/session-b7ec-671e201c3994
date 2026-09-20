import { judgePersonnelReallocationFeasibility } from '../../src/logic/personnel-reallocation-judgment';

describe('SCEN-273: 必要人員数が0以下のとき、例外が発生する', () => {
  test('requiredPersonnelCount が 0 のとき、エラーメッセージ「必要人員数は1以上である必要があります」が返される', async () => {
    const input = {
      delayRiskContext: {
        affectedSiteId: 'site-001',
        delayRiskScore: 75,
        detectedAt: '2024-01-15T10:00:00Z',
        requiredAdjustments: ['personnel_allocation'],
      },
      targetWorkTypeIds: ['work-type-001'],
      requiredPersonnelCount: 0,
      candidateSiteIds: ['site-002', 'site-003'],
      analysisDate: '2024-01-15',
    };

    await expect(judgePersonnelReallocationFeasibility(input)).rejects.toThrow(
      '必要人員数は1以上である必要があります'
    );
  });

  test('requiredPersonnelCount が負数のとき、エラーメッセージ「必要人員数は1以上である必要があります」が返される', async () => {
    const input = {
      delayRiskContext: {
        affectedSiteId: 'site-001',
        delayRiskScore: 75,
        detectedAt: '2024-01-15T10:00:00Z',
        requiredAdjustments: ['personnel_allocation'],
      },
      targetWorkTypeIds: ['work-type-001'],
      requiredPersonnelCount: -5,
      candidateSiteIds: ['site-002', 'site-003'],
      analysisDate: '2024-01-15',
    };

    await expect(judgePersonnelReallocationFeasibility(input)).rejects.toThrow(
      '必要人員数は1以上である必要があります'
    );
  });
});