import { RoleMap, Roles } from "creep/roles/RoleStore";
import Role from "creep/roles/Role";
import WorkerRole from "creep/roles/WorkerRole";
import Task, { TaskContext, TaskStatus } from "creep/tasks/Task";
import Logger from "utils/Logger";
import Manager from "./Manager";

const logger = new Logger("CreepTaskManager");

interface Coordinate {
  tier: number;
  priority: number;
}

class CreepTaskManager extends Manager {
  public visualization = false;

  private determineRole(creep: Creep): Id<Role> {
    return Roles.find(role => role.identifyRole(creep))?.id ?? WorkerRole.id;
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

  private clearTask(creep: Creep): void {
    creep.memory.task = undefined;
    creep.memory.taskId = undefined;
    creep.memory.isBackground = undefined;
    creep.memory.target = undefined;
    creep.memory.targetId = undefined;
    creep.memory.data = undefined;
  }

  private getTask(creep: Creep): Coordinate | undefined {
    const task = creep.memory.task ? this.parseTaskCoordinate(creep.memory.task) : undefined;
    if (!task) {
      this.clearTask(creep);
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
      this.clearTask(creep);
      return undefined;
    }
    return task;
  }

  /**
   * Terminate the current task of the creep if the id provided matches its current task.
   * @param creep The creep to terminate the task of.
   * @param id The id of the task to terminate.
   */
  public terminateTask(creep: Creep, id: Id<Task>): void {
    this.getTask(creep);
    if (creep.memory.taskId === id) {
      this.clearTask(creep);
    }
  }

  /**
   * Reset all task states so that all creeps refresh their task.
   */
  public resetAllCreeps(): void {
    for (const creepName in Game.creeps) {
      const creep = Game.creeps[creepName];
      this.clearTask(creep);
    }
  }

  private processCreep(creep: Creep): void {
    const role = this.getRole(creep);
    const ctx: TaskContext = {
      status: TaskStatus.InProgress,
      data: undefined
    };

    let stopExecution = false;
    let debugReport = `${creep.name} is ${role}\n`;
    let lastTask = this.getTask(creep);

    for (let i = 0; i < RoleMap[role].tasks.length; i++) {
      const tier = RoleMap[role].tasks[i];
      const tasks = tier.slice();
      if (lastTask) {
        if (lastTask.tier === i) {
          if (!creep.memory.isBackground) {
            // add the in-progress task to the front
            // tasks.splice(tasks.indexOf(creep.memory.task), 1);
            tasks.unshift(RoleMap[role].tasks[i][lastTask.priority]);
          }
        }
      }
      for (const task of tasks) {
        const priority = RoleMap[role].tasks[i].indexOf(task);
        let savedData = false;
        if (this.isCoordinateEqual(lastTask, { tier: i, priority })) {
          ctx.data = creep.memory.data ?? task.data(creep);
          savedData = true;
        } else {
          ctx.data = task.data(creep);
        }
        this.executeTask(creep, task, ctx);
        if (creep.memory.debug) {
          if (ctx.note)
            debugReport += `  ${task.id}: ${ctx.status} (${savedData ? "use last data" : "new data"}) (${ctx.note})\n`;
          else debugReport += `  ${task.id}: ${ctx.status} (${savedData ? "use last data" : "new data"})\n`;
        }
        if (ctx.status === TaskStatus.Complete) {
          if (this.isCoordinateEqual(lastTask, { tier: i, priority })) {
            this.clearTask(creep);
            lastTask = undefined;
          }
        } else if (ctx.status === TaskStatus.InProgress || ctx.status === TaskStatus.Background) {
          if (!this.isCoordinateEqual(lastTask, { tier: i, priority })) {
            creep.memory.task = `${i},${priority}`;
            creep.memory.taskId = task.id;
            creep.say(task.displayName);
          }
          creep.memory.isBackground = ctx.status === TaskStatus.Background;
          creep.memory.data = ctx.data;
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

  protected override loop(): void {
    for (const name in Game.creeps) {
      const creep = Game.creeps[name];
      const cpu = Game.cpu.getUsed();
      this.processCreep(creep);
      const cpuUsed = Game.cpu.getUsed() - cpu;
      if (cpuUsed >= 1 || this.visualization) {
        console.log(
          `${cpuUsed >= 1 ? "#" : " "} ${creep.name.padEnd(40, " ")} used ${cpuUsed
            .toFixed(4)
            .padStart(7)} CPU at ${creep.pos.toString()}`
        );
      }
    }
  }
}

export default new CreepTaskManager();
