import { TaskMap } from "creep/tasks/TaskStore";
import { RoleMap } from "creep/roles/RoleStore";
import Role from "creep/roles/Role";
import ClaimerRole from "creep/roles/ClaimerRole";
import DefenderRole from "creep/roles/DefenderRole";
import WorkerRole from "creep/roles/WorkerRole";
import Task, { TaskContext, TaskStatus } from "creep/tasks/Task";

class CreepTaskManager {
  private determineRole(creep: Creep): Id<Role> {
    if (creep.body.find(b => b.type === CLAIM)) {
      return ClaimerRole.id;
    }
    if (creep.body.find(b => b.type === ATTACK || b.type === RANGED_ATTACK)) {
      return DefenderRole.id;
    }
    return WorkerRole.id;
  }

  private executeTask(creep: Creep, task: Id<Task>, ctx: TaskContext): void {
    ctx.status = TaskStatus.InProgress;
    let idx = 0;

    const executeStep = () => {
      const step = TaskMap[task].steps[idx];
      if (!step) {
        return;
      }
      idx++;
      step(creep, ctx, executeStep);
    };

    executeStep();
  }

  private getRole(creep: Creep): Id<Role> {
    if (!creep.memory.role) {
      creep.memory.role = this.determineRole(creep);
      console.log(`${creep.name} has no role! Setting to ${creep.memory.role}`);
      return creep.memory.role;
    }
    if (!RoleMap[creep.memory.role]) {
      const lastRole = creep.memory.role;
      creep.memory.role = this.determineRole(creep);
      console.log(`${creep.name} has invalid role ${lastRole}! Setting to ${creep.memory.role}`);
      return creep.memory.role;
    }
    return creep.memory.role;
  }

  public loop(): void {
    for (const name in Game.creeps) {
      const creep = Game.creeps[name];
      const role = this.getRole(creep);
      const ctx: TaskContext = {
        status: TaskStatus.InProgress
      };

      let stopExecution = false;

      for (const tier of RoleMap[role].tasks) {
        const tasks = tier.slice();
        if (creep.memory.task) {
          if (tasks.includes(creep.memory.task)) {
            // move the in-progress task to the front
            tasks.splice(tasks.indexOf(creep.memory.task), 1);
            tasks.unshift(creep.memory.task);
          }
        }
        for (const task of tasks) {
          this.executeTask(creep, task, ctx);
          if (ctx.status === TaskStatus.Complete) {
            if (task === creep.memory.task) creep.memory.task = undefined;
          } else if (ctx.status === TaskStatus.InProgress) {
            if (creep.memory.task !== task) {
              creep.memory.task = task;
              creep.say(TaskMap[task].displayName);
            }
            stopExecution = true;
            break;
          } else if (ctx.status === TaskStatus.Background) {
            if (task === creep.memory.task) creep.memory.task = undefined;
            creep.say(TaskMap[task].displayName);
            stopExecution = true;
            break;
          }
        }
        if (stopExecution) break;
      }
    }
  }
}

export default new CreepTaskManager();
