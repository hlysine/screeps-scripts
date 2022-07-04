import { isRoomMine } from "utils/StructureUtils";
import { completeTask } from "./SharedSteps";
import Task, { TaskContext, Next, TaskStatus } from "./Task";

const RangedAttackAutoTask: Task = {
  id: "ranged_attack_auto" as Id<Task>,
  displayName: "Auto ranged attack",

  steps: [
    (creep: Creep, ctx: TaskContext, next: Next): void => {
      const targets = creep.room.find(FIND_HOSTILE_CREEPS);
      for (const target of targets) {
        if (creep.rangedAttack(target) === OK) {
          ctx.status = TaskStatus.Complete;
          return;
        }
      }
      next();
    },
    (creep: Creep, ctx: TaskContext, next: Next): void => {
      const targets: AnyStructure[] = [
        ...creep.room.find(FIND_HOSTILE_SPAWNS),
        ...creep.room.find(FIND_HOSTILE_STRUCTURES, {
          filter: structure => structure.hits > 0
        })
      ];

      if (targets.length === 0) {
        next();
        return;
      }

      let target = targets[0];
      let lowestHits = target.hits;
      for (const t of targets) {
        if (!creep.pos.inRangeTo(t, 3)) continue;
        if (t.hits < lowestHits) {
          target = t;
          lowestHits = t.hits;
        }
      }
      if (creep.rangedAttack(target) === OK) {
        ctx.status = TaskStatus.Complete;
        return;
      }

      next();
    },
    (creep: Creep, ctx: TaskContext, next: Next): void => {
      // Only destroy walls if this room is not mine
      if (!isRoomMine(creep.room)) {
        const targets = creep.room.find(FIND_STRUCTURES, {
          filter: structure => structure.structureType === STRUCTURE_WALL
        });
        for (const target of targets) {
          if (creep.rangedAttack(target) === OK) {
            ctx.status = TaskStatus.Complete;
            return;
          }
        }
      }
      next();
    },
    completeTask
  ]
};

export default RangedAttackAutoTask;
