import { listWorkersByCondition } from "../../src/logic/data-persistence";

describe("SCEN-615: listWorkersByCondition with invalid date range", () => {
  it("should throw InvalidSearchConditionError when updatedFromDate is after updatedToDate", async () => {
    const input = {
      updatedFromDate: "2024-12-31",
      updatedToDate: "2024-12-25",
    };

    await expect(listWorkersByCondition(input)).rejects.toThrow(
      expect.objectContaining({
        name: "InvalidSearchConditionError",
        message: "検索条件の日付範囲が不正です。開始日時は終了日時以前である必要があります。",
      })
    );
  });
});