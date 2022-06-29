import Action, { ActionType, Complete, Step } from "./Action";

export default class DefendAction extends Action {
  public override type: ActionType = ActionType.Defend;

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
        if (creep.memory.creepTarget) {
          const target = Game.getObjectById(creep.memory.creepTarget);
          if (!target) {
            creep.memory.target = undefined;
            creep.memory.creepTarget = undefined;
          } else if (
            creep.moveTo(target.pos, {
              visualizePathStyle: { stroke: "#ffffff" }
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
          if (creep.moveTo(target, { visualizePathStyle: { stroke: "#ffffff" } }) === OK) {
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
