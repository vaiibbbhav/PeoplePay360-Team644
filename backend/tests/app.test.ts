import { describe, it, expect } from 'vitest';
import { createApp } from '../src/app';

describe('Express Application Setup', () => {
  it('should create an app instance successfully', () => {
    const app = createApp();
    expect(app).toBeDefined();
  });
});
