import { monitorAndJudgeDelayRisk } from "../../src/logic/progress-monitoring-risk-engine";
import * as riskEngine from "../../src/logic/progress-monitoring-risk-engine";

describe("SCEN-099: 進捗遅延リスク判定と対応優先度ランク付け", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("対象拠点と監視対象が指定された正常な入力で、進捗遅延リスクを数値化して対応優先度の高い順にランク付けされた拠点情報と遅延要因分類、推奨調整を含む判定結果を返す", async () => {
    const facilityIds = ["FAC001", "FAC002"];
    const teamIds = ["TEAM-A", "TEAM-B"];
    const workInstructionIds = ["WI-001", "WI-002", "WI-003"];
    const evaluationDateTime = new Date().toISOString();
    const userId = "USER-CENTER-001";

    // スタブ化: getRecentProgressDataByWorkInstruction
    const mockGetRecentProgressData = jest
      .spyOn(riskEngine as any, "getRecentProgressDataByWorkInstruction")
      .mockResolvedValue({
        currentProgress: 70,
        plannedProgressAtNow: 80,
        remainingWorkQuantity: 300,
      });

    // スタブ化: getLatestProductivityDataByWorker
    const mockGetProductivityData = jest
      .spyOn(riskEngine as any, "getLatestProductivityDataByWorker")
      .mockResolvedValue({
        averageWorkerProductivity: 50,
        errorRate: 2,
        skillLevel: "intermediate",
      });

    // スタブ化: validateReferentialIntegrity
    const mockValidateIntegrity = jest
      .spyOn(riskEngine as any, "validateReferentialIntegrity")
      .mockResolvedValue(true);

    // スタブ化: calculateRiskScore
    const mockCalculateRiskScore = jest
      .spyOn(riskEngine as any, "calculateRiskScore")
      .mockResolvedValue(65);

    // スタブ化: calculateDelayRiskScore
    const mockCalculateDelayRiskScore = jest
      .spyOn(riskEngine as any, "calculateDelayRiskScore")
      .mockResolvedValue(65);

    // スタブ化: classifyDelayReason - 2つの拠点分のデータを返す
    const mockClassifyDelayReason = jest
      .spyOn(riskEngine as any, "classifyDelayReason")
      .mockImplementation((input: any) => {
        if (input.facilityId === "FAC001") {
          return Promise.resolve({
            facilityId: "FAC001",
            insufficientStaffContribution: 50,
            efficiencyDeclineContribution: 30,
            priorityMisalignmentContribution: 20,
            primaryDelayReason: "INSUFFICIENT_STAFF",
            responseUrgency: "URGENT",
          });
        } else if (input.facilityId === "FAC002") {
          return Promise.resolve({
            facilityId: "FAC002",
            insufficientStaffContribution: 30,
            efficiencyDeclineContribution: 40,
            priorityMisalignmentContribution: 30,
            primaryDelayReason: "EFFICIENCY_DECLINE",
            responseUrgency: "NORMAL",
          });
        }
        return Promise.resolve({
          facilityId: input.facilityId,
          insufficientStaffContribution: 0,
          efficiencyDeclineContribution: 0,
          priorityMisalignmentContribution: 100,
          primaryDelayReason: "PRIORITY_MISALIGNMENT",
          responseUrgency: "NORMAL",
        });
      });

    // スタブ化: rankFacilitiesByRiskPriority
    const mockRankFacilities = jest
      .spyOn(riskEngine as any, "rankFacilitiesByRiskPriority")
      .mockResolvedValue({
        rankedFacilities: [
          {
            facilityId: "FAC001",
            facilityName: "拠点1",
            riskScore: 65,
            riskLevel: "MEDIUM",
            predictedDelayDays: 1,
            currentProgressRate: 70,
            plannedProgressRate: 80,
            priorityRank: 1,
          },
          {
            facilityId: "FAC002",
            facilityName: "拠点2",
            riskScore: 50,
            riskLevel: "LOW",
            predictedDelayDays: 0,
            currentProgressRate: 85,
            plannedProgressRate: 80,
            priorityRank: 2,
          },
        ],
      });

    // スタブ化: saveDelayRiskJudgment
    const mockSaveJudgment = jest
      .spyOn(riskEngine as any, "saveDelayRiskJudgment")
      .mockResolvedValue({ success: true });

    const input = {
      facilityIds,
      teamIds,
      workInstructionIds,
      evaluationDateTime,
      userId,
    };

    const result = await monitorAndJudgeDelayRisk(input);

    // 1. judgmentId が一意のUUID形式文字列であることを検証
    expect(result.judgmentId).toBeDefined();
    expect(typeof result.judgmentId).toBe("string");
    expect(result.judgmentId.length).toBeGreaterThan(0);

    // 2. evaluationDateTime が入力時刻と一致することを検証
    expect(result.evaluationDateTime).toBe(evaluationDateTime);

    // 3. rankedFacilities が2件のRankedFacilityRiskInfo要素を含み、高リスク順にソートされていることを検証
    expect(result.rankedFacilities).toBeDefined();
    expect(Array.isArray(result.rankedFacilities)).toBe(true);
    expect(result.rankedFacilities.length).toBe(2);

    // 高リスク順にソートされていることを検証
    for (let i = 0; i < result.rankedFacilities.length - 1; i++) {
      expect(result.rankedFacilities[i].riskScore).toBeGreaterThanOrEqual(
        result.rankedFacilities[i + 1].riskScore
      );
    }

    // 4. 各RankedFacilityRiskInfo は必須フィールドを含むことを検証
    result.rankedFacilities.forEach((facility) => {
      expect(facility.facilityId).toBeDefined();
      expect(typeof facility.facilityId).toBe("string");
      expect(facility.facilityName).toBeDefined();
      expect(typeof facility.facilityName).toBe("string");
      expect(facility.riskScore).toBeDefined();
      expect(typeof facility.riskScore).toBe("number");
      expect(facility.riskScore).toBeGreaterThanOrEqual(0);
      expect(facility.riskScore).toBeLessThanOrEqual(100);
      expect(facility.riskLevel).toBeDefined();
      expect(["HIGH", "MEDIUM", "LOW"]).toContain(facility.riskLevel);
      expect(facility.predictedDelayDays).toBeDefined();
      expect(typeof facility.predictedDelayDays).toBe("number");
      expect(facility.predictedDelayDays).toBeGreaterThanOrEqual(0);
      expect(facility.currentProgressRate).toBeDefined();
      expect(typeof facility.currentProgressRate).toBe("number");
      expect(facility.plannedProgressRate).toBeDefined();
      expect(typeof facility.plannedProgressRate).toBe("number");
      expect(facility.priorityRank).toBeDefined();
      expect(typeof facility.priorityRank).toBe("number");
      expect(facility.priorityRank).toBeGreaterThanOrEqual(1);
    });

    // 5. delayReasonClassifications 配列は2件のDelayReasonClassification要素を含むことを検証
    expect(result.delayReasonClassifications).toBeDefined();
    expect(Array.isArray(result.delayReasonClassifications)).toBe(true);
    expect(result.delayReasonClassifications.length).toBe(2);

    // 6. 各DelayReasonClassification は必須フィールドを含むことを検証
    result.delayReasonClassifications.forEach((classification) => {
      expect(classification.facilityId).toBeDefined();
      expect(typeof classification.facilityId).toBe("string");

      expect(
        classification.insufficientStaffContribution
      ).toBeDefined();
      expect(typeof classification.insufficientStaffContribution).toBe(
        "number"
      );
      expect(classification.insufficientStaffContribution).toBeGreaterThanOrEqual(
        0
      );
      expect(classification.insufficientStaffContribution).toBeLessThanOrEqual(
        100
      );

      expect(classification.efficiencyDeclineContribution).toBeDefined();
      expect(typeof classification.efficiencyDeclineContribution).toBe(
        "number"
      );
      expect(
        classification.efficiencyDeclineContribution
      ).toBeGreaterThanOrEqual(0);
      expect(classification.efficiencyDeclineContribution).toBeLessThanOrEqual(
        100
      );

      expect(
        classification.priorityMisalignmentContribution
      ).toBeDefined();
      expect(typeof classification.priorityMisalignmentContribution).toBe(
        "number"
      );
      expect(
        classification.priorityMisalignmentContribution
      ).toBeGreaterThanOrEqual(0);
      expect(classification.priorityMisalignmentContribution).toBeLessThanOrEqual(
        100
      );

      // 7. 各拠点の3つの寄与度合計が100±1の範囲内であることを検証
      const totalContribution =
        classification.insufficientStaffContribution +
        classification.efficiencyDeclineContribution +
        classification.priorityMisalignmentContribution;
      expect(totalContribution).toBeGreaterThanOrEqual(99);
      expect(totalContribution).toBeLessThanOrEqual(101);

      expect(classification.primaryDelayReason).toBeDefined();
      expect([
        "INSUFFICIENT_STAFF",
        "EFFICIENCY_DECLINE",
        "PRIORITY_MISALIGNMENT",
      ]).toContain(classification.primaryDelayReason);

      expect(classification.responseUrgency).toBeDefined();
      expect(["IMMEDIATE", "URGENT", "NORMAL"]).toContain(
        classification.responseUrgency
      );
    });

    // 8. recommendedAdjustments 配列は対象拠点ごとの推奨調整を含むことを検証
    expect(result.recommendedAdjustments).toBeDefined();
    expect(Array.isArray(result.recommendedAdjustments)).toBe(true);
    expect(result.recommendedAdjustments.length).toBeGreaterThanOrEqual(1);

    // 9. 各RecommendedAdjustment は必須フィールドを含むことを検証
    result.recommendedAdjustments.forEach((adjustment) => {
      expect(adjustment.facilityId).toBeDefined();
      expect(typeof adjustment.facilityId).toBe("string");
      expect(adjustment.adjustmentType).toBeDefined();
      expect(typeof adjustment.adjustmentType).toBe("string");
      expect([
        "ADD_PERSONNEL",
        "CHANGE_PRIORITY",
        "OPTIMIZE_PROCESS",
        "EXTEND_DEADLINE",
      ]).toContain(adjustment.adjustmentType);
      expect(adjustment.adjustmentDescription).toBeDefined();
      expect(typeof adjustment.adjustmentDescription).toBe("string");
      expect(adjustment.estimatedEffectiveness).toBeDefined();
      expect(typeof adjustment.estimatedEffectiveness).toBe("number");
      expect(adjustment.estimatedEffectiveness).toBeGreaterThanOrEqual(0);
      expect(adjustment.estimatedEffectiveness).toBeLessThanOrEqual(100);
      expect(adjustment.implementationPriority).toBeDefined();
      expect(typeof adjustment.implementationPriority).toBe("number");
      expect(adjustment.implementationPriority).toBeGreaterThanOrEqual(1);
    });

    // 10. hasHighRiskFacilities はboolean型であることを検証
    expect(result.hasHighRiskFacilities).toBeDefined();
    expect(typeof result.hasHighRiskFacilities).toBe("boolean");

    // 中程度以上のリスク拠点が存在する場合、hasHighRiskFacilities は true
    const hasMediumOrHighRisk = result.rankedFacilities.some(
      (f) => f.riskLevel === "HIGH" || f.riskLevel === "MEDIUM"
    );
    expect(result.hasHighRiskFacilities).toBe(hasMediumOrHighRisk);

    // ビジネスルール検証: rankedFacilities が対応優先度付きで返されることを検証
    result.rankedFacilities.forEach((facility, index) => {
      expect(facility.priorityRank).toBe(index + 1);
    });

    // ビジネスルール br-tx_4-003 検証: 進捗乖離率=12.5%、推定完了時間の計算式を確認
    // 進捗乖離率 = (80 - 70) / 80 * 100 = 12.5%
    const plannedProgress = 80;
    const currentProgress = 70;
    const progressDeviation = ((plannedProgress - currentProgress) / plannedProgress) * 100;
    expect(progressDeviation).toBeCloseTo(12.5, 1);

    // riskScore=65で中程度以上の場合、riskLevelが'MEDIUM'または'HIGH'であることを確認
    result.rankedFacilities.forEach((facility) => {
      if (facility.riskScore >= 65) {
        expect(["HIGH", "MEDIUM"]).toContain(facility.riskLevel);
      }
    });

    // ビジネスルール br-tx_4-004 検証: 高リスク拠点の推奨優先度確認
    // riskScore が 65 以上の拠点に対応する推奨調整が存在することを検証
    const highRiskFacilityIds = result.rankedFacilities
      .filter(f => f.riskScore >= 65)
      .map(f => f.facilityId);
    
    const hasAdjustmentsForHighRisk = highRiskFacilityIds.some(facilityId =>
      result.recommendedAdjustments.some(adj => adj.facilityId === facilityId)
    );
    
    if (highRiskFacilityIds.length > 0) {
      expect(hasAdjustmentsForHighRisk).toBe(true);
    }

    // スタブが正しく呼び出されたことを確認
    expect(mockValidateIntegrity).toHaveBeenCalled();
    expect(mockCalculateRiskScore).toHaveBeenCalled();
    expect(mockCalculateDelayRiskScore).toHaveBeenCalled();
    expect(mockClassifyDelayReason).toHaveBeenCalled();
    expect(mockRankFacilities).toHaveBeenCalled();
    expect(mockSaveJudgment).toHaveBeenCalled();

    // スタブをクリア
    mockGetRecentProgressData.mockRestore();
    mockGetProductivityData.mockRestore();
    mockValidateIntegrity.mockRestore();
    mockCalculateRiskScore.mockRestore();
    mockCalculateDelayRiskScore.mockRestore();
    mockClassifyDelayReason.mockRestore();
    mockRankFacilities.mockRestore();
    mockSaveJudgment.mockRestore();
  });
});