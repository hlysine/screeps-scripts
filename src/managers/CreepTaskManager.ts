import { RoleMap } from "creep/roles/RoleStore";
import Role from "creep/roles/Role";
import ClaimerRole from "creep/roles/ClaimerRole";
import DefenderRole from "creep/roles/DefenderRole";
import WorkerRole from "creep/roles/WorkerRole";
import Task, { clearTaskTargets, TaskContext, TaskStatus } from "creep/tasks/Task";
import Logger from "utils/Logger";

const logger = new Logger("CreepTaskManager");

interface Coordinate {
  tier: number;
  priority: number;
}

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

  private parseTaskCoordinate(coordinate: string): Coordinate | undefined {
    const [tier, priority] = coordinate.split(",").map(c => parseInt(c, 10));
    if (tier === undefined || priority === undefined) return undefined;
    if (Number.isNaN(tier) || Number.isNaN(priority)) return undefined;
    return { tier, priority };
  }

  private isCoordinateEqual(a?: Coordinate, b?: Coordinate): boolean {
    if (!a && !b) return true;
    if (!a || !b) return false;
    return a.tier === b.tier && a.priority === b.priority;
  }

  private executeTask(creep: Creep, task: Task, ctx: TaskContext): void {
    ctx.status = TaskStatus.InProgress;
    ctx.note = undefined;
    let idx = 0;

    const executeStep = () => {
      const step = task.steps[idx];
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

  private getTask(creep: Creep): Coordinate | undefined {
    const task = creep.memory.task ? this.parseTaskCoordinate(creep.memory.task) : undefined;
    if (!task) {
      creep.memory.taskId = undefined;
      return undefined;
    }
    if (
      !creep.memory.taskId ||
      RoleMap[creep.memory.role].tasks[task.tier]?.[task.priority]?.id !== creep.memory.taskId
    ) {
      console.log(
        `${creep.name} has task and taskId mismatch ${creep.memory.task ?? "undefined"} ${
          creep.memory.taskId ?? "undefined"
        }. Clearing task.`
      );
      creep.memory.task = undefined;
      creep.memory.taskId = undefined;
      clearTaskTargets(creep);
      return undefined;
    }
    return task;
  }

  public loop(): void {
    for (const name in Game.creeps) {
      const creep = Game.creeps[name];
      const role = this.getRole(creep);
      const ctx: TaskContext = {
        status: TaskStatus.InProgress
      };

      let stopExecution = false;
      let debugReport = `${creep.name} is ${role}\n`;
      const lastTask = this.getTask(creep);

      for (let i = 0; i < RoleMap[role].tasks.length; i++) {
        const tier = RoleMap[role].tasks[i];
        const tasks = tier.slice();
        if (lastTask) {
          if (lastTask.tier === i) {
            // add the in-progress task to the front
            // tasks.splice(tasks.indexOf(creep.memory.task), 1);
            tasks.unshift(RoleMap[role].tasks[i][lastTask.priority]);
          }
        }
        for (const task of tasks) {
          const priority = RoleMap[role].tasks[i].indexOf(task);
          this.executeTask(creep, task, ctx);
          if (creep.memory.debug) {
            if (ctx.note) debugReport += `  ${task.id}: ${ctx.status} (${ctx.note})\n`;
            else debugReport += `  ${task.id}: ${ctx.status}\n`;
          }
          if (ctx.status === TaskStatus.Complete) {
            if (this.isCoordinateEqual(lastTask, { tier: i, priority })) {
              creep.memory.task = undefined;
              creep.memory.taskId = undefined;
              clearTaskTargets(creep);
            }
          } else if (ctx.status === TaskStatus.InProgress) {
            if (!this.isCoordinateEqual(lastTask, { tier: i, priority })) {
              creep.memory.task = `${i},${priority}`;
              creep.memory.taskId = task.id;
              creep.say(task.displayName);
            }
            stopExecution = true;
            break;
          } else if (ctx.status === TaskStatus.Background) {
            creep.memory.task = undefined;
            creep.memory.taskId = undefined;
            creep.say(task.displayName);
            stopExecution = true;
            break;
          }
        }
        if (stopExecution) break;
      }

      if (creep.memory.debug) {
        logger.log(debugReport);
        creep.room.visual.circle(creep.pos, {
          radius: 0.5,
          stroke: "red",
          strokeWidth: 0.1
        });
      }
    }
  }
}

export default new CreepTaskManager();
