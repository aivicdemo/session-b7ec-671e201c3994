import { saveAllocationExecutionStatus } from "../../src/logic/data-persistence";
import { getAllocationPlanById } from "../../src/logic/data-persistence";

jest.mock("../../src/logic/data-persistence", () => ({
  ...jest.requireActual("../../src/logic/data-persistence"),
  getAllocationPlanById: jest.fn(),
}));

describe("SCEN-820: saveAllocationExecutionStatus - AllocationPlanNotFound Error", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should throw AllocationPlanNotFound error when allocation plan does not exist", async () => {
    const mockGetAllocationPlanById = getAllocationPlanById as jest.MockedFunction<
      typeof getAllocationPlanById
    >;
    mockGetAllocationPlanById.mockResolvedValueOnce(null);

    const input = {
      allocationExecutionStatusId: null,
      allocationPlanId: "nonexistent-plan-id-12345",
      workInstructionId: "wi-001",
      workerId: "worker-001",
      facilityId: "facility-001",
      teamId: "team-001",
      allocationState: "進行中",
      plannedStartDateTime: "2025-01-15T09:00:00Z",
      plannedEndDateTime: "2025-01-15T17:00:00Z",
      actualStartDateTime: "2025-01-15T09:05:00Z",
      actualEndDateTime: null,
      plannedWorkHours: 8,
      actualWorkHours: null,
      progressRate: 25,
      delayFlag: false,
      remarks: null,
      createdBy: "user-admin-001",
      updatedBy: null,
    };

    await expect(saveAllocationExecutionStatus(input)).rejects.toThrow(
      expect.objectContaining({
        name: "AllocationPlanNotFound",
        message: "指定された人員配置案が見つかりません。",
      })
    );

    expect(mockGetAllocationPlanById).toHaveBeenCalledWith(
      "nonexistent-plan-id-12345"
    );
  });
});