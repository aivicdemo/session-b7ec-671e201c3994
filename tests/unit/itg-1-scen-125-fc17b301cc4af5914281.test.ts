import { monitorAndJudgeDelayRisk } from '../../src/logic/progress-monitoring-risk-engine';
import { InvalidInputParameterError } from '../../src/domain/errors';

describe('SCEN-125: 配置人員数がゼロのとき、例外を発生させて評価不可であることを示す', () => {
  it('should throw InvalidInputParameterError when assigned worker count is zero for a facility', async () => {
    const facilityId = 'facility-001';
    const userId = 'user-001';
    const evaluationDateTime = new Date().toISOString();

    const input = {
      facilityIds: [facilityId],
      teamIds: undefined,
      workInstructionIds: undefined,
      evaluationDateTime,
      userId,
    };

    // 進捗データをスタブ化：拠点全体の配置人員数がゼロであることを示す
    jest.spyOn(global as any, 'getRecentProgressDataByWorkInstruction').mockResolvedValue([
      {
        facilityId,
        workInstructionId: 'work-001',
        progressRate: 50,
        plannedProgressRate: 70,
        remainingWorkDays: 5,
        allocatedStaffCount: 0,
        requiredStaffCount: 3,
      },
      {
        facilityId,
        workInstructionId: 'work-002',
        progressRate: 45,
        plannedProgressRate: 65,
        remainingWorkDays: 6,
        allocatedStaffCount: 0,
        requiredStaffCount: 2,
      },
    ]);

    // 生産性データをスタブ化：複数作業者データを返す
    jest.spyOn(global as any, 'getLatestProductivityDataByWorker').mockResolvedValue([
      {
        workerId: 'worker-001',
        facilityId,
        productivityRate: 85,
        qualityScore: 90,
        processTime: 120,
        skillLevel: 3,
      },
      {
        workerId: 'worker-002',
        facilityId,
        productivityRate: 78,
        qualityScore: 85,
        processTime: 135,
        skillLevel: 2,
      },
    ]);

    // 検証関数のスタブ：例外を発生させない
    jest.spyOn(global as any, 'validateReferentialIntegrity').mockResolvedValue(undefined);

    // リスク計算関数のスタブ：例外を発生させない
    jest.spyOn(global as any, 'calculateDelayRiskScore').mockResolvedValue({
      riskScore: 65,
      predictedDelayDays: 2,
    });

    // 遅延要因分類関数のスタブ：例外を発生させない
    jest.spyOn(global as any, 'classifyDelayReason').mockResolvedValue({
      insufficientStaffContribution: 0,
      efficiencyDeclineContribution: 30,
      priorityMisalignmentContribution: 35,
      primaryDelayReason: 'PRIORITY_MISALIGNMENT',
    });

    // ランク付け関数のスタブ：例外を発生させない
    jest.spyOn(global as any, 'rankFacilitiesByRiskPriority').mockResolvedValue([
      {
        facilityId,
        facilityName: 'Test Facility',
        riskScore: 65,
        riskLevel: 'MEDIUM',
        predictedDelayDays: 2,
        currentProgressRate: 50,
        plannedProgressRate: 70,
        priorityRank: 1,
      },
    ]);

    // テスト対象の実装を呼び出し、例外が発生することを検証
    let caughtException: any;
    let output: any = undefined;

    try {
      output = await monitorAndJudgeDelayRisk(input);
    } catch (error) {
      caughtException = error;
    }

    // 例外が発生したことを検証
    expect(caughtException).toBeDefined();

    // 例外メッセージが指定の文言を含むことを検証
    expect(caughtException.message).toContain('配置人員がいない拠点は評価できません');

    // 例外の型が InvalidInputParameterError またはそれに相当する設計済みエラーであることを検証
    expect(
      caughtException instanceof InvalidInputParameterError ||
      caughtException.name === 'InvalidInputParameterError'
    ).toBe(true);

    // 出力型 MonitorAndJudgeDelayRiskOutput が返却されていないことを検証
    expect(output).toBeUndefined();
  });
});