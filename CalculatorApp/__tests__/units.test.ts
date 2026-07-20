import { convertUnit, getUnits, getUnitName } from '../src/utils/units';

describe('length conversion', () => {
  it('1 km = 1000 m', () => {
    expect(convertUnit('length', 1, 'km', 'm')).toBe(1000);
  });

  it('1 mi ≈ 1.609344 km', () => {
    expect(convertUnit('length', 1, 'mi', 'km')).toBeCloseTo(1.609344, 5);
  });

  it('100 cm = 1 m', () => {
    expect(convertUnit('length', 100, 'cm', 'm')).toBe(1);
  });

  it('1 ft = 12 in', () => {
    expect(convertUnit('length', 1, 'ft', 'in')).toBeCloseTo(12, 5);
  });
});

describe('weight conversion', () => {
  it('1 kg = 1000 g', () => {
    expect(convertUnit('weight', 1, 'kg', 'g')).toBe(1000);
  });

  it('1 lb ≈ 453.59237 g', () => {
    expect(convertUnit('weight', 1, 'lb', 'g')).toBeCloseTo(453.59237, 4);
  });

  it('16 oz ≈ 1 lb', () => {
    expect(convertUnit('weight', 16, 'oz', 'lb')).toBeCloseTo(1, 5);
  });
});

describe('temperature conversion', () => {
  it('0 °C = 32 °F', () => {
    expect(convertUnit('temperature', 0, 'C', 'F')).toBe(32);
  });

  it('100 °C = 212 °F', () => {
    expect(convertUnit('temperature', 100, 'C', 'F')).toBe(212);
  });

  it('0 °C = 273.15 K', () => {
    expect(convertUnit('temperature', 0, 'C', 'K')).toBe(273.15);
  });

  it('32 °F = 0 °C', () => {
    expect(convertUnit('temperature', 32, 'F', 'C')).toBe(0);
  });

  it('273.15 K = 0 °C', () => {
    expect(convertUnit('temperature', 273.15, 'K', 'C')).toBe(0);
  });

  it('-40 °C = -40 °F', () => {
    expect(convertUnit('temperature', -40, 'C', 'F')).toBe(-40);
  });
});

describe('identity and metadata', () => {
  it('same unit returns the value', () => {
    expect(convertUnit('length', 5, 'm', 'm')).toBe(5);
  });

  it('getUnits returns all units of a category', () => {
    expect(getUnits('length').length).toBe(7);
    expect(getUnits('weight').length).toBe(5);
    expect(getUnits('temperature').length).toBe(3);
  });

  it('getUnitName resolves Chinese names', () => {
    expect(getUnitName('length', 'km')).toBe('千米');
    expect(getUnitName('temperature', 'F')).toBe('华氏度');
  });
});
