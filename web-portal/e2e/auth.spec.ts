import { test, expect } from '@playwright/test';

test.describe('Autenticación', () => {
  test('redirecciona al login si no está autenticado', async ({ page }) => {
    await page.goto('/app');
    // Debería redirigir al login
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('permite login y redirecciona según rol (Admin Mock)', async ({ page }) => {
    // Nota: Como no tenemos credenciales en el repo, este test asume que si
    // hay una variable de entorno TEST_USER se ejecuta, de lo contrario se salta
    test.skip(!process.env.TEST_USER, 'Faltan credenciales E2E en variables de entorno');
    
    await page.goto('/login');
    await page.fill('input[type="email"]', process.env.TEST_USER!);
    await page.fill('input[type="password"]', process.env.TEST_PASSWORD!);
    await page.click('button[type="submit"]');

    // Esperar a que la redirección a /app ocurra
    await expect(page).toHaveURL(/.*\/app/);
    
    // Y un componente del portal sea visible (e.g., botón de logout o header)
    await expect(page.locator('text=Neira Transportes')).toBeVisible();

    // Logout
    await page.click('button[aria-label="Cerrar Sesión"], button:has-text("Salir")');
    await expect(page).toHaveURL(/.*\/login/);
  });
});
