import Action, { ActionType, Complete, Step } from "./Action";

export default class IdleAction extends Action {
  public override type: ActionType = ActionType.Idle;

  public override getSteps(creep: Creep, complete: Complete): Step[] {
    return [
      complete // find something to do
    ];
  }
}
