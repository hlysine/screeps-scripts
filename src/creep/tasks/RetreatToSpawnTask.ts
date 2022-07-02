import { findClosestAcrossRooms, isMoveSuccess } from "utils/MoveUtils";
import { completeTask } from "./SharedSteps";
import Task, { TaskContext, Next, TaskStatus } from "./Task";

const RetreatToSpawnTask: Task = {
  id: "retreat_to_spawn" as Id<Task>,
  displayName: "Retreat to spawn",

  steps: [
    (creep: Creep, ctx: TaskContext, next: Next): void => {
      if (creep.memory.spawnTarget) {
        const spawn = Game.getObjectById(creep.memory.spawnTarget);
        if (spawn) {
          if (!isMoveSuccess(creep.moveTo(spawn, { visualizePathStyle: { stroke: "#ffffff" }, range: 15 }))) {
            creep.memory.target = undefined;
            creep.memory.spawnTarget = undefined;
          } else {
            ctx.status = TaskStatus.Background;
            return;
          }
        }
      }
      next();
    },
    (creep: Creep, ctx: TaskContext, next: Next): void => {
      const closestSpawn = findClosestAcrossRooms(creep.pos, Object.values(Game.spawns));
      if (!closestSpawn) {
        creep.memory.target = undefined;
        creep.memory.spawnTarget = undefined;
        next();
        return;
      }
      if (creep.pos.roomName === closestSpawn.pos.roomName && creep.pos.inRangeTo(closestSpawn, 15)) {
        creep.memory.target = undefined;
        creep.memory.spawnTarget = undefined;
        next();
        return;
      }
      creep.moveTo(closestSpawn.pos, { visualizePathStyle: { stroke: "#ffffff" }, range: 15 });
      creep.memory.target = closestSpawn.pos;
      creep.memory.spawnTarget = closestSpawn.id;
      ctx.status = TaskStatus.Background;
    },
    completeTask
  ]
};

export default RetreatToSpawnTask;
