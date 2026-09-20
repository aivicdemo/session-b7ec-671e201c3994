import { analyzeOnboardingContextAndExtractPeerPerformancePatterns } from '../../src/logic/new-assignee-onboarding-analysis';
import { AnalyzeOnboardingContextInput } from '../../src/logic/new-assignee-onboarding-analysis';
import * as newAssigneeModule from '../../src/logic/new-assignee-onboarding-analysis';

describe('SCEN-324: 新配属者の職務分類が空の場合のエラーハンドリング', () => {
  it('職務分類が空文字列の場合、「職務分類を正しく入力してください」のメッセージを含むエラーをthrowする', async () => {
    const input: AnalyzeOnboardingContextInput = {
      newAssigneeName: '田中太郎',
      assignmentSiteId: 'SITE-001',
      assignmentDate: '2024-01-15',
      jobClassification: '',
      historicalDataLookbackDays: 30,
      requestedByUserId: 'USER-001',
    };

    // 呼び出し先関数のスパイを設置
    const findWorkersByClassificationAndSiteSpy = jest.spyOn(
      newAssigneeModule,
      'findWorkersByClassificationAndSite'
    );
    const findProductivityDataByWorkerIdsSpy = jest.spyOn(
      newAssigneeModule,
      'findProductivityDataByWorkerIds'
    );
    const findPerformanceRecordsByWorkerIdsSpy = jest.spyOn(
      newAssigneeModule,
      'findPerformanceRecordsByWorkerIds'
    );

    let thrownError: Error | undefined;
    try {
      await analyzeOnboardingContextAndExtractPeerPerformancePatterns(input);
    } catch (error) {
      thrownError = error as Error;
    }

    // 例外が発生したことを確認
    expect(thrownError).toBeDefined();
    expect(thrownError?.message).toContain('職務分類を正しく入力してください');

    // 呼び出し先関数が実行されていないことを確認
    expect(findWorkersByClassificationAndSiteSpy).not.toHaveBeenCalled();
    expect(findProductivityDataByWorkerIdsSpy).not.toHaveBeenCalled();
    expect(findPerformanceRecordsByWorkerIdsSpy).not.toHaveBeenCalled();

    // スパイをクリーンアップ
    findWorkersByClassificationAndSiteSpy.mockRestore();
    findProductivityDataByWorkerIdsSpy.mockRestore();
    findPerformanceRecordsByWorkerIdsSpy.mockRestore();
  });
});