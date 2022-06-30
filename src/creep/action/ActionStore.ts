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
import RetreatToBaseAction from "./RetreatToBaseAction";

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
  new UpgradeAction(),
  new UrgentUpgradeAction(),
  new ClaimAction(),
  new RetreatToBaseAction()
];

export const ActionMap = Actions.reduce<ActionMap>((map, action) => {
  map[action.type] = action;
  return map;
}, {} as ActionMap);