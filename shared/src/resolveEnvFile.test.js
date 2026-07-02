import { describe, it, expect } from 'vitest';
import { resolveEnvFile } from './resolveEnvFile.js';

describe('resolveEnvFile', () => {
  it('returns ".env" when NODE_ENV is "production"', () => {
    expect(resolveEnvFile('production')).toBe('.env');
  });

  it('returns ".env.local" when NODE_ENV is "development"', () => {
    expect(resolveEnvFile('development')).toBe('.env.local');
  });

  it('returns ".env.local" when NODE_ENV is undefined', () => {
    expect(resolveEnvFile(undefined)).toBe('.env.local');
  });

  it('returns ".env.local" for any unexpected value (safe default)', () => {
    expect(resolveEnvFile('staging')).toBe('.env.local');
    expect(resolveEnvFile('')).toBe('.env.local');
  });
});