import {
  analyzeOnboardingContextAndExtractPeerPerformancePatterns,
  AnalyzeOnboardingContextInput,
  OnboardingAnalysisResult,
} from '../../src/logic/new-assignee-onboarding-analysis';

describe('SCEN-314: 新配属者の配属情報を受け取り、同じ職務分類・拠点の既存作業者の過去実績データを抽出・分析して、得意作業・生産性パターンを返す', () => {
  it('代表的な正常入力で、同一拠点・同一職務分類の既存作業者グループが5人以上存在する場合、得意作業と生産性パターンを分析結果に含めて返す', async () => {
    // Input setup
    const input: AnalyzeOnboardingContextInput = {
      newAssigneeName: '田中太郎',
      assignmentSiteId: 'SITE-001',
      assignmentDate: '2024-01-15T09:00:00Z',
      jobClassification: 'ピッキング作業',
      historicalDataLookbackDays: 30,
      requestedByUserId: 'USER-CENTER-001',
    };

    // Call the function
    const result = await analyzeOnboardingContextAndExtractPeerPerformancePatterns(input);

    // Verify return type
    expect(result).toBeDefined();
    expect(result).toHaveProperty('newAssigneeName');
    expect(result).toHaveProperty('assignmentSiteId');
    expect(result).toHaveProperty('jobClassification');
    expect(result).toHaveProperty('peerWorkerCount');
    expect(result).toHaveProperty('analysisDataPeriodDays');
    expect(result).toHaveProperty('strengthWorkTypes');
    expect(result).toHaveProperty('productivityPatterns');
    expect(result).toHaveProperty('recommendedInitialWorkTypes');
    expect(result).toHaveProperty('analysisTimestamp');
    expect(result).toHaveProperty('analysisStatus');

    // Verify basic fields
    expect(result.newAssigneeName).toBe('田中太郎');
    expect(result.assignmentSiteId).toBe('SITE-001');
    expect(result.jobClassification).toBe('ピッキング作業');

    // Verify peer worker count is 5 or more
    expect(result.peerWorkerCount).toBeGreaterThanOrEqual(5);

    // Verify analysis data period
    expect(result.analysisDataPeriodDays).toBe(30);

    // Verify strengthWorkTypes
    expect(Array.isArray(result.strengthWorkTypes)).toBe(true);
    expect(result.strengthWorkTypes.length).toBeGreaterThanOrEqual(1);

    result.strengthWorkTypes.forEach((workType) => {
      expect(workType).toHaveProperty('workTypeId');
      expect(workType).toHaveProperty('workTypeName');
      expect(workType).toHaveProperty('averageProductivityRate');
      expect(workType).toHaveProperty('averageQualityScore');
      expect(workType).toHaveProperty('workerCountExcellingInThisType');
      expect(typeof workType.averageProductivityRate).toBe('number');
      expect(typeof workType.averageQualityScore).toBe('number');
      expect(typeof workType.workerCountExcellingInThisType).toBe('number');
    });

    // Verify strengthWorkTypes is sorted by productivity and quality (descending)
    for (let i = 0; i < result.strengthWorkTypes.length - 1; i++) {
      const current = result.strengthWorkTypes[i];
      const next = result.strengthWorkTypes[i + 1];
      const currentScore = current.averageProductivityRate + current.averageQualityScore;
      const nextScore = next.averageProductivityRate + next.averageQualityScore;
      expect(currentScore).toBeGreaterThanOrEqual(nextScore);
    }

    // Verify productivityPatterns
    expect(Array.isArray(result.productivityPatterns)).toBe(true);
    expect(result.productivityPatterns.length).toBeGreaterThanOrEqual(1);

    result.productivityPatterns.forEach((pattern) => {
      expect(pattern).toHaveProperty('patternName');
      expect(pattern).toHaveProperty('description');
      expect(pattern).toHaveProperty('averageProductivityRate');
      expect(pattern).toHaveProperty('averageQualityScore');
      expect(pattern).toHaveProperty('typicalWorkTypes');
      expect(pattern).toHaveProperty('applicableWorkerCount');
      expect(typeof pattern.averageProductivityRate).toBe('number');
      expect(typeof pattern.averageQualityScore).toBe('number');
      expect(Array.isArray(pattern.typicalWorkTypes)).toBe(true);
      expect(typeof pattern.applicableWorkerCount).toBe('number');
    });

    // Verify recommendedInitialWorkTypes
    expect(Array.isArray(result.recommendedInitialWorkTypes)).toBe(true);
    expect(result.recommendedInitialWorkTypes.length).toBeGreaterThanOrEqual(1);

    result.recommendedInitialWorkTypes.forEach((workType) => {
      expect(workType).toHaveProperty('workTypeId');
      expect(workType).toHaveProperty('workTypeName');
      expect(workType).toHaveProperty('recommendationReason');
      expect(workType).toHaveProperty('estimatedLearningCurve');
      expect(typeof workType.recommendationReason).toBe('string');
      expect(typeof workType.estimatedLearningCurve).toBe('string');
    });

    // Verify analysisTimestamp is ISO 8601 format
    expect(typeof result.analysisTimestamp).toBe('string');
    expect(() => new Date(result.analysisTimestamp)).not.toThrow();
    const timestamp = new Date(result.analysisTimestamp);
    expect(timestamp.getTime()).not.toBeNaN();

    // Verify analysisStatus is 'success'
    expect(result.analysisStatus).toBe('success');
  });
});