import { Step, TaskContext, TaskStatus } from "creep/tasks/Task";

export const requireEnergy: Step = (creep: Creep, ctx: TaskContext, next: () => void): void => {
  if (creep.store[RESOURCE_ENERGY] === 0) {
    ctx.status = TaskStatus.Complete;
    return;
  }
  next();
};

export const requireEnergyCapacity: Step = (creep: Creep, ctx: TaskContext, next: () => void): void => {
  if (creep.store.getFreeCapacity() === 0) {
    ctx.status = TaskStatus.Complete;
    return;
  }
  next();
};

export const completeTask: Step = (_creep: Creep, ctx: TaskContext, next: () => void): void => {
  ctx.status = TaskStatus.Complete;
  next();
};
