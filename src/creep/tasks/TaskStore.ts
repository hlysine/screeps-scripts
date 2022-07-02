import Task from "./Task";

import AttackCreepTask from "./AttackCreepTask";
import AttackStructureTask from "./AttackStructureTask";
import BuildTask from "./BuildTask";
import ClaimTask from "./ClaimTask";
import HarvestTask from "./HarvestTask";
import IdleTask from "./IdleTask";
import MoveToFlagTask from "./MoveToFlagTask";
import RangedAttackAutoTask from "./RangedAttackAutoTask";
import RetreatToSpawnTask from "./RetreatToSpawnTask";
import TransferTask from "./TransferTask";
import TransferToCreepTask from "./TransferToCreepTask";
import UpgradeTask from "./UpgradeTask";
import UrgentUpgradeTask from "./UrgentUpgradeTask";

interface TaskMap {
  [key: string]: Task;
}

export const Tasks = [
  AttackCreepTask,
  AttackStructureTask,
  BuildTask,
  ClaimTask,
  HarvestTask,
  IdleTask,
  MoveToFlagTask,
  RangedAttackAutoTask,
  RetreatToSpawnTask,
  TransferTask,
  TransferToCreepTask,
  UpgradeTask,
  UrgentUpgradeTask
];

export const TaskMap = Tasks.reduce<TaskMap>((map, task) => {
  map[task.id] = task;
  return map;
}, {} as TaskMap);
