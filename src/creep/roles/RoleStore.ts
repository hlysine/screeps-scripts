import Task from "creep/tasks/Task";
import AttackerRole from "./AttackerRole";
import ClaimerRole from "./ClaimerRole";
import DefenderRole from "./DefenderRole";
import HelperRole from "./HelperRole";
import Role from "./Role";
import WorkerRole from "./WorkerRole";

interface RoleMap {
  [key: Id<Role>]: typeof Roles[number];
}

function validateRole(role: Role): void {
  const taskIds: Id<Task>[] = [];
  for (const tier of role.tasks) {
    for (const taskId of tier) {
      if (taskIds.includes(taskId)) {
        console.log(`Duplicate task ${taskId} in role ${role.id}`);
      }
      taskIds.push(taskId);
    }
  }
}

export const Roles = [WorkerRole, DefenderRole, AttackerRole, ClaimerRole, HelperRole];

export const RoleMap = Roles.reduce<RoleMap>((map, role) => {
  map[role.id] = role;
  validateRole(role);
  return map;
}, {} as RoleMap);
