import { test, expect } from '@playwright/test';

test.describe('Portal B2B', () => {
  test('Cliente B2B accede a sus módulos', async ({ page }) => {
    test.skip(!process.env.TEST_USER_B2B, 'Faltan credenciales E2E B2B');

    await page.goto('/login');
    await page.fill('input[type="email"]', process.env.TEST_USER_B2B!);
    await page.fill('input[type="password"]', process.env.TEST_PASSWORD_B2B!);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*\/app/);
    
    // Debería estar en el portal B2B
    await expect(page.locator('text=Portal Cliente')).toBeVisible();

    // Validar navegación a pasajeros
    await page.click('text=Pasajeros');
    await expect(page.locator('text=Nómina de Pasajeros')).toBeVisible();

    // Validar navegación a turnos
    await page.click('text=Turnos');
    await expect(page.locator('text=Programación')).toBeVisible();
  });
});
