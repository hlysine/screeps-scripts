/**
 * Represents the serialized version of a type, which has all functions removed.
 */
export type Serialized<T> = {
  [key in keyof T]: T[key] extends (...arg: any[]) => any ? T[key] | undefined : T[key];
};
