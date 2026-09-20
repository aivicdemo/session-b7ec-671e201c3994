import { analyzeOnboardingContextAndExtractPeerPerformancePatterns } from '../../src/logic/new-assignee-onboarding-analysis';

describe('SCEN-322: 新配属者の配属拠点が空の場合のエラーハンドリング', () => {
  it('assignmentSiteIdが空文字列の場合、InvalidAssignmentInfoErrorをスローする', async () => {
    const input = {
      newAssigneeName: '山田太郎',
      assignmentSiteId: '',
      assignmentDate: '2024-01-15',
      jobClassification: '仕分け作業',
      requestedByUserId: 'user-001',
    };

    await expect(
      analyzeOnboardingContextAndExtractPeerPerformancePatterns(input)
    ).rejects.toThrow(
      '配属情報が不完全です。氏名、配属拠点、配属日、職務分類をすべて指定してください。'
    );
  });
});