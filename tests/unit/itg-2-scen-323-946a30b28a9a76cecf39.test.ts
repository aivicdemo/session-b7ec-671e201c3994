import { analyzeOnboardingContextAndExtractPeerPerformancePatterns } from '../../src/logic/new-assignee-onboarding-analysis';

describe('SCEN-323: 新配属者の配属拠点が無効な形式の場合のエラー処理', () => {
  it('assignmentSiteId が空文字列の場合、InvalidAssignmentInfoError を throw してメッセージは「配属拠点を正しく入力してください」である', async () => {
    const input = {
      newAssigneeName: '田中太郎',
      assignmentSiteId: '',
      assignmentDate: '2025-01-15',
      jobClassification: 'ピッキング',
      requestedByUserId: 'user_001',
    };

    await expect(
      analyzeOnboardingContextAndExtractPeerPerformancePatterns(input)
    ).rejects.toMatchObject({
      name: 'InvalidAssignmentInfoError',
      message: '配属拠点を正しく入力してください',
    });
  });
});