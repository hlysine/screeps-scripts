import Task from "creep/tasks/Task";
import Manager from "./Manager";

interface TargetMap {
  [id: string]: Creep;
}

interface TaskTargetMap {
  [taskId: Id<Task>]: TargetMap;
}

class TaskTargetManager extends Manager {
  public taskTargets: TaskTargetMap = {};

  public isAlreadyTargeted(taskId: Id<Task>, targetId: string): boolean {
    return !!this.taskTargets[taskId] && !!this.taskTargets[taskId][targetId];
  }

  public setTarget(creep: Creep, taskId: Id<Task>, targetId: string | undefined): void {
    if (!targetId) return;

    if (!this.taskTargets[taskId]) {
      this.taskTargets[taskId] = {};
    }
    // todo: do something when more than 1 creep targets the same thing?
    this.taskTargets[taskId][targetId] = creep;
    creep.memory.targetId = targetId;
  }

  protected override loop(): void {
    this.taskTargets = {};
    for (const creepName in Game.creeps) {
      const creep = Game.creeps[creepName];

      if (creep.memory.taskId && creep.memory.targetId) {
        const taskId = creep.memory.taskId;
        const targetId = creep.memory.targetId;
        if (!this.taskTargets[taskId]) {
          this.taskTargets[taskId] = {};
        }
        // todo: do something when more than 1 creep targets the same thing?
        this.taskTargets[taskId][targetId] = creep;
      }
    }
  }
}

export default new TaskTargetManager();
