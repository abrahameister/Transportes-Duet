import { test, expect } from '@playwright/test';

test.describe('Tracking Público', () => {
  test('Ruta pública muestra estado seguro cuando el token es inválido', async ({ page }) => {
    await page.goto('/live-track/token-invalido-123');
    
    // Como es público, no debe redirigir a login
    await expect(page).not.toHaveURL(/.*\/login/);

    // Debe mostrar error de acceso o token inválido, sin exponer datos operacionales
    await expect(page.locator('text=No autorizado')).toBeVisible();
  });
});
