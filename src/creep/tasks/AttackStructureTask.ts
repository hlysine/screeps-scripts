import { positionEquals } from "utils/MoveUtils";
import Task, { TaskType, Complete, Step } from "./Task";

export default class AttackStructureTask extends Task {
  public override type: TaskType = TaskType.AttackStructure;

  public override getSteps(creep: Creep, complete: Complete): Step[] {
    return [
      next => {
        const targets: AnyStructure[] = [
          ...creep.room.find(FIND_HOSTILE_SPAWNS),
          ...creep.room.find(FIND_HOSTILE_STRUCTURES, {
            filter: structure => structure.hits > 0
          })
        ];
        // Only destroy walls if this room is not mine
        if (creep.room.find(FIND_MY_SPAWNS).length === 0) {
          targets.push(
            ...creep.room.find(FIND_STRUCTURES, { filter: structure => structure.structureType === STRUCTURE_WALL })
          );
        }

        if (targets.length === 0) {
          next();
          return;
        }

        let rangedTarget = targets[0];
        let lowestHitsRanged = rangedTarget.hits;
        for (const t of targets) {
          if (!creep.pos.inRangeTo(t, 3)) continue;
          if (t.hits < lowestHitsRanged) {
            rangedTarget = t;
            lowestHitsRanged = t.hits;
          }
        }
        if (creep.rangedAttack(rangedTarget) === OK) {
          creep.memory.target = creep.pos;
        }

        let meleeTarget = targets[0];
        let lowestHits = meleeTarget.hits;
        for (const t of targets) {
          if (!creep.pos.inRangeTo(t, 1)) continue;
          if (t.hits < lowestHits) {
            meleeTarget = t;
            lowestHits = t.hits;
          }
        }
        if (creep.attack(meleeTarget) === OK) {
          creep.memory.target = creep.pos;
        }
        next();
      },
      next => {
        if (creep.memory.target) {
          if (positionEquals(creep.memory.target, creep.pos)) {
            creep.memory.target = undefined;
          } else if (
            creep.moveTo(creep.memory.target.x, creep.memory.target.y, {
              visualizePathStyle: { stroke: "#ffffff" },
              ignoreDestructibleStructures: true
            }) === ERR_NO_PATH
          ) {
            creep.memory.target = undefined;
          } else {
            return;
          }
        }
        next();
      },
      next => {
        const target = creep.pos.findClosestByPath(FIND_HOSTILE_SPAWNS);
        if (target) {
          if (
            creep.moveTo(target, {
              visualizePathStyle: { stroke: "#ffffff" },
              ignoreDestructibleStructures: true
            }) === OK
          ) {
            creep.memory.target = target.pos;
            return;
          }
        }
        next();
      },
      next => {
        const target = creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES, {
          filter: structure => structure.hits > 0
        });
        if (target) {
          if (
            creep.moveTo(target, {
              visualizePathStyle: { stroke: "#ffffff" },
              ignoreDestructibleStructures: true
            }) === OK
          ) {
            creep.memory.target = target.pos;
            return;
          }
        }
        next();
      },
      complete
    ];
  }
}
