import { analyzeOnboardingContextAndExtractPeerPerformancePatterns } from '../../src/logic/new-assignee-onboarding-analysis';
import { AnalyzeOnboardingContextInput } from '../../src/logic/new-assignee-onboarding-analysis';

describe('SCEN-325: 新配属者の職務分類が無効な形式の場合のエラー処理', () => {
  it('職務分類が空文字列の場合、InvalidAssignmentInfoError を throw する', async () => {
    const input: AnalyzeOnboardingContextInput = {
      newAssigneeName: '山田太郎',
      assignmentSiteId: 'SITE-001',
      assignmentDate: '2025-01-15',
      jobClassification: '',
      historicalDataLookbackDays: 30,
      requestedByUserId: 'USER-100',
    };

    try {
      await analyzeOnboardingContextAndExtractPeerPerformancePatterns(input);
      fail('InvalidAssignmentInfoError 例外が throw されるべきです');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(Error);
      const errorName = (error as Error).name;
      expect(errorName).toBe('InvalidAssignmentInfoError');
      
      const errorMessage = (error as Error).message;
      expect(errorMessage).toMatch(
        /職務分類を正しく入力してください|配属情報が不完全です/
      );
    }
  });
});