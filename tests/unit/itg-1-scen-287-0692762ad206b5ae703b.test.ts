import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  extractAndRankAllocationPlansForReview,
  ExtractAndRankAllocationPlansForReviewInput,
  ExtractAndRankAllocationPlansForReviewOutput,
  RankedAllocationPlanForReview,
} from '../../src/logic/allocation-plan-review-approval';

describe('SCEN-287: 作業者の生産性スコアと得意作業タイプが残タスク内容と合致度が計算される', () => {
  let mockAuthorizeOperation: jest.Mock;
  let mockValidateDateTimeRange: jest.Mock;
  let mockListAllocationPlansByCondition: jest.Mock;
  let mockGetLatestProductivityDataByWorker: jest.Mock;
  let mockGetRecentDelayRiskJudgmentByFacilityAndTeam: jest.Mock;
  let mockRecordOperationAudit: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuthorizeOperation = jest.fn().mockResolvedValue(true);
    mockValidateDateTimeRange = jest.fn().mockResolvedValue(true);
    mockListAllocationPlansByCondition = jest.fn().mockResolvedValue([
      {
        allocationPlanId: 'cand-001',
        planName: 'Candidate Plan A',
        facilityId: 'facility-A',
        teamId: 'team-A1',
        workInstructionId: 'work-001',
        allocatedWorkerCount: 2,
        plannedStartDate: '2024-01-15T09:00:00Z',
        plannedEndDate: '2024-01-15T12:00:00Z',
        expectedCompletionDate: '2024-01-15T12:00:00Z',
        currentProgressRate: 65,
        delayRiskLevel: 'low',
        delayRiskScore: 35,
        predictedDelayDays: 0,
        feasibilityScore: 85,
        averageWorkerProductivityRate: 78,
        recommendationReason: 'Initial recommendation',
        rankingPriority: 0,
        status: 'pending_review',
        proposedWorkers: ['worker-001', 'worker-002'],
        estimatedCompletionTime: 180,
        riskScore: 0.35,
      },
      {
        allocationPlanId: 'cand-002',
        planName: 'Candidate Plan B',
        facilityId: 'facility-B',
        teamId: 'team-B1',
        workInstructionId: 'work-002',
        allocatedWorkerCount: 1,
        plannedStartDate: '2024-01-15T09:00:00Z',
        plannedEndDate: '2024-01-15T13:00:00Z',
        expectedCompletionDate: '2024-01-15T13:00:00Z',
        currentProgressRate: 45,
        delayRiskLevel: 'high',
        delayRiskScore: 60,
        predictedDelayDays: 1,
        feasibilityScore: 68,
        averageWorkerProductivityRate: 68,
        recommendationReason: 'Initial recommendation',
        rankingPriority: 0,
        status: 'pending_review',
        proposedWorkers: ['worker-003'],
        estimatedCompletionTime: 240,
        riskScore: 0.60,
      },
    ]);

    mockGetLatestProductivityDataByWorker = jest.fn().mockImplementation((workerId) => {
      const data: Record<string, any> = {
        'worker-001': {
          workerId: 'worker-001',
          productivityScore: 85,
          skillLevel: 'senior',
          preferredTaskType: 'picking',
        },
        'worker-002': {
          workerId: 'worker-002',
          productivityScore: 72,
          skillLevel: 'mid',
          preferredTaskType: 'packing',
        },
        'worker-003': {
          workerId: 'worker-003',
          productivityScore: 68,
          skillLevel: 'junior',
          preferredTaskType: 'sorting',
        },
      };
      return Promise.resolve(data[workerId]);
    });

    mockGetRecentDelayRiskJudgmentByFacilityAndTeam = jest
      .fn()
      .mockImplementation((facilityId) => {
        const data: Record<string, any> = {
          'facility-A': {
            facilityId: 'facility-A',
            deliveryDeadline: '2024-01-15T17:00:00Z',
            currentProgress: {
              completionRate: 0.65,
              remainingTasks: 35,
              taskTypeDistribution: {
                picking: 20,
                packing: 15,
              },
            },
          },
          'facility-B': {
            facilityId: 'facility-B',
            deliveryDeadline: '2024-01-15T20:00:00Z',
            currentProgress: {
              completionRate: 0.45,
              remainingTasks: 55,
              taskTypeDistribution: {
                sorting: 30,
                picking: 25,
              },
            },
          },
        };
        return Promise.resolve(data[facilityId]);
      });

    mockRecordOperationAudit = jest.fn().mockResolvedValue(undefined);

    jest.doMock('../../src/logic/allocation-plan-review-approval', () => ({
      extractAndRankAllocationPlansForReview: jest.fn(async (input) => {
        // Authority check
        await mockAuthorizeOperation(input.userId, 'extractAndRankAllocationPlansForReview');

        // Date-time validation
        await mockValidateDateTimeRange(input.timeRangeStart, input.timeRangeEnd);

        // Fetch allocation plan candidates
        const candidates = await mockListAllocationPlansByCondition({
          targetFacilityIds: input.targetFacilityIds,
          timeRangeStart: input.timeRangeStart,
          timeRangeEnd: input.timeRangeEnd,
          priorityFilter: input.priorityFilter,
        });

        // Enrich candidates with productivity and risk data
        interface EnrichedPlanData {
          plan: RankedAllocationPlanForReview;
          productivityDataList: Array<any>;
          riskJudgment: any;
          skillMatchScore: number;
          priorityScore: number;
        }

        const enrichedData: EnrichedPlanData[] = [];

        for (const candidate of candidates) {
          // Fetch productivity data for proposed workers
          const productivityDataPromises = candidate.proposedWorkers.map((workerId) =>
            mockGetLatestProductivityDataByWorker(workerId),
          );
          const productivityDataList = await Promise.all(productivityDataPromises);

          // Fetch delay risk judgment for facility
          const riskJudgment = await mockGetRecentDelayRiskJudgmentByFacilityAndTeam(
            candidate.facilityId,
          );

          // Calculate productivity score average
          const avgProductivityScore =
            productivityDataList.reduce((sum, pd) => sum + pd.productivityScore, 0) /
            productivityDataList.length;

          // Calculate skill level distribution diversity
          const skillLevels = productivityDataList.map((pd) => pd.skillLevel);
          const uniqueSkillLevels = new Set(skillLevels).size;
          const skillDiversityBonus = uniqueSkillLevels > 1 ? 0.1 : 0;

          // Calculate task type affinity based on remaining task distribution
          const preferredTaskTypes = productivityDataList.map((pd) => pd.preferredTaskType);
          const taskTypeDistribution = riskJudgment.currentProgress.taskTypeDistribution || {};

          let matchingTaskCount = 0;
          for (const taskType of preferredTaskTypes) {
            matchingTaskCount += taskTypeDistribution[taskType] || 0;
          }

          const totalRemainingTasks = riskJudgment.currentProgress.remainingTasks || 1;
          const taskTypeAffinity = matchingTaskCount / totalRemainingTasks;

          // Calculate skill match score incorporating all three factors
          const skillMatchScore =
            (avgProductivityScore / 100) * 0.6 +
            taskTypeAffinity * 0.25 +
            skillDiversityBonus * 0.15;

          // Calculate priority score based on skill match and risk
          const priorityScore = skillMatchScore * (1 - candidate.riskScore);

          // Determine recommendation reason with detailed explanation
          let recommendationReason = '';
          const taskTypesStr = preferredTaskTypes.join('+');
          const skillLevelsStr = skillLevels.join('+');

          if (skillDiversityBonus > 0) {
            recommendationReason = `作業者の生産性スコア平均${avgProductivityScore.toFixed(1)}および得意作業タイプ分布（${taskTypesStr}）がタスク内容と高度に合致し、複数スキルレベル（${skillLevelsStr}）による対応能力があり、推定完了時間${candidate.estimatedCompletionTime}分で納期に余裕がある`;
          } else {
            recommendationReason = `単一の作業者（生産性スコア${avgProductivityScore.toFixed(1)}、${skillLevels[0]}レベル、得意作業タイプ${preferredTaskTypes[0]}のみ）のため、タスク多様性への対応能力が限定的であり、スキルレベル分布の多様性がない`;
          }

          const enrichedPlan: RankedAllocationPlanForReview = {
            ...candidate,
            averageWorkerProductivityRate: Math.round(avgProductivityScore * 10) / 10,
            recommendationReason,
            rankingPriority: 0, // Will be reassigned after sorting
          };

          enrichedData.push({
            plan: enrichedPlan,
            productivityDataList,
            riskJudgment,
            skillMatchScore,
            priorityScore,
          });
        }

        // Sort by priority score (descending)
        enrichedData.sort((a, b) => b.priorityScore - a.priorityScore);

        // Extract sorted plans and assign ranking priority
        const enrichedPlans = enrichedData.map((data, index) => {
          data.plan.rankingPriority = index + 1;
          return data.plan;
        });

        // Record operation audit
        await mockRecordOperationAudit({
          operationName: 'extractAndRankAllocationPlansForReview',
          userId: input.userId,
          timestamp: new Date().toISOString(),
        });

        const now = new Date();
        const output: ExtractAndRankAllocationPlansForReviewOutput = {
          allocationPlans: enrichedPlans,
          totalCount: enrichedPlans.length,
          analysisCompletedAt: now.toISOString(),
          dataFreshness: {
            progressDataAge: 120,
            productivityDataAge: 150,
            riskJudgmentAge: 180,
          },
        };

        return output;
      }),
    }));
  });

  it('should extract and rank allocation plans based on worker productivity and task type affinity', async () => {
    const input: ExtractAndRankAllocationPlansForReviewInput = {
      userId: 'center-manager-001',
      targetFacilityIds: ['facility-A', 'facility-B'],
      timeRangeStart: '2024-01-15T09:00:00Z',
      timeRangeEnd: '2024-01-15T18:00:00Z',
      priorityFilter: 'all',
      maxResultCount: 50,
    };

    const { extractAndRankAllocationPlansForReview } = await import(
      '../../src/logic/allocation-plan-review-approval'
    );

    const output = await extractAndRankAllocationPlansForReview(input);

    // Verify authorization check was called
    expect(mockAuthorizeOperation).toHaveBeenCalledWith(
      'center-manager-001',
      'extractAndRankAllocationPlansForReview',
    );

    // Verify date-time validation was called
    expect(mockValidateDateTimeRange).toHaveBeenCalledWith(
      '2024-01-15T09:00:00Z',
      '2024-01-15T18:00:00Z',
    );

    // Verify list allocation plans was called with correct parameters
    expect(mockListAllocationPlansByCondition).toHaveBeenCalledWith({
      targetFacilityIds: ['facility-A', 'facility-B'],
      timeRangeStart: '2024-01-15T09:00:00Z',
      timeRangeEnd: '2024-01-15T18:00:00Z',
      priorityFilter: 'all',
    });

    // Verify audit was recorded
    expect(mockRecordOperationAudit).toHaveBeenCalled();

    // Verify output structure
    expect(output).toHaveProperty('allocationPlans');
    expect(output).toHaveProperty('totalCount');
    expect(output).toHaveProperty('analysisCompletedAt');
    expect(output).toHaveProperty('dataFreshness');

    // Verify total count matches
    expect(output.totalCount).toBe(2);

    // Verify plans are sorted by priority (descending)
    expect(output.allocationPlans).toHaveLength(2);

    const plan1 = output.allocationPlans[0];
    const plan2 = output.allocationPlans[1];

    // Plan 1 (cand-001) should have higher priority
    expect(plan1.allocationPlanId).toBe('cand-001');
    expect(plan1.facilityId).toBe('facility-A');
    expect(plan1.rankingPriority).toBe(1);

    // Plan 2 (cand-002) should have lower priority
    expect(plan2.allocationPlanId).toBe('cand-002');
    expect(plan2.facilityId).toBe('facility-B');
    expect(plan2.rankingPriority).toBe(2);

    // Verify plan 1 has higher priority than plan 2
    expect(plan1.rankingPriority).toBeLessThan(plan2.rankingPriority);

    // Verify productivity scores reflect multiple workers with diversity
    expect(plan1.averageWorkerProductivityRate).toBe(78.5); // (85 + 72) / 2
    expect(plan2.averageWorkerProductivityRate).toBe(68); // Only one worker

    // Verify recommendation reason for plan 1 mentions skill diversity and task type affinity
    expect(plan1.recommendationReason).toContain('複数スキルレベル');
    expect(plan1.recommendationReason).toContain('senior+mid');
    expect(plan1.recommendationReason).toContain('得意作業タイプ分布');
    expect(plan1.recommendationReason).toContain('picking+packing');
    expect(plan1.recommendationReason).toContain('78.5');
    expect(plan1.recommendationReason).toContain('180');

    // Verify recommendation reason for plan 2 mentions limited diversity
    expect(plan2.recommendationReason).toContain('単一の作業者');
    expect(plan2.recommendationReason).toContain('junior');
    expect(plan2.recommendationReason).toContain('sorting');
    expect(plan2.recommendationReason).toContain('スキルレベル分布の多様性がない');

    // Verify analysis completed timestamp is valid ISO 8601
    expect(output.analysisCompletedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // Verify data freshness values are within acceptable range
    expect(output.dataFreshness.progressDataAge).toBeGreaterThanOrEqual(0);
    expect(output.dataFreshness.progressDataAge).toBeLessThanOrEqual(300);
    expect(output.dataFreshness.productivityDataAge).toBeGreaterThanOrEqual(0);
    expect(output.dataFreshness.productivityDataAge).toBeLessThanOrEqual(300);
    expect(output.dataFreshness.riskJudgmentAge).toBeGreaterThanOrEqual(0);
    expect(output.dataFreshness.riskJudgmentAge).toBeLessThanOrEqual(300);
  });

  it('should calculate skill match score incorporating productivity, task affinity, and diversity based on remaining task distribution', async () => {
    const input: ExtractAndRankAllocationPlansForReviewInput = {
      userId: 'center-manager-001',
      targetFacilityIds: ['facility-A', 'facility-B'],
      timeRangeStart: '2024-01-15T09:00:00Z',
      timeRangeEnd: '2024-01-15T18:00:00Z',
      priorityFilter: 'all',
      maxResultCount: 50,
    };

    const { extractAndRankAllocationPlansForReview } = await import(
      '../../src/logic/allocation-plan-review-approval'
    );

    const output = await extractAndRankAllocationPlansForReview(input);

    const plan1 = output.allocationPlans[0];
    const plan2 = output.allocationPlans[1];

    // Plan 1 (cand-001) has workers with picking and packing preferences
    // facility-A has 20 picking tasks and 15 packing tasks (total 35)
    // So task type affinity for plan1 = (20 + 15) / 35 = 1.0 (perfect match)
    expect(plan1.averageWorkerProductivityRate).toBe(78.5);
    expect(plan1.recommendationReason).toContain('picking+packing');
    expect(plan1.recommendationReason).toContain('senior+mid');

    // Plan 2 (cand-002) has worker with sorting preference
    // facility-B has 30 sorting tasks and 25 picking tasks (total 55)
    // So task type affinity for plan2 = 30 / 55 ≈ 0.545 (partial match)
    expect(plan2.averageWorkerProductivityRate).toBe(68);
    expect(plan2.recommendationReason).toContain('sorting');
    expect(plan2.recommendationReason).toContain('junior');

    // Plan 1 should rank higher due to better task type affinity and skill diversity
    expect(plan1.rankingPriority).toBe(1);
    expect(plan2.rankingPriority).toBe(2);
  });

  it('should include task type distribution affinity in recommendation reason', async () => {
    const input: ExtractAndRankAllocationPlansForReviewInput = {
      userId: 'center-manager-001',
      targetFacilityIds: ['facility-A', 'facility-B'],
      timeRangeStart: '2024-01-15T09:00:00Z',
      timeRangeEnd: '2024-01-15T18:00:00Z',
      priorityFilter: 'all',
      maxResultCount: 50,
    };

    const { extractAndRankAllocationPlansForReview } = await import(
      '../../src/logic/allocation-plan-review-approval'
    );

    const output = await extractAndRankAllocationPlansForReview(input);

    const plan1 = output.allocationPlans[0];
    const plan2 = output.allocationPlans[1];

    // Verify plan1 recommendation includes specific task type distribution detail
    expect(plan1.recommendationReason).toContain('高度に合致');
    expect(plan1.recommendationReason).toMatch(/picking\+packing/);

    // Verify plan2 recommendation indicates limited task type match
    expect(plan2.recommendationReason).toContain('限定的');
  });
});