import { Step, TaskContext, TaskStatus } from "creep/tasks/Task";

export const requireEnergy: Step = (creep: Creep, ctx: TaskContext, next: () => void): void => {
  if (creep.store[RESOURCE_ENERGY] === 0) {
    ctx.status = TaskStatus.Complete;
    ctx.note = "out of energy";
    return;
  }
  next();
};

export const requireCapacity: Step = (creep: Creep, ctx: TaskContext, next: () => void): void => {
  if (creep.store.getFreeCapacity() === 0) {
    ctx.status = TaskStatus.Complete;
    ctx.note = "energy store is full";
    return;
  }
  next();
};

export const requireFlag: Step = (creep: Creep, ctx: TaskContext, next: () => void): void => {
  if (
    !Object.values(Game.flags).find(
      f => f.name.toLowerCase().includes("@" + creep.memory.role) && f.pos.roomName === creep.pos.roomName
    )
  ) {
    ctx.status = TaskStatus.Complete;
    ctx.note = "no flag";
    return;
  }
  next();
};

export const completeTask: Step = (_creep: Creep, ctx: TaskContext, next: () => void): void => {
  ctx.status = TaskStatus.Complete;
  ctx.note = "completeTask";
  next();
};

export function completeWithNote(note: string): Step {
  return (_creep: Creep, ctx: TaskContext, next: () => void): void => {
    ctx.status = TaskStatus.Complete;
    ctx.note ??= note;
    next();
  };
}
