import { analyzeOnboardingContextAndExtractPeerPerformancePatterns } from '../../src/logic/new-assignee-onboarding-analysis';
import * as onboardingModule from '../../src/logic/new-assignee-onboarding-analysis';

describe('SCEN-316: NoPeerWorkerGroupFoundError when no peer workers exist', () => {
  it('should throw NoPeerWorkerGroupFoundError when no existing workers match the job classification and site', async () => {
    const validateInputDataSpy = jest.spyOn(onboardingModule, 'validateInputData' as any).mockReturnValue(undefined);
    const findWorkersByClassificationAndSiteSpy = jest.spyOn(onboardingModule, 'findWorkersByClassificationAndSite' as any).mockResolvedValue([]);
    const findProductivityDataByWorkerIdsSpy = jest.spyOn(onboardingModule, 'findProductivityDataByWorkerIds' as any).mockResolvedValue([]);
    const findPerformanceRecordsByWorkerIdsSpy = jest.spyOn(onboardingModule, 'findPerformanceRecordsByWorkerIds' as any).mockResolvedValue([]);

    const input = {
      newAssigneeName: '田中太郎',
      assignmentSiteId: 'site-001',
      assignmentDate: '2025-01-15',
      jobClassification: 'ピッキング',
      historicalDataLookbackDays: 30,
      requestedByUserId: 'user-center-001',
    };

    try {
      await analyzeOnboardingContextAndExtractPeerPerformancePatterns(input);
      fail('Expected NoPeerWorkerGroupFoundError to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error.constructor.name).toBe('NoPeerWorkerGroupFoundError');
      expect(error.message).toBe(
        '同じ職務分類・拠点の既存作業者が見つかりません。分析対象となるピアグループが存在しません。'
      );
    } finally {
      validateInputDataSpy.mockRestore();
      findWorkersByClassificationAndSiteSpy.mockRestore();
      findProductivityDataByWorkerIdsSpy.mockRestore();
      findPerformanceRecordsByWorkerIdsSpy.mockRestore();
    }
  });
});