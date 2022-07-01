import { positionEquals } from "utils/MoveUtils";
import Action, { ActionType, Complete, Step } from "./Action";

export default class AttackStructureAction extends Action {
  public override type: ActionType = ActionType.AttackStructure;

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
