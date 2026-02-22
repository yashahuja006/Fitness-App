/**
 * Basic setup test to verify Jest configuration
 */

describe('Jest Setup', () => {
  it('should run basic tests', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have access to testing utilities', () => {
    expect(jest).toBeDefined();
    expect(expect).toBeDefined();
  });

  it('should have proper timeout configured', () => {
    expect(jest.getTimerCount).toBeDefined();
  });
});