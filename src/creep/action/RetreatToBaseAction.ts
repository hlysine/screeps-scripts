import { getInterRoomDistance } from "utils/MoveUtils";
import Action, { ActionType, Complete, Step } from "./Action";

export default class RetreatToBaseAction extends Action {
  public override type: ActionType = ActionType.RetreatToBase;

  public override getSteps(creep: Creep, complete: Complete): Step[] {
    return [
      next => {
        let closestSpawn: StructureSpawn | null = null;
        let distance: number = Number.POSITIVE_INFINITY;
        for (const name in Game.spawns) {
          const spawn = Game.spawns[name];
          const dist = getInterRoomDistance(creep.pos, spawn.pos);
          if (dist < distance) {
            distance = dist;
            closestSpawn = spawn;
          }
        }
        if (!closestSpawn) {
          complete();
          return;
        }
        if (creep.pos.inRangeTo(closestSpawn, 15)) {
          complete();
          return;
        }
        creep.moveTo(closestSpawn.pos, { visualizePathStyle: { stroke: "#ffffff" }, range: 1 });
        if (creep.pos.roomName === closestSpawn.pos.roomName) {
          complete();
          return;
        }
        next();
      }
    ];
  }
}
