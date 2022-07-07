import TaskTargetManager from "managers/TaskTargetManager";
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
      let target: StructureSpawn | undefined = Game.spawns[creep.memory.origin];
      if (!target) target = findClosestAcrossRooms(creep.pos, Object.values(Game.spawns));
      if (!target) {
        next();
        return;
      }
      if (creep.pos.roomName === target.pos.roomName && creep.pos.inRangeTo(target, 15)) {
        next();
        return;
      }
      creep.moveTo(target.pos, { visualizePathStyle: { stroke: "#ffffff" }, range: 15 });
      creep.memory.target = target.pos;
      TaskTargetManager.setTarget(creep, RetreatToSpawnTask.id, target.id);
      ctx.data.spawnTarget = target.id;
      ctx.status = TaskStatus.Background;
    },
    completeTask
  ]
});

export default RetreatToSpawnTask;
