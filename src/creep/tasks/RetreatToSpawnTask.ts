import { findClosestAcrossRooms, isMoveSuccess } from "utils/MoveUtils";
import { completeTask } from "./SharedSteps";
import Task, { TaskStatus, makeTask } from "./Task";

const RetreatToSpawnTask = makeTask({
  id: "retreat_to_spawn" as Id<Task>,
  displayName: "Retreat to spawn",
  data: () => ({
    spawnTarget: undefined as Id<StructureSpawn> | undefined
  }),

  steps: [
    (creep, ctx, next) => {
      if (ctx.data.spawnTarget) {
        const spawn = Game.getObjectById(ctx.data.spawnTarget);
        if (spawn) {
          if (!isMoveSuccess(creep.moveTo(spawn, { visualizePathStyle: { stroke: "#ffffff" }, range: 15 }))) {
            creep.memory.target = undefined;
            ctx.data.spawnTarget = undefined;
            ctx.status = TaskStatus.Complete;
            return;
          } else {
            ctx.status = TaskStatus.Background;
            return;
          }
        }
      }
      next();
    },
    (creep, ctx, next) => {
      const closestSpawn = findClosestAcrossRooms(creep.pos, Object.values(Game.spawns));
      if (!closestSpawn) {
        creep.memory.target = undefined;
        ctx.data.spawnTarget = undefined;
        next();
        return;
      }
      if (creep.pos.roomName === closestSpawn.pos.roomName && creep.pos.inRangeTo(closestSpawn, 15)) {
        creep.memory.target = undefined;
        ctx.data.spawnTarget = undefined;
        next();
        return;
      }
      creep.moveTo(closestSpawn.pos, { visualizePathStyle: { stroke: "#ffffff" }, range: 15 });
      creep.memory.target = closestSpawn.pos;
      ctx.data.spawnTarget = closestSpawn.id;
      ctx.status = TaskStatus.Background;
    },
    completeTask
  ]
});

export default RetreatToSpawnTask;
