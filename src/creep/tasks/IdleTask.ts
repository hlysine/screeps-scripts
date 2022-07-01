import Task, { TaskType, Complete, Step } from "./Task";

export default class IdleTask extends Task {
  public override type: TaskType = TaskType.Idle;

  public override getSteps(creep: Creep, complete: Complete): Step[] {
    return [
      complete // find something to do
    ];
  }
}
