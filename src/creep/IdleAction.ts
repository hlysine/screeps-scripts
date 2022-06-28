import Action, { ActionType } from "./Action";

class IdleAction implements Action {
  public type: ActionType = ActionType.Idle;

  public loop(creep: Creep, complete: () => void): void {
    complete(); // find something to do
  }
}

export default new IdleAction();
