import AttackerRole from "./AttackerRole";
import ClaimerRole from "./ClaimerRole";
import DefenderRole from "./DefenderRole";
import HelperRole from "./HelperRole";
import Role from "./Role";
import WorkerRole from "./WorkerRole";

interface RoleMap {
  [key: Id<Role>]: typeof Roles[number];
}

export const Roles = [WorkerRole, DefenderRole, AttackerRole, ClaimerRole, HelperRole];

export const RoleMap = Roles.reduce<RoleMap>((map, role) => {
  map[role.id] = role;
  return map;
}, {} as RoleMap);
