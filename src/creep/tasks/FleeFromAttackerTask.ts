import { completeTask } from "./SharedSteps";
import Task, { TaskStatus, makeTask } from "./Task";

const FleeFromAttackerTask = makeTask({
  id: "flee_from_attacker" as Id<Task>,
  displayName: "Flee from attacker",
  data: () => null,

  steps: [
    (creep, ctx, next) => {
      const target = creep.room
        .lookForAtArea(LOOK_CREEPS, creep.pos.y - 3, creep.pos.x - 3, creep.pos.y + 3, creep.pos.x + 3, true)
        .filter(r => !r.creep.my && r.creep.getActiveBodyparts(ATTACK) + r.creep.getActiveBodyparts(RANGED_ATTACK) > 0)
        .minBy(r => r.creep.pos.getRangeTo(creep));
      if (target) {
        const ret = PathFinder.search(creep.pos, { pos: target.creep.pos, range: 3 }, { flee: true });
        const pos = ret.path[0];
        creep.move(creep.pos.getDirectionTo(pos));
        ctx.status = TaskStatus.Complete;
        return;
      }
      next();
    },
    completeTask
  ]
});

export default FleeFromAttackerTask;
