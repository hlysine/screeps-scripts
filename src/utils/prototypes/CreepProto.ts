import Task from "creep/tasks/Task";
import CreepTaskManager from "managers/CreepTaskManager";

declare global {
  interface Creep {
    /**
     * Returns the number of both active and inactive body parts of the given type.
     * @param part A body part constant
     */
    countBodyParts(part: BodyPartConstant): number;
    /**
     * Check if a creep has offensive body parts.
     */
    isOffensive(): boolean;
    /**
     * Terminate the in-progress task of the creep if the provided task id matches the current task.
     * @param id The id of the task to terminate.
     */
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
