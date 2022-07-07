import AttackerRole from "./AttackerRole";
import ClaimerRole from "./ClaimerRole";
import DefenderRole from "./DefenderRole";
import HarvesterRole from "./HarvesterRole";
import HelperRole from "./HelperRole";
import WorkerRole from "./WorkerRole";
import Role from "./Role";

interface RoleMap {
  [key: Id<Role>]: typeof Roles[number];
}

export const Roles = [WorkerRole, DefenderRole, AttackerRole, HarvesterRole, ClaimerRole, HelperRole];

export const RoleMap = Roles.reduce<RoleMap>((map, role) => {
  map[role.id] = role;
  return map;
}, {} as RoleMap);
