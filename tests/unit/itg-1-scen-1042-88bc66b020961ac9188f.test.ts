import { getWorkInstructionReceptionHistoryById } from "../../src/logic/data-persistence";

describe("SCEN-1042: 空文字列の受領履歴IDで照会するとエラーが発生する", () => {
  it("should throw InvalidReceptionHistoryId error when receptionHistoryId is empty string", async () => {
    const emptyReceptionHistoryId = "";

    await expect(
      getWorkInstructionReceptionHistoryById({
        receptionHistoryId: emptyReceptionHistoryId,
      })
    ).rejects.toMatchObject({
      name: "InvalidReceptionHistoryId",
      message: "Reception history ID must not be empty or null.",
    });
  });
});