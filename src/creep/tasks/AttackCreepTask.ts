import Task, { TaskType, Complete, Step } from "./Task";

export default class AttackCreepTask extends Task {
  public override type: TaskType = TaskType.AttackCreep;

  public override getSteps(creep: Creep, complete: Complete): Step[] {
    return [
      next => {
        const targets = creep.room.find(FIND_HOSTILE_CREEPS);
        for (const target of targets) {
          if (creep.rangedAttack(target) === OK) {
            creep.memory.target = creep.pos;
            creep.memory.creepTarget = target.id;
            break;
          }
        }
        for (const target of targets) {
          if (creep.attack(target) === OK) {
            creep.memory.target = creep.pos;
            creep.memory.creepTarget = target.id;
            break;
          }
        }
        next();
      },
      next => {
        // Only destroy walls if this room is not mine
        if (creep.room.find(FIND_MY_SPAWNS).length === 0) {
          const targets = creep.room.find(FIND_STRUCTURES, {
            filter: structure => structure.structureType === STRUCTURE_WALL
          });
          for (const target of targets) {
            if (creep.rangedAttack(target) === OK) {
              creep.memory.target = creep.pos;
              break;
            }
          }
          for (const target of targets) {
            if (creep.attack(target) === OK) {
              creep.memory.target = creep.pos;
              break;
            }
          }
        }
        next();
      },
      next => {
        if (creep.memory.creepTarget) {
          const target = Game.getObjectById(creep.memory.creepTarget);
          if (!target) {
            creep.memory.target = undefined;
            creep.memory.creepTarget = undefined;
          } else if (
            creep.moveTo(target.pos, {
              visualizePathStyle: { stroke: "#ffffff" },
              ignoreDestructibleStructures: true
            }) === ERR_NO_PATH
          ) {
            creep.memory.target = undefined;
            creep.memory.creepTarget = undefined;
          } else {
            return;
          }
        }
        next();
      },
      next => {
        const target = creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS);
        if (target) {
          if (
            creep.moveTo(target, {
              visualizePathStyle: { stroke: "#ffffff" },
              ignoreDestructibleStructures: true
            }) === OK
          ) {
            creep.memory.target = target.pos;
            creep.memory.creepTarget = target.id;
            return;
          }
        }
        next();
      },
      complete
    ];
  }
}
