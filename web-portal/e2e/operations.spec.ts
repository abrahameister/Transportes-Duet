import { test, expect } from '@playwright/test';

test.describe('Operaciones Admin', () => {
  test('Admin accede a Torre de Control y Planificación', async ({ page }) => {
    test.skip(!process.env.TEST_USER_ADMIN, 'Faltan credenciales E2E ADMIN');

    await page.goto('/login');
    await page.fill('input[type="email"]', process.env.TEST_USER_ADMIN!);
    await page.fill('input[type="password"]', process.env.TEST_PASSWORD_ADMIN!);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*\/app/);
    
    // Debería estar en el portal admin (Torre de Control)
    await expect(page.locator('text=Torre de Control')).toBeVisible();

    // Validar navegación a turnos/planificación
    await page.click('text=Turnos & Programación');
    await expect(page.locator('text=Programación de Servicios')).toBeVisible();
  });
});
