declare global {
  interface Array<T> {
    /**
     * Returns the element with the minimum value of the array, with the value being determined by the selector function.
     * @param selector function that returns a value to compare
     */
    minBy<U>(selector: (t: T) => U): T | undefined;
    /**
     * Returns the element with the maximum value of the array, with the value being determined by the selector function.
     * @param selector function that returns a value to compare
     */
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
