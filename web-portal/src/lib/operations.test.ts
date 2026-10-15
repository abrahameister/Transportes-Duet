import { describe, it, expect } from 'vitest';

export function calculateEstimatedFare(
  distanceKm: number,
  tarifaPorKm: number = 1500,
  tarifaMinima: number = 8000
): number {
  const kmFare = distanceKm * tarifaPorKm;
  return Math.max(kmFare, tarifaMinima);
}

export function mapBoardingState(uiStatus: 'abordo' | 'ausente' | 'pendiente'): 'abordado' | 'no_show' | 'pendiente' {
  if (uiStatus === 'abordo') return 'abordado';
  if (uiStatus === 'ausente') return 'no_show';
  return 'pendiente';
}

export function validatePreTripInspection(checklist: {
  fluidos: boolean;
  neumaticos: boolean;
  licencia: boolean;
  extintor: boolean;
}): { valid: boolean; reason?: string } {
  if (!checklist.fluidos || !checklist.neumaticos || !checklist.licencia || !checklist.extintor) {
    return {
      valid: false,
      reason: 'Debes verificar los 4 puntos de seguridad obligatorios de la normativa vial.'
    };
  }
  return { valid: true };
}

export function canFinishTrip(pendingPassengersCount: number): boolean {
  return pendingPassengersCount === 0;
}

describe('Operations and Business Rules', () => {
  describe('Tariff Calculation', () => {
    it('debe respetar la tarifa minima si el kilometraje calculado es menor', () => {
      const fare = calculateEstimatedFare(2, 1500, 8000); // 2 * 1500 = 3000 < 8000
      expect(fare).toBe(8000);
    });

    it('debe aplicar la tarifa por km si el monto supera la tarifa minima', () => {
      const fare = calculateEstimatedFare(10, 1500, 8000); // 10 * 1500 = 15000 > 8000
      expect(fare).toBe(15000);
    });
  });

  describe('Passenger Boarding Transitions', () => {
    it('debe mapear abordo a abordado para compatibilidad con la base de datos', () => {
      expect(mapBoardingState('abordo')).toBe('abordado');
    });

    it('debe mapear ausente a no_show para compatibilidad con la base de datos', () => {
      expect(mapBoardingState('ausente')).toBe('no_show');
    });

    it('debe mapear pendiente a pendiente al revertir estado', () => {
      expect(mapBoardingState('pendiente')).toBe('pendiente');
    });
  });

  describe('Vehicle Inspection Validation', () => {
    it('debe rechazar inspeccion si falta el extintor o cualquier punto critico', () => {
      const result = validatePreTripInspection({
        fluidos: true,
        neumaticos: true,
        licencia: true,
        extintor: false
      });
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('4 puntos de seguridad obligatorios');
    });

    it('debe aprobar inspeccion cuando los 4 puntos estan verificados', () => {
      const result = validatePreTripInspection({
        fluidos: true,
        neumaticos: true,
        licencia: true,
        extintor: true
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('Trip Finish Guards', () => {
    it('no debe permitir finalizar viaje si quedan pasajeros pendientes', () => {
      expect(canFinishTrip(3)).toBe(false);
      expect(canFinishTrip(1)).toBe(false);
    });

    it('debe permitir finalizar viaje cuando todos los pasajeros fueron procesados', () => {
      expect(canFinishTrip(0)).toBe(true);
    });
  });
});
