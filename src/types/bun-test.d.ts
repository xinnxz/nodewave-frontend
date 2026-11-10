declare module 'bun:test' {
  export const describe: (name: string, fn: () => void) => void;
  export const it: (name: string, fn: () => void | Promise<void>) => void;
  export const expect: (actual: unknown) => {
    toBe: (expected: unknown) => void;
    toBeNull: () => void;
    toContain: (expected: unknown) => void;
    toEqual: (expected: unknown) => void;
    toBeDefined: () => void;
    toBeGreaterThanOrEqual: (expected: number) => void;
  };
}
