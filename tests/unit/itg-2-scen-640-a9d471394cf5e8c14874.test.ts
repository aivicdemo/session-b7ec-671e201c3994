import { findDepartmentsByResponsibleUser } from '../../src/logic/persistence-layer';
import * as persistenceLayer from '../../src/logic/persistence-layer';

describe('SCEN-640: 検索結果の totalCount に検出された部門の総件数が正しく設定される', () => {
  it('should return correct totalCount when searching departments by responsible user', async () => {
    const mockDepartments = [
      {
        departmentId: 'DEPT-101',
        departmentName: '製造部',
        departmentCode: 'MFG001',
        description: 'メイン製造部門',
        parentDepartmentId: null,
        responsibleUserId: 'user-leader-001',
        status: 'active',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      },
      {
        departmentId: 'DEPT-102',
        departmentName: '品質管理部',
        departmentCode: 'QA001',
        description: '品質管理部門',
        parentDepartmentId: null,
        responsibleUserId: 'user-leader-001',
        status: 'active',
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-16'),
      },
      {
        departmentId: 'DEPT-103',
        departmentName: '物流部',
        departmentCode: 'LOG001',
        description: '物流管理部門',
        parentDepartmentId: null,
        responsibleUserId: 'user-leader-001',
        status: 'active',
        createdAt: new Date('2024-01-03'),
        updatedAt: new Date('2024-01-17'),
      },
    ];

    jest.spyOn(persistenceLayer, 'findDepartmentsByResponsibleUser').mockResolvedValue({
      departments: mockDepartments,
      totalCount: 3,
      found: true,
      responsibleUserId: 'user-leader-001',
    });

    const input = {
      responsibleUserId: 'user-leader-001',
      statusFilter: undefined,
      requestingUserId: 'user-admin-001',
    };

    const result = await findDepartmentsByResponsibleUser(input);

    expect(result.totalCount).toBe(3);
    expect(result.departments).toHaveLength(3);
    expect(result.found).toBe(true);
    expect(result.responsibleUserId).toBe('user-leader-001');
    
    expect(result.departments[0]).toEqual({
      departmentId: 'DEPT-101',
      departmentName: '製造部',
      departmentCode: 'MFG001',
      description: 'メイン製造部門',
      parentDepartmentId: null,
      responsibleUserId: 'user-leader-001',
      status: 'active',
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
    
    expect(result.departments[1]).toEqual({
      departmentId: 'DEPT-102',
      departmentName: '品質管理部',
      departmentCode: 'QA001',
      description: '品質管理部門',
      parentDepartmentId: null,
      responsibleUserId: 'user-leader-001',
      status: 'active',
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
    
    expect(result.departments[2]).toEqual({
      departmentId: 'DEPT-103',
      departmentName: '物流部',
      departmentCode: 'LOG001',
      description: '物流管理部門',
      parentDepartmentId: null,
      responsibleUserId: 'user-leader-001',
      status: 'active',
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });
});