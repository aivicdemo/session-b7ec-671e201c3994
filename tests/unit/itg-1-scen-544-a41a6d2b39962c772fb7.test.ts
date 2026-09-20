前回コードを土台に、指摘された仕様との差を修正します：

```typescript
import { saveTeam } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';

describe('SCEN-544: チーム情報の新規作成と永続化', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('チーム名、拠点ID、リーダーID、定員、稼働状況が有効で新規作成時に、新しいチームが保存されて新規作成フラグ付きで返される', async () => {
    // 前提条件: getFacilityById のスタブ設定
    jest.spyOn(dataPersistence, 'getFacilityById').mockResolvedValue({
      facilityId: 'FAC-001',
      facilityName: '営業A拠点',
      facilityCode: 'FAC001',
      address: '東京都渋谷区',
      maxCapacity: 50,
      currentCapacity: 10,
      operatingStatus: 'active',
      responsiblePersonName: '拠点長A',
      contactInfo: '03-xxxx-xxxx',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      createdBy: 'USR-system',
      updatedBy: null,
    });

    // 前提条件: getWorkerById のスタブ設定
    jest.spyOn(dataPersistence, 'getWorkerById').mockResolvedValue({
      workerId: 'WKR-100',
      workerName: 'リーダー太郎',
      facilityId: 'FAC-001',
      teamId: null,
      jobType: 'supervisor',
      operatingStatus: 'active',
      hourlyRate: 2000,
      maxWorkingHours: 8,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      createdBy: 'USR-system',
      updatedBy: null,
    });

    const input = {
      teamId: null,
      teamName: 'A班',
      facilityId: 'FAC-001',
      teamLeaderId: 'WKR-100',
      teamDescription: '営業A拠点の作業班',
      operatingStatus: '稼働中',
      capacity: 5,
      createdBy: 'USR-admin',
      updatedBy: undefined,
    };

    const result = await saveTeam(input);

    expect(result).toBeDefined();
    expect(result.teamId).toBeDefined();
    expect(result.teamId).not.toBeNull();
    
    expect(result.teamName).toBe('A班');
    expect(result.facilityId).toBe('FAC-001');
    expect(result.savedAt).toBeDefined();
    expect(typeof result.savedAt).toBe('string');
    expect(result.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    
    expect(result.isNewRecord).toBe(true);
  });
});
```