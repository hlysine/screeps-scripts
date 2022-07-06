import Task from "creep/tasks/Task";
import Logger from "utils/Logger";
import CreepTaskManager from "./CreepTaskManager";
import Manager from "./Manager";

const logger = new Logger("TaskTargetManager");

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

  public setTarget(creep: Creep, taskId: Id<Task>, targetId: string): void {
    if (!this.taskTargets[taskId]) {
      this.taskTargets[taskId] = {};
    }
    const lastCreep = this.taskTargets[taskId][targetId];
    if (lastCreep) {
      logger.log(`${creep.name} is replacing ${lastCreep.name} for task ${taskId} target ${targetId}`);
      CreepTaskManager.terminateTask(lastCreep, taskId);
    }
    this.taskTargets[taskId][targetId] = creep;
  }

  public loop(): void {
    this.taskTargets = {};
    for (const creepName in Game.creeps) {
      const creep = Game.creeps[creepName];

      if (creep.memory.taskId && creep.memory.targetId) {
        const taskId = creep.memory.taskId;
        const targetId = creep.memory.targetId;
        if (!this.taskTargets[taskId]) {
          this.taskTargets[taskId] = {};
        }
        this.taskTargets[taskId][targetId] = creep;
      }
    }
  }
}

export default new TaskTargetManager();
