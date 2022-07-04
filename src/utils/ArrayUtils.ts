declare global {
  interface Array<T> {
    minBy<U>(selector: (t: T) => U): T | undefined;
    maxBy<U>(selector: (t: T) => U): T | undefined;
  }
}

Array.prototype.minBy = function <T, U>(this: T[], selector: (t: T) => U): T | undefined {
  if (this.length === 0) return undefined;
  let min = this[0];
  let minValue = selector(min);
  for (const t of this) {
    const value = selector(t);
    if (value < minValue) {
      min = t;
      minValue = value;
    }
  }
  return min;
};

Array.prototype.maxBy = function <T, U>(this: T[], selector: (t: T) => U): T | undefined {
  if (this.length === 0) return undefined;
  let max = this[0];
  let maxValue = selector(max);
  for (const t of this) {
    const value = selector(t);
    if (value > maxValue) {
      max = t;
      maxValue = value;
    }
  }
  return max;
};

export {};
