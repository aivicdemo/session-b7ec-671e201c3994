import { test, expect } from '@playwright/test';

test('SCEN-1118: 認証済みユーザーが配置案実行操作の権限を持つ場合、入力データの検証に進む', async ({ page }) => {
  // テストユーザーでシステムにログインし、認証状態を確立する
  await test.step('ログイン操作を実行', async () => {
    await page.goto('/');
    await page.waitForURL(/.*login|auth.*/, { timeout: 5000 }).catch(() => {
      // ログイン画面への遷移を待つ
    });
    
    // ログイン画面が表示されるまで待機
    await page.waitForSelector('input[type="text"], input[type="email"]', { timeout: 5000 }).catch(() => {});
    
    // ユーザー名/メールアドレス入力
    const userInput = page.locator('input[type="text"], input[type="email"]').first();
    await userInput.fill('testuser');
    
    // パスワード入力
    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill('testpassword');
    
    // ログインボタン送信
    const loginButton = page.locator('button:has-text("ログイン"), button:has-text("Login")');
    await loginButton.click();
    
    // ログイン後の遷移を待機
    await page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => {});
    await page.waitForTimeout(1000);
  });

  // 生産性ダッシュボード・分析画面から最適人員配置案提案・実行画面へ遷移する
  await test.step('最適人員配置案提案・実行画面へ遷移', async () => {
    // 生産性ダッシュボード・分析画面へ遷移
    await page.goto('/panels/scr-1789461964046.html');
    await page.waitForLoadState('networkidle');
    
    // 最適人員配置案提案・実行画面へのリンク/ボタンをクリック
    const placementLink = page.locator('a, button').filter({ 
      hasText: /最適人員配置|配置案|配置/ 
    }).first();
    
    await expect(placementLink).toBeVisible();
    await placementLink.click();
    
    // 画面遷移を待機
    await page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => {});
    await page.waitForLoadState('networkidle');
  });

  // 最適人員配置案提案・実行画面で、配置案実行ボタンをクリックする
  // 配置案実行操作の権限確認処理が実行される
  let beforeUrl = '';
  await test.step('配置案実行ボタンをクリックして権限確認処理を実行', async () => {
    beforeUrl = page.url();
    
    // 配置案実行ボタンを探してクリック
    const executeButton = page.locator('button').filter({ 
      hasText: /配置案実行|実行|Execute/ 
    }).first();
    
    await expect(executeButton).toBeVisible();
    
    // ボタンをクリック（権限確認処理が発動）
    await executeButton.click();
    
    // 権限確認処理の実行を検証：ナビゲーションまたは通信が発生することを確認
    await Promise.race([
      page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => {}),
      page.waitForLoadState('networkidle')
    ]);
    
    // 権限確認処理が実行された場合、URLが変更されるか、または検証画面が表示される
    await page.waitForLoadState('networkidle');
  });

  // 権限確認処理が完了後、入力データ検証画面へ遷移し、配置案の実行対象となる作業者割当データの入力値が検証用フォームに表示される
  await test.step('入力データ検証画面が表示され、作業者割当データが表示される', async () => {
    // 入力データ検証画面への遷移を確認
    await page.waitForLoadState('networkidle');
    
    // 検証画面のURLを確認（最適人員配置案提案・実行画面から検証画面へ遷移）
    const currentUrl = page.url();
    
    // 検証画面（scr-1789461978707）への遷移を確認
    expect(currentUrl).toContain('scr-1789461978707');
    
    // 遷移前のURLと異なることを確認
    expect(currentUrl).not.toBe(beforeUrl);
    
    // 検証用フォームが表示されていることを確認
    const validationForm = page.locator('form, [data-testid="validation-form"], .validation-container').first();
    await expect(validationForm).toBeVisible();

    // 作業者ID の入力値が表示され、データが存在することを確認
    const workerIdInput = page.locator('input[name*="worker"], input[name*="id"], input[name*="workerId"]').first();
    const workerIdLabel = page.locator('label:has-text("作業者ID"), [data-label="worker"], [data-label="workerId"]');
    const workerIdElement = page.locator('span:has-text("作業者ID"), div:has-text("作業者ID")').first();
    
    const workerIdInputVisible = await workerIdInput.isVisible().catch(() => false);
    const workerIdLabelVisible = await workerIdLabel.isVisible().catch(() => false);
    const workerIdElementVisible = await workerIdElement.isVisible().catch(() => false);
    
    expect(workerIdInputVisible || workerIdLabelVisible || workerIdElementVisible).toBeTruthy();
    
    // 作業者ID のデータ値を確認
    let workerIdValue = '';
    if (workerIdInputVisible) {
      workerIdValue = await workerIdInput.inputValue().catch(() => 
        workerIdInput.textContent().catch(() => '')
      );
    } else if (workerIdLabelVisible) {
      workerIdValue = await workerIdLabel.textContent().catch(() => '');
    } else if (workerIdElementVisible) {
      workerIdValue = await workerIdElement.textContent().catch(() => '');
    }
    
    // 実際のデータ値が表示されていることを検証
    expect(workerIdValue.trim()).not.toBe('');
    expect(workerIdValue.trim()).not.toBe('作業者ID');

    // 配置先部門 の入力値が表示され、データが存在することを確認
    const departmentInput = page.locator('input[name*="department"], select[name*="department"], input[name*="dept"]').first();
    const departmentLabel = page.locator('label:has-text("配置先部門"), [data-label="department"], [data-label="dept"]');
    const departmentElement = page.locator('span:has-text("配置先部門"), div:has-text("配置先部門")').first();
    
    const departmentInputVisible = await departmentInput.isVisible().catch(() => false);
    const departmentLabelVisible = await departmentLabel.isVisible().catch(() => false);
    const departmentElementVisible = await departmentElement.isVisible().catch(() => false);
    
    expect(departmentInputVisible || departmentLabelVisible || departmentElementVisible).toBeTruthy();
    
    // 配置先部門 のデータ値を確認
    let departmentValue = '';
    if (departmentInputVisible) {
      departmentValue = await departmentInput.inputValue().catch(() => 
        departmentInput.textContent().catch(() => '')
      );
    } else if (departmentLabelVisible) {
      departmentValue = await departmentLabel.textContent().catch(() => '');
    } else if (departmentElementVisible) {
      departmentValue = await departmentElement.textContent().catch(() => '');
    }
    
    // 実際のデータ値が表示されていることを検証
    expect(departmentValue.trim()).not.toBe('');
    expect(departmentValue.trim()).not.toBe('配置先部門');

    // 予定作業タイプ の入力値が表示され、データが存在することを確認
    const workTypeInput = page.locator('input[name*="work"], input[name*="type"], select[name*="workType"]').first();
    const workTypeLabel = page.locator('label:has-text("予定作業"), label:has-text("作業タイプ"), [data-label="workType"]');
    const workTypeElement = page.locator('span:has-text("予定作業"), div:has-text("予定作業")').first();
    
    const workTypeInputVisible = await workTypeInput.isVisible().catch(() => false);
    const workTypeLabelVisible = await workTypeLabel.isVisible().catch(() => false);
    const workTypeElementVisible = await workTypeElement.isVisible().catch(() => false);
    
    expect(workTypeInputVisible || workTypeLabelVisible || workTypeElementVisible).toBeTruthy();
    
    // 予定作業タイプ のデータ値を確認
    let workTypeValue = '';
    if (workTypeInputVisible) {
      workTypeValue = await workTypeInput.inputValue().catch(() => 
        workTypeInput.textContent().catch(() => '')
      );
    } else if (workTypeLabelVisible) {
      workTypeValue = await workTypeLabel.textContent().catch(() => '');
    } else if (workTypeElementVisible) {
      workTypeValue = await workTypeElement.textContent().catch(() => '');
    }
    
    // 実際のデータ値が表示されていることを検証
    expect(workTypeValue.trim()).not.toBe('');
    expect(workTypeValue.trim()).not.toBe('予定作業タイプ');

    // 検証用フォーム内に複数の入力要素が存在することを確認
    const inputFields = validationForm.locator('input, select, textarea');
    const inputCount = await inputFields.count();
    expect(inputCount).toBeGreaterThan(0);
  });

  // 戻るボタンが押下可能な状態で表示される
  await test.step('戻るボタンが表示され、押下可能であることを確認', async () => {
    // 現在のURLが検証画面であることを再度確認
    const currentUrl = page.url();
    expect(currentUrl).toContain('scr-1789461978707');
    
    const backButton = page.locator('button').filter({ 
      hasText: /戻る|Back|前へ|キャンセル/ 
    }).first();
    
    await expect(backButton).toBeVisible();
    await expect(backButton).toBeEnabled();
  });
});