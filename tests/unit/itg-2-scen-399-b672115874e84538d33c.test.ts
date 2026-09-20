import { executePlacementChangeWithApproval, ExecutePlacementChangeWithApprovalInput } from "../../src/logic/placement-change-execution";
import * as placementChangeExecution from "../../src/logic/placement-change-execution";

describe("SCEN-399: 配置先の作業タイプに対して作業者のスキルが不足している場合", () => {
  it("エラー「作業者のスキルが配置先の要件に合致しません。」が返される", async () => {
    // Arrange
    const placementProposalId = "proposal-001";
    const workerId = "worker-001";
    const approverUserId = "user-approver-001";
    const executorUserId = "user-executor-001";
    const requestTimestamp = new Date().toISOString();

    const input: ExecutePlacementChangeWithApprovalInput = {
      placementProposalId,
      approverUserId,
      executorUserId,
      requestTimestamp,
      approvalReason: "Production optimization",
      executionNotes: "Scheduled for next shift",
    };

    // スタブ処理: authorizeUserAction
    const authorizeUserActionSpy = jest
      .spyOn(placementChangeExecution, "authorizeUserAction" as any)
      .mockResolvedValue(true);

    // スタブ処理: validateInputData
    const validateInputDataSpy = jest
      .spyOn(placementChangeExecution, "validateInputData" as any)
      .mockResolvedValue(true);

    // スタブ処理: findPlacementPlanByWorkerAndDate
    const findPlacementPlanByWorkerAndDateSpy = jest
      .spyOn(placementChangeExecution, "findPlacementPlanByWorkerAndDate" as any)
      .mockResolvedValue({
        placementPlanId: "plan-001",
        workerId: workerId,
        departmentId: "dept-001",
        workTypeId: "worktype-001",
        startDate: new Date().toISOString(),
      });

    // スタブ処理: findWorkerById
    // 作業者のスキルセットは『基本操作』のみ
    const findWorkerByIdSpy = jest
      .spyOn(placementChangeExecution, "findWorkerById" as any)
      .mockResolvedValue({
        workerId: workerId,
        workerName: "Test Worker",
        skills: ["基本操作"],
      });

    // スタブ処理: findWorkTypeById
    // 配置先の作業タイプの必須スキル要件は『基本操作』『フォークリフト運転技能講習修了』
    const findWorkTypeByIdSpy = jest
      .spyOn(placementChangeExecution, "findWorkTypeById" as any)
      .mockResolvedValue({
        workTypeId: "worktype-001",
        workTypeName: "Forklift Operation",
        requiredSkills: ["基本操作", "フォークリフト運転技能講習修了"],
      });

    // スタブ処理: findDepartmentById
    const findDepartmentByIdSpy = jest
      .spyOn(placementChangeExecution, "findDepartmentById" as any)
      .mockResolvedValue({
        departmentId: "dept-001",
        departmentName: "Warehouse Department",
      });

    // スタブ処理: judgePersonnelReallocationFeasibility
    // 作業者スキルセット（『基本操作』）と配置先必須スキル要件
    // （『基本操作』『フォークリフト運転技能講習修了』）を比較し
    // SkillMismatchDetectedエラーを発生させる
    const judgePersonnelReallocationFeasibilitySpy = jest
      .spyOn(placementChangeExecution, "judgePersonnelReallocationFeasibility" as any)
      .mockRejectedValue(
        new Error("SkillMismatchDetected: 作業者のスキルが配置先の要件に合致しません。")
      );

    // Act - executePlacementChangeWithApprovalを呼び出す
    const result = await executePlacementChangeWithApproval(input);

    // Assert
    expect(result).toBeDefined();
    expect(result.success).toBe(false);
    expect(result.allocationChangeHistoryId).toBeNull();
    expect(result.newPlacementPlanId).toBeNull();
    expect(result.placementChangeDetails).toBeNull();
    expect(result.errorMessage).toBe(
      "作業者のスキルが配置先の要件に合致しません。"
    );
    expect(result.notificationStatus).toBeDefined();
    expect(result.notificationStatus.delivered).toBe(false);

    // スタブが適切に呼び出されたことを検証
    expect(authorizeUserActionSpy).toHaveBeenCalled();
    expect(validateInputDataSpy).toHaveBeenCalled();
    expect(findWorkerByIdSpy).toHaveBeenCalled();
    expect(findWorkTypeByIdSpy).toHaveBeenCalled();
    expect(findDepartmentByIdSpy).toHaveBeenCalled();
    expect(judgePersonnelReallocationFeasibilitySpy).toHaveBeenCalled();
  });
});