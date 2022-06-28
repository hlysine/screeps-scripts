interface Middleware {
  (next: () => void): void;
}

export function functionChain(...functions: Middleware[]): void {
  let index = 0;
  const next = () => {
    if (index < functions.length) {
      functions[index++](next);
    }
  };
  next();
}

export function requireEnergy(creep: Creep, complete: () => void): Middleware {
  return next => {
    if (creep.store[RESOURCE_ENERGY] === 0) {
      complete();
      return;
    }
    next();
  };
}

export function requireEnergyCapacity(creep: Creep, complete: () => void): Middleware {
  return next => {
    if (creep.store.getFreeCapacity() === 0) {
      complete();
      return;
    }
    next();
  };
}
