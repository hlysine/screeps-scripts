import Task from "creep/tasks/Task";
import CreepTaskManager from "managers/CreepTaskManager";

declare global {
  interface Creep {
    countBodyParts(part: BodyPartConstant): number;
    isOffensive(): boolean;
    terminateTask(id: Id<Task>): void;
  }
}

Creep.prototype.countBodyParts = function (part: BodyPartConstant): number {
  return this.body.filter(p => p.type === part).length;
};

Creep.prototype.isOffensive = function (): boolean {
  return (
    this.countBodyParts(ATTACK) > 0 ||
    this.countBodyParts(RANGED_ATTACK) > 0 ||
    this.countBodyParts(CLAIM) > 0 ||
    this.countBodyParts(HEAL) > 0
  );
};

Creep.prototype.terminateTask = function (id: Id<Task>): void {
  CreepTaskManager.terminateTask(this, id);
};

export {};
