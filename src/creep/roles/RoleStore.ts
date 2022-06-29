import AttackerRole from "./AttackerRole";
import { RoleType } from "./Role";
import WorkerRole from "./WorkerRole";

type RoleMap = {
  [key in RoleType]: typeof Roles[number];
};

export const Roles = [WorkerRole, AttackerRole];

export const RoleMap = Roles.reduce<RoleMap>((map, role) => {
  map[role.type] = role;
  return map;
}, {} as RoleMap);
