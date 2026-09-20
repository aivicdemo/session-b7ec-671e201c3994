import { generateAllocationPlans } from "../../src/logic/personnel-allocation-optimizer";
import { GenerateAllocationPlansInput } from "../../src/logic/personnel-allocation-optimizer";

describe("SCEN-161: 生成処理のタイムスタンプがgenerationSummaryに記録される", () => {
  it("generateAllocationPlans の呼び出し時刻を generationSummary.generationTimestamp に記録", () => {
    // 手順1: generateAllocationPlans の呼び出し直前に現在時刻を記録する
    const beforeCallTimestamp = new Date().toISOString();

    // 手順2: 入力データを準備する
    const input: GenerateAllocationPlansInput = {
      delayRiskJudgments: [
        {
          riskJudgmentId: "risk-judgment-001",
          workInstructionId: "work-instr-001",
          facilityId: "facility-001",
          teamId: "team-001",
          riskLevel: "HIGH",
          delayPredictionDays: 2,
          currentProgressRate: 40,
          plannedProgressRate: 60,
          recommendedAction: "人員追加配置が必要",
        },
      ],
      productivityData: [
        {
          workerId: "worker-001",
          facilityId: "facility-001",
          teamId: "team-001",
          productivityRate: 0.85,
          qualityScore: 92,
          proficiencyLevel: "INTERMEDIATE",
          recentWorkResults: [
            {
              workInstructionId: "work-instr-001",
              completionRate: 0.75,
              errorCount: 2,
            },
          ],
        },
        {
          workerId: "worker-002",
          facilityId: "facility-001",
          teamId: "team-001",
          productivityRate: 0.92,
          qualityScore: 95,
          proficiencyLevel: "ADVANCED",
          recentWorkResults: [
            {
              workInstructionId: "work-instr-001",
              completionRate: 0.88,
              errorCount: 1,
            },
          ],
        },
      ],
      targetFacilityIds: ["facility-001"],
      targetTeamIds: ["team-001"],
      workInstructionIds: ["work-instr-001"],
      generationStrategy: "balance_risk_and_efficiency",
      minimumFeasibilityThreshold: 60,
      requestedBy: "user-001",
    };

    // 手順3: generateAllocationPlans(input) を呼び出し
    const output = generateAllocationPlans(input);

    // 手順4: output.generationSummary.generationTimestamp の値を確認
    const generationTimestamp = output.generationSummary.generationTimestamp;

    // 手順5: タイムスタンプが ISO 8601 形式であることを検証
    // ISO 8601 形式のパターン（例：2024-01-15T14:30:45.123Z）
    const iso8601Pattern =
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
    expect(generationTimestamp).toMatch(iso8601Pattern);

    // タイムスタンプが呼び出し前の時刻以降であることを確認
    const timestampDate = new Date(generationTimestamp);
    const beforeCallDate = new Date(beforeCallTimestamp);
    expect(timestampDate.getTime()).toBeGreaterThanOrEqual(
      beforeCallDate.getTime()
    );

    // 有効な ISO 8601 形式の日付が解析できることを確認
    expect(isNaN(timestampDate.getTime())).toBe(false);
  });
});