import { Step, TaskStatus } from "creep/tasks/Task";
import { getStoreContentTypes } from "utils/StructureUtils";

export function requireResource(filter: (resourceType: ResourceConstant) => boolean): Step {
  return (creep, ctx, next) => {
    const resources = getStoreContentTypes(creep.store).filter(filter);
    if (!resources.some(filter)) {
      ctx.status = TaskStatus.Complete;
      ctx.note = "out of specified resource";
      return;
    }
    next();
  };
}

export const requireEnergy: Step = requireResource(r => r === RESOURCE_ENERGY);

export const requireCapacity: Step = (creep, ctx, next) => {
  if (creep.store.getFreeCapacity() === 0) {
    ctx.status = TaskStatus.Complete;
    ctx.note = "creep store is full";
    return;
  }
  next();
};

export const requireFlagInRoom: Step = (creep, ctx, next) => {
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

export const inHomeRoom: Step = (creep, ctx, next) => {
  if (creep.memory.origin) {
    const spawn = Game.spawns[creep.memory.origin];
    if (spawn && spawn.pos.roomName !== creep.pos.roomName) {
      ctx.status = TaskStatus.Complete;
      ctx.note = "not in home room";
      return;
    }
  }
  next();
};

export const completeTask: Step = (_creep, ctx, next) => {
  ctx.status = TaskStatus.Complete;
  ctx.note = "completeTask";
  next();
};

export function completeWithNote(note: string): Step {
  return (_creep, ctx, next) => {
    ctx.status = TaskStatus.Complete;
    ctx.note ??= note;
    next();
  };
}
