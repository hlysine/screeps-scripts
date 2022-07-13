import AttackerRole from "./AttackerRole";
import ClaimerRole from "./ClaimerRole";
import DefenderRole from "./DefenderRole";
import HelperRole from "./HelperRole";
import WorkerRole from "./WorkerRole";
import Role from "./Role";
import HaulerRole from "./HaulerRole";
import EnergyHarvesterRole from "./EnergyHarvesterRole";
import MineralHarvesterRole from "./MineralHarvesterRole";

interface RoleMap {
  [key: Id<Role>]: typeof Roles[number];
}

export const Roles = [
  WorkerRole,
  DefenderRole,
  AttackerRole,
  EnergyHarvesterRole,
  MineralHarvesterRole,
  HaulerRole,
  ClaimerRole,
  HelperRole
];

export const RoleMap = Roles.reduce<RoleMap>((map, role) => {
  map[role.id] = role;
  return map;
}, {} as RoleMap);
