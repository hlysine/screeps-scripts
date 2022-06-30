import Action, { ActionType, Complete, Step } from "./Action";

export default class RetreatToBaseAction extends Action {
  public override type: ActionType = ActionType.RetreatToBase;

  public override getSteps(creep: Creep, complete: Complete): Step[] {
    return [
      next => {
        if (creep.memory.spawnTarget) {
          const spawn = Game.getObjectById(creep.memory.spawnTarget);
          if (spawn) {
            if (creep.moveTo(spawn, { visualizePathStyle: { stroke: "#ffffff" }, range: 1 }) === ERR_NO_PATH) {
              creep.memory.target = undefined;
              creep.memory.spawnTarget = undefined;
            } else {
              complete();
              return;
            }
          }
        }
        next();
      },
      _next => {
        const closestSpawn = creep.pos.findClosestByPath(FIND_MY_SPAWNS);
        if (!closestSpawn) {
          creep.memory.target = undefined;
          creep.memory.spawnTarget = undefined;
          complete();
          return;
        }
        if (creep.pos.inRangeTo(closestSpawn, 15)) {
          creep.memory.target = undefined;
          creep.memory.spawnTarget = undefined;
          complete();
          return;
        }
        creep.moveTo(closestSpawn.pos, { visualizePathStyle: { stroke: "#ffffff" }, range: 1 });
        creep.memory.target = closestSpawn.pos;
        creep.memory.spawnTarget = closestSpawn.id;
        complete();
      }
    ];
  }
}
