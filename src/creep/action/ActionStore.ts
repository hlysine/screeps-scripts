import Action, { ActionType } from "./Action";
import BuildAction from "./BuildAction";
import DefendAction from "./DefendAction";
import HarvestAction from "./HarvestAction";
import IdleAction from "./IdleAction";
import TransferAction from "./TransferAction";
import UpgradeAction from "./UpgradeAction";
import UrgentUpgradeAction from "./UrgentUpgradeAction";

type ActionMap = {
  [key in ActionType]: Action;
};

export const Actions = [
  new BuildAction(),
  new DefendAction(),
  new HarvestAction(),
  new IdleAction(),
  new TransferAction(),
  new UpgradeAction(),
  new UrgentUpgradeAction()
];

export const ActionMap = Actions.reduce<ActionMap>((map, action) => {
  map[action.type] = action;
  return map;
}, {} as ActionMap);
