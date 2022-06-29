import { Step } from "creep/action/Action";

export function requireEnergy(creep: Creep, complete: () => void): Step {
  return next => {
    if (creep.store[RESOURCE_ENERGY] === 0) {
      complete();
      return;
    }
    next();
  };
}

export function requireEnergyCapacity(creep: Creep, complete: () => void): Step {
  return next => {
    if (creep.store.getFreeCapacity() === 0) {
      complete();
      return;
    }
    next();
  };
}
