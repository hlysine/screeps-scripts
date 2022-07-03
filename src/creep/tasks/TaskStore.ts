import Task from "./Task";

import AttackCreepTask from "./AttackCreepTask";
import AttackStructureTask from "./AttackStructureTask";
import BuildOwnedTask from "./build/BuildOwnedTask";
import BuildTask from "./build/BuildTask";
import ClaimTask from "./ClaimTask";
import HarvestTask from "./HarvestTask";
import IdleTask from "./IdleTask";
import MoveToFlagRoomTask from "./MoveToFlagRoomTask";
import MoveToFlagTask from "./MoveToFlagTask";
import RangedAttackAutoTask from "./RangedAttackAutoTask";
import RetreatToSpawnTask from "./RetreatToSpawnTask";
import RetreatWhenNoFlagTask from "./RetreatWhenNoFlagTask";
import TransferOwnedTask from "./transfer/TransferOwnedTask";
import TransferTask from "./transfer/TransferTask";
import TransferToHostileCreepTask from "./TransferToHostileCreepTask";
import UpgradeTask from "./UpgradeTask";
import UrgentUpgradeTask from "./UrgentUpgradeTask";

interface TaskMap {
  [key: string]: Task;
}

export const Tasks = [
  AttackCreepTask,
  AttackStructureTask,
  BuildOwnedTask,
  BuildTask,
  ClaimTask,
  HarvestTask,
  IdleTask,
  MoveToFlagRoomTask,
  MoveToFlagTask,
  RangedAttackAutoTask,
  RetreatToSpawnTask,
  RetreatWhenNoFlagTask,
  TransferOwnedTask,
  TransferTask,
  TransferToHostileCreepTask,
  UpgradeTask,
  UrgentUpgradeTask
];

export const TaskMap = Tasks.reduce<TaskMap>((map, task) => {
  map[task.id] = task;
  return map;
}, {} as TaskMap);
