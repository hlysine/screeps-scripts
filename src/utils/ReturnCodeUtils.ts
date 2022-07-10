export function isMoveSuccess(moveResult: number): boolean {
  return moveResult === OK || moveResult === ERR_TIRED;
}

export function isHarvestSuccess(harvestResult: number): boolean {
  return harvestResult === OK || harvestResult === ERR_TIRED;
}
