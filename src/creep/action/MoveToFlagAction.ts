import Action, { ActionType, Complete, Step } from "./Action";

export default class MoveToFlagAction extends Action {
  public override type: ActionType = ActionType.MoveToFlag;

  public override getSteps(creep: Creep, complete: Complete): Step[] {
    return [
      next => {
        const target = Object.values(Game.flags).find(f => f.name.toLowerCase().includes("@" + creep.memory.role));
        if (!target) {
          complete();
          return;
        }
        if (creep.moveTo(target.pos, { visualizePathStyle: { stroke: "#ffffff" } }) === ERR_NO_PATH) {
          complete();
          return;
        }
        next();
      }
    ];
  }
}
