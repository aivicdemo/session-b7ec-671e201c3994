import { saveProficiency } from "../../src/logic/data-persistence";
import * as dataPersistence from "../../src/logic/data-persistence";

describe("SCEN-637: 作業者習熟度管理 - 作業者不在エラー", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("指定されたworkerIdが存在しないと作業者不在エラーが発生する", async () => {
    // スタブ設定: getWorkerById('WORKER_NOT_EXIST') を呼び出す時点で null を返す
    const getWorkerByIdSpy = jest
      .spyOn(dataPersistence, "getWorkerById")
      .mockResolvedValue(null);

    const input = {
      proficiencyId: null,
      workerId: "WORKER_NOT_EXIST",
      jobType: "梱包",
      proficiencyLevel: "中級",
      evaluationDate: "2025-01-15",
      evaluatedBy: "EVALUATOR_001",
      remarks: null,
      createdBy: "CREATOR_001",
      updatedBy: undefined,
    };

    // saveProficiency関数が内部で getWorkerById('WORKER_NOT_EXIST') を呼び出したとき、
    // スタブからnullが返される。WorkerNotFoundエラーが発生する。
    const thrownError = await saveProficiency(input).catch((e) => e);

    // エラーが発生したことを確認
    expect(thrownError).toBeDefined();
    
    // エラーメッセージを検証
    expect(thrownError.message).toBe(
      "指定された作業者ID WORKER_NOT_EXIST は存在しません。"
    );

    // getWorkerById が呼び出されたことを確認
    expect(getWorkerByIdSpy).toHaveBeenCalledWith("WORKER_NOT_EXIST");

    // 出力型 SaveProficiencyOutput は返されない（エラーのみ）
    expect(thrownError instanceof Error).toBe(true);
  });
});