import Action, { ActionType } from "./Action";
import BuildAction from "./BuildAction";
import AttackCreepAction from "./AttackCreepAction";
import AttackStructureAction from "./AttackStructureAction";
import HarvestAction from "./HarvestAction";
import IdleAction from "./IdleAction";
import TransferAction from "./TransferAction";
import UpgradeAction from "./UpgradeAction";
import UrgentUpgradeAction from "./UrgentUpgradeAction";
import MoveToFlagAction from "./MoveToFlagAction";
import ClaimAction from "./ClaimAction";
import RetreatToSpawnAction from "./RetreatToSpawnAction";
import TransferToCreepAction from "./TransferToCreepAction";

type ActionMap = {
  [key in ActionType]: Action;
};

export const Actions = [
  new BuildAction(),
  new HarvestAction(),
  new IdleAction(),
  new MoveToFlagAction(),
  new AttackCreepAction(),
  new AttackStructureAction(),
  new TransferAction(),
  new TransferToCreepAction(),
  new UpgradeAction(),
  new UrgentUpgradeAction(),
  new ClaimAction(),
  new RetreatToSpawnAction()
];

export const ActionMap = Actions.reduce<ActionMap>((map, action) => {
  map[action.type] = action;
  return map;
}, {} as ActionMap);
