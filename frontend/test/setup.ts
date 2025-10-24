import '@testing-library/jest-dom'
import { beforeEach, afterEach, vi } from 'vitest';

// 全局测试配置
beforeEach(() => {
  // 清理任何之前的状态
  localStorage.clear();
  sessionStorage.clear();
});

// Mock console.log for verification code printing
const originalConsoleLog = console.log;
global.mockConsoleLog = vi.fn();

beforeEach(() => {
  console.log = global.mockConsoleLog;
});

afterEach(() => {
  console.log = originalConsoleLog;
  global.mockConsoleLog.mockClear();
});