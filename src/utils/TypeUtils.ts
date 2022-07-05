/**
 * Represents the serialized version of a type, which has all functions removed.
 */
export type Serialized<T> = {
  [key in keyof T]: T[key] extends (...arg: any[]) => any ? T[key] | undefined : T[key];
};

export function getClassMethods(obj: unknown): string[] {
  const ret: string[] = [];
  const descriptors = Object.getOwnPropertyDescriptors(Object.getPrototypeOf(obj));
  for (const name in descriptors) {
    const descriptor = descriptors[name];
    if (!(descriptor.value instanceof Function)) continue;
    ret.push(name);
  }
  return ret;
}
