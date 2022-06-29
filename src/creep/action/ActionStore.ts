import Action, { ActionType } from "./Action";
import BuildAction from "./BuildAction";
import HarvestAction from "./HarvestAction";
import IdleAction from "./IdleAction";
import TransferAction from "./TransferAction";
import UpgradeAction from "./UpgradeAction";
import UrgentUpgradeAction from "./UrgentUpgradeAction";

type ActionMap = {
  [key in ActionType]: Action;
};

export const Actions = [
  new HarvestAction(),
  new UrgentUpgradeAction(),
  new TransferAction(),
  new BuildAction(),
  new UpgradeAction(),
  new IdleAction()
];

export const ActionMap = Actions.reduce<ActionMap>((map, action) => {
  map[action.type] = action;
  return map;
}, {} as ActionMap);
