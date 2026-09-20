import { listDelayRiskJudgmentByCondition } from "../../src/logic/data-persistence";

describe("SCEN-1014: 存在しない作業指示IDを指定した場合はエラーを返す", () => {
  it("should throw ReferentialIntegrityError when non-existent work instruction IDs are provided", async () => {
    const nonExistentWorkInstructionIds = ["WI-NONEXISTENT-001"];

    const condition = {
      workInstructionIds: nonExistentWorkInstructionIds,
      riskJudgmentIds: null,
      facilityIds: null,
      teamIds: null,
      riskLevels: null,
      actionStatuses: null,
      minDelayPredictionDays: null,
      maxDelayPredictionDays: null,
      minProgressRate: null,
      maxProgressRate: null,
      judgmentDateFromDateTime: null,
      judgmentDateToDateTime: null,
      createdFromDate: null,
      createdToDate: null,
      updatedFromDate: null,
      updatedToDate: null,
      sortBy: null,
      sortOrder: null,
      pageNumber: null,
      pageSize: null,
    };

    await expect(
      listDelayRiskJudgmentByCondition(condition)
    ).rejects.toMatchObject({
      name: "ReferentialIntegrityError",
      message: "指定された拠点・チーム・作業指示が見つかりません。",
    });
  });
});