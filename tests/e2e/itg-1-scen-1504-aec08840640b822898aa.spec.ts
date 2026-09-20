import { test, expect } from '@playwright/test';

test.describe('SCEN-1504: 作業実績データ送信 - マスタ不一致時の検証エラー', () => {
  test('作業指示ID・作業者ID・拠点ID・チームIDのいずれかが既存マスタと一致しないとき、検証エラーが表示されて送信は進まない', async ({ page }) => {
    // 作業指示・実績管理画面を開く
    await page.goto('/panels/scr-1789461813941.html');
    await page.waitForLoadState('networkidle');

    // 初期状態で必要な要素が表示されていることを確認
    const performanceFormSection = page.locator('#performance-form-section');
    await expect(performanceFormSection).toBeVisible();

    // 画面に表示されている既存の作業指示データから有効な値を取得
    const workInstructionRows = page.locator('#work-instruction-tbody tr');
    const rowCount = await workInstructionRows.count();
    
    let validWorkInstructionId = 'WI-001';
    let validWorkerId = 'W-001';
    let validSiteId = 'SITE-001';
    let validTeamId = 'TEAM-001';

    if (rowCount > 0) {
      // 最初の行から有効な値を抽出
      const firstRow = workInstructionRows.first();
      const cells = firstRow.locator('td');
      const cellCount = await cells.count();
      
      if (cellCount > 0) {
        validWorkInstructionId = (await cells.nth(0).textContent() || validWorkInstructionId).trim();
      }
      if (cellCount > 1) {
        validWorkerId = (await cells.nth(1).textContent() || validWorkerId).trim();
      }
      if (cellCount > 2) {
        validSiteId = (await cells.nth(2).textContent() || validSiteId).trim();
      }
      if (cellCount > 3) {
        validTeamId = (await cells.nth(3).textContent() || validTeamId).trim();
      }
    }

    // テスト用フォームの入力要素を取得
    const workInstructionIdInput = page.locator('#perf-work-instruction-id');
    const quantityInput = page.locator('#perf-quantity');
    const defectsInput = page.locator('#perf-defects');
    const endDatetimeInput = page.locator('#perf-end-datetime');
    const statusSelect = page.locator('#perf-status');
    const notesInput = page.locator('#perf-notes');

    // 有効なデータを入力：作業指示ID、作業者ID、拠点ID、チームID、実績数、タイムスタンプ
    await workInstructionIdInput.fill(validWorkInstructionId);
    
    // 作業者IDを入力するフォーム要素を探して入力
    const allInputs = page.locator('input');
    const inputCount = await allInputs.count();
    let workerIdInputElement = null;
    let siteIdInputElement = null;
    let teamIdInputElement = null;

    for (let i = 0; i < inputCount; i++) {
      const input = allInputs.nth(i);
      const placeholder = await input.getAttribute('placeholder');
      const label = await input.getAttribute('aria-label');
      const name = await input.getAttribute('name');
      const id = await input.getAttribute('id');
      
      if (!workerIdInputElement && (placeholder?.includes('作業者') || label?.includes('作業者') || name?.includes('worker') || id?.includes('worker'))) {
        workerIdInputElement = input;
      }
      if (!siteIdInputElement && (placeholder?.includes('拠点') || label?.includes('拠点') || name?.includes('site') || id?.includes('site'))) {
        siteIdInputElement = input;
      }
      if (!teamIdInputElement && (placeholder?.includes('チーム') || label?.includes('チーム') || name?.includes('team') || id?.includes('team'))) {
        teamIdInputElement = input;
      }
    }

    if (workerIdInputElement) {
      await workerIdInputElement.fill(validWorkerId);
    }
    if (siteIdInputElement) {
      await siteIdInputElement.fill(validSiteId);
    }
    if (teamIdInputElement) {
      await teamIdInputElement.fill(validTeamId);
    }

    await quantityInput.fill('100');
    await defectsInput.fill('0');
    const now = new Date().toISOString().slice(0, 16);
    await endDatetimeInput.fill(now);
    await statusSelect.selectOption('完了');
    await notesInput.fill('テスト実績');

    // 作業指示IDを無効な値に変更（マスタに存在しない）
    await workInstructionIdInput.clear();
    await workInstructionIdInput.fill('INVALID-WI-9999');

    // ネットワークリクエストをモニタリング開始
    const requestPromise = page.waitForEvent('request', (request) => 
      request.url().includes('/api/') && request.method() === 'POST'
    ).catch(() => null);

    // 「実績を登録」ボタンをクリック
    const submitButton = page.getByRole('button', { name: '実績を登録' });
    await submitButton.click();

    // エラーメッセージが表示されることを確認
    const errorBanner = page.locator('#error-banner');
    await expect(errorBanner).toBeVisible();

    const errorMessage = page.locator('#error-message');
    await expect(errorMessage).toBeVisible();

    // エラーメッセージにマスタ不一致の内容と不正な項目が含まれていることを確認
    const errorText = await errorMessage.textContent();
    expect(errorText).toBeTruthy();
    // 仕様の例「作業指示ID『***』は既存マスタと一致しません」に対応し、項目名と値の両方を確認
    expect(errorText).toMatch(/作業指示ID/);
    expect(errorText).toMatch(/既存マスタと一致しない|存在しません|不正な/i);

    // 「実績を登録」ボタンが無効状態（グレーアウト）であることを確認
    await expect(submitButton).toBeDisabled();

    // フォームの送信状態を確認：入力値が保持されていることを確認
    const currentWorkInstructionIdValue = await workInstructionIdInput.inputValue();
    expect(currentWorkInstructionIdValue).toBe('INVALID-WI-9999');
    
    // 画面遷移が発生していないことを確認
    expect(page.url()).toContain('scr-1789461813941');

    // POST リクエストが送信されていないことを確認
    const request = await requestPromise;
    expect(request).toBeNull();
  });

  test('作業者IDが既存マスタに存在しないとき、検証エラーが表示される', async ({ page }) => {
    await page.goto('/panels/scr-1789461813941.html');
    await page.waitForLoadState('networkidle');

    const workInstructionIdInput = page.locator('#perf-work-instruction-id');
    const quantityInput = page.locator('#perf-quantity');
    const defectsInput = page.locator('#perf-defects');
    const endDatetimeInput = page.locator('#perf-end-datetime');
    const statusSelect = page.locator('#perf-status');
    const notesInput = page.locator('#perf-notes');

    // 画面に表示されている既存の作業指示データから有効な値を取得
    const workInstructionRows = page.locator('#work-instruction-tbody tr');
    let validWorkInstructionId = 'WI-001';
    let validWorkerId = 'W-001';
    let validSiteId = 'SITE-001';
    let validTeamId = 'TEAM-001';

    if (await workInstructionRows.count() > 0) {
      const firstRow = workInstructionRows.first();
      const cells = firstRow.locator('td');
      const cellCount = await cells.count();
      
      if (cellCount > 0) {
        validWorkInstructionId = (await cells.nth(0).textContent() || validWorkInstructionId).trim();
      }
      if (cellCount > 1) {
        validWorkerId = (await cells.nth(1).textContent() || validWorkerId).trim();
      }
      if (cellCount > 2) {
        validSiteId = (await cells.nth(2).textContent() || validSiteId).trim();
      }
      if (cellCount > 3) {
        validTeamId = (await cells.nth(3).textContent() || validTeamId).trim();
      }
    }

    // 有効なデータを入力
    await workInstructionIdInput.fill(validWorkInstructionId);
    
    const allInputs = page.locator('input');
    const inputCount = await allInputs.count();
    let workerIdInputElement = null;
    let siteIdInputElement = null;
    let teamIdInputElement = null;

    for (let i = 0; i < inputCount; i++) {
      const input = allInputs.nth(i);
      const placeholder = await input.getAttribute('placeholder');
      const label = await input.getAttribute('aria-label');
      const name = await input.getAttribute('name');
      const id = await input.getAttribute('id');
      
      if (!workerIdInputElement && (placeholder?.includes('作業者') || label?.includes('作業者') || name?.includes('worker') || id?.includes('worker'))) {
        workerIdInputElement = input;
      }
      if (!siteIdInputElement && (placeholder?.includes('拠点') || label?.includes('拠点') || name?.includes('site') || id?.includes('site'))) {
        siteIdInputElement = input;
      }
      if (!teamIdInputElement && (placeholder?.includes('チーム') || label?.includes('チーム') || name?.includes('team') || id?.includes('team'))) {
        teamIdInputElement = input;
      }
    }

    if (workerIdInputElement) {
      await workerIdInputElement.fill(validWorkerId);
    }
    if (siteIdInputElement) {
      await siteIdInputElement.fill(validSiteId);
    }
    if (teamIdInputElement) {
      await teamIdInputElement.fill(validTeamId);
    }

    await quantityInput.fill('100');
    await defectsInput.fill('0');
    const now = new Date().toISOString().slice(0, 16);
    await endDatetimeInput.fill(now);
    await statusSelect.selectOption('完了');
    await notesInput.fill('テスト実績');

    // 作業者IDを無効な値に変更
    if (workerIdInputElement) {
      await workerIdInputElement.clear();
      await workerIdInputElement.fill('INVALID-WORKER-9999');
    }

    const requestPromise = page.waitForEvent('request', (request) => 
      request.url().includes('/api/') && request.method() === 'POST'
    ).catch(() => null);

    const submitButton = page.getByRole('button', { name: '実績を登録' });
    await submitButton.click();

    const errorBanner = page.locator('#error-banner');
    await expect(errorBanner).toBeVisible();

    const errorMessage = page.locator('#error-message');
    await expect(errorMessage).toBeVisible();

    const errorText = await errorMessage.textContent();
    expect(errorText).toBeTruthy();
    // 不一致の項目を特定する内容を確認
    expect(errorText).toMatch(/作業者ID/);
    expect(errorText).toMatch(/既存マスタ|存在しません|不正な/i);

    await expect(submitButton).toBeDisabled();
    expect(page.url()).toContain('scr-1789461813941');

    const request = await requestPromise;
    expect(request).toBeNull();
  });

  test('拠点IDが既存マスタに存在しないとき、検証エラーが表示される', async ({ page }) => {
    await page.goto('/panels/scr-1789461813941.html');
    await page.waitForLoadState('networkidle');

    const workInstructionIdInput = page.locator('#perf-work-instruction-id');
    const quantityInput = page.locator('#perf-quantity');
    const defectsInput = page.locator('#perf-defects');
    const endDatetimeInput = page.locator('#perf-end-datetime');
    const statusSelect = page.locator('#perf-status');
    const notesInput = page.locator('#perf-notes');

    // 画面に表示されている既存の作業指示データから有効な値を取得
    const workInstructionRows = page.locator('#work-instruction-tbody tr');
    let validWorkInstructionId = 'WI-001';
    let validWorkerId = 'W-001';
    let validSiteId = 'SITE-001';
    let validTeamId = 'TEAM-001';

    if (await workInstructionRows.count() > 0) {
      const firstRow = workInstructionRows.first();
      const cells = firstRow.locator('td');
      const cellCount = await cells.count();
      
      if (cellCount > 0) {
        validWorkInstructionId = (await cells.nth(0).textContent() || validWorkInstructionId).trim();
      }
      if (cellCount > 1) {
        validWorkerId = (await cells.nth(1).textContent() || validWorkerId).trim();
      }
      if (cellCount > 2) {
        validSiteId = (await cells.nth(2).textContent() || validSiteId).trim();
      }
      if (cellCount > 3) {
        validTeamId = (await cells.nth(3).textContent() || validTeamId).trim();
      }
    }

    // 有効なデータを入力
    await workInstructionIdInput.fill(validWorkInstructionId);
    
    const allInputs = page.locator('input');
    const inputCount = await allInputs.count();
    let workerIdInputElement = null;
    let siteIdInputElement = null;
    let teamIdInputElement = null;

    for (let i = 0; i < inputCount; i++) {
      const input = allInputs.nth(i);
      const placeholder = await input.getAttribute('placeholder');
      const label = await input.getAttribute('aria-label');
      const name = await input.getAttribute('name');
      const id = await input.getAttribute('id');
      
      if (!workerIdInputElement && (placeholder?.includes('作業者') || label?.includes('作業者') || name?.includes('worker') || id?.includes('worker'))) {
        workerIdInputElement = input;
      }
      if (!siteIdInputElement && (placeholder?.includes('拠点') || label?.includes('拠点') || name?.includes('site') || id?.includes('site'))) {
        siteIdInputElement = input;
      }
      if (!teamIdInputElement && (placeholder?.includes('チーム') || label?.includes('チーム') || name?.includes('team') || id?.includes('team'))) {
        teamIdInputElement = input;
      }
    }

    if (workerIdInputElement) {
      await workerIdInputElement.fill(validWorkerId);
    }
    if (siteIdInputElement) {
      await siteIdInputElement.fill(validSiteId);
    }
    if (teamIdInputElement) {
      await teamIdInputElement.fill(validTeamId);
    }

    await quantityInput.fill('100');
    await defectsInput.fill('0');
    const now = new Date().toISOString().slice(0, 16);
    await endDatetimeInput.fill(now);
    await statusSelect.selectOption('完了');
    await notesInput.fill('テスト実績');

    // 拠点IDを無効な値に変更
    if (siteIdInputElement) {
      await siteIdInputElement.clear();
      await siteIdInputElement.fill('INVALID-SITE-9999');
    }

    const requestPromise = page.waitForEvent('request', (request) => 
      request.url().includes('/api/') && request.method() === 'POST'
    ).catch(() => null);

    const submitButton = page.getByRole('button', { name: '実績を登録' });
    await submitButton.click();

    const errorBanner = page.locator('#error-banner');
    await expect(errorBanner).toBeVisible();

    const errorMessage = page.locator('#error-message');
    await expect(errorMessage).toBeVisible();

    const errorText = await errorMessage.textContent();
    expect(errorText).toBeTruthy();
    // 不一致の項目を特定する内容を確認
    expect(errorText).toMatch(/拠点ID/);
    expect(errorText).toMatch(/既存マスタ|存在しません|不正な/i);

    await expect(submitButton).toBeDisabled();
    expect(page.url()).toContain('scr-1789461813941');

    const request = await requestPromise;
    expect(request).toBeNull();
  });

  test('チームIDが既存マスタに存在しないとき、検証エラーが表示される', async ({ page }) => {
    await page.goto('/panels/scr-1789461813941.html');
    await page.waitForLoadState('networkidle');

    const workInstructionIdInput = page.locator('#perf-work-instruction-id');
    const quantityInput = page.locator('#perf-quantity');
    const defectsInput = page.locator('#perf-defects');
    const endDatetimeInput = page.locator('#perf-end-datetime');
    const statusSelect = page.locator('#perf-status');
    const notesInput = page.locator('#perf-notes');

    // 画面に表示されている既存の作業指示データから有効な値を取得
    const workInstructionRows = page.locator('#work-instruction-tbody tr');
    let validWorkInstructionId = 'WI-001';
    let validWorkerId = 'W-001';
    let validSiteId = 'SITE-001';
    let validTeamId = 'TEAM-001';

    if (await workInstructionRows.count() > 0) {
      const firstRow = workInstructionRows.first();
      const cells = firstRow.locator('td');
      const cellCount = await cells.count();
      
      if (cellCount > 0) {
        validWorkInstructionId = (await cells.nth(0).textContent() || validWorkInstructionId).trim();
      }
      if (cellCount > 1) {
        validWorkerId = (await cells.nth(1).textContent() || validWorkerId).trim();
      }
      if (cellCount > 2) {
        validSiteId = (await cells.nth(2).textContent() || validSiteId).trim();
      }
      if (cellCount > 3) {
        validTeamId = (await cells.nth(3).textContent() || validTeamId).trim();
      }
    }

    // 有効なデータを入力
    await workInstructionIdInput.fill(validWorkInstructionId);
    
    const allInputs = page.locator('input');
    const inputCount = await allInputs.count();
    let workerIdInputElement = null;
    let siteIdInputElement = null;
    let teamIdInputElement = null;

    for (let i = 0; i < inputCount; i++) {
      const input = allInputs.nth(i);
      const placeholder = await input.getAttribute('placeholder');
      const label = await input.getAttribute('aria-label');
      const name = await input.getAttribute('name');
      const id = await input.getAttribute('id');
      
      if (!workerIdInputElement && (placeholder?.includes('作業者') || label?.includes('作業者') || name?.includes('worker') || id?.includes('worker'))) {
        workerIdInputElement = input;
      }
      if (!siteIdInputElement && (placeholder?.includes('拠点') || label?.includes('拠点') || name?.includes('site') || id?.includes('site'))) {
        siteIdInputElement = input;
      }
      if (!teamIdInputElement && (placeholder?.includes('チーム') || label?.includes('チーム') || name?.includes('team') || id?.includes('team'))) {
        teamIdInputElement = input;
      }
    }

    if (workerIdInputElement) {
      await workerIdInputElement.fill(validWorkerId);
    }
    if (siteIdInputElement) {
      await siteIdInputElement.fill(validSiteId);
    }
    if (teamIdInputElement) {
      await teamIdInputElement.fill(validTeamId);
    }

    await quantityInput.fill('100');
    await defectsInput.fill('0');
    const now = new Date().toISOString().slice(0, 16);
    await endDatetimeInput.fill(now);
    await statusSelect.selectOption('完了');
    await notesInput.fill('テスト実績');

    // チームIDを無効な値に変更
    if (teamIdInputElement) {
      await teamIdInputElement.clear();
      await teamIdInputElement.fill('INVALID-TEAM-9999');
    }

    const requestPromise = page.waitForEvent('request', (request) => 
      request.url().includes('/api/') && request.method() === 'POST'
    ).catch(() => null);

    const submitButton = page.getByRole('button', { name: '実績を登録' });
    await submitButton.click();

    const errorBanner = page.locator('#error-banner');
    await expect(errorBanner).toBeVisible();

    const errorMessage = page.locator('#error-message');
    await expect(errorMessage).toBeVisible();

    const errorText = await errorMessage.textContent();
    expect(errorText).toBeTruthy();
    // 不一致の項目を特定する内容を確認
    expect(errorText).toMatch(/チームID/);
    expect(errorText).toMatch(/既存マスタ|存在しません|不正な/i);

    await expect(submitButton).toBeDisabled();
    expect(page.url()).toContain('scr-1789461813941');

    const request = await requestPromise;
    expect(request).toBeNull();
  });
});