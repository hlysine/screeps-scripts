import { TaskType } from "creep/tasks/Task";
import { TaskMap } from "creep/tasks/TaskStore";
import { RoleType } from "creep/roles/Role";
import { RoleMap } from "creep/roles/RoleStore";

class CreepTaskManager {
  private getNextTask(role: RoleType, task: TaskType): TaskType | undefined {
    const roleTasks = RoleMap[role].tasks;
    const index = roleTasks.indexOf(task);
    if (index === -1) {
      return roleTasks[0];
    }
    return roleTasks[index + 1];
  }

  private determineRole(creep: Creep): RoleType {
    if (creep.body.find(b => b.type === CLAIM)) {
      return RoleType.Claimer;
    }
    if (creep.body.find(b => b.type === ATTACK || b.type === RANGED_ATTACK)) {
      return RoleType.Attacker;
    }
    return RoleType.Worker;
  }

  public switchTask(creep: Creep, task: TaskType) {
    creep.memory.target = undefined;
    creep.memory.task = task;
    creep.say(task);
    TaskMap[task].loop(creep, () => {
      const nextTask = this.getNextTask(creep.memory.role, task);
      if (!nextTask) return;
      this.switchTask(creep, nextTask);
    });
  }

  public loop(): void {
    for (const name in Game.creeps) {
      const creep = Game.creeps[name];
      if (!creep.memory.role) creep.memory.role = this.determineRole(creep);
      const role = creep.memory.role;
      if (!creep.memory.task) creep.memory.task = RoleMap[role].tasks[0];
      const task = creep.memory.task;

      TaskMap[task].loop(creep, () => this.switchTask(creep, RoleMap[role].tasks[0]));
    }
  }
}

export default new CreepTaskManager();
