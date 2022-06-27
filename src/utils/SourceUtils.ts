export function findFreeSpots(source: Source): RoomPosition[] {
  const ret: RoomPosition[] = [];
  const terrain = source.room.getTerrain();
  const creeps = Object.values(Game.creeps);
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if (i !== 0 || j !== 0) {
        const tile = terrain.get(source.pos.x + i, source.pos.y + j);
        if (!(tile & TERRAIN_MASK_LAVA) && !(tile & TERRAIN_MASK_WALL)) {
          if (
            creeps.find(
              c =>
                c.room.name === source.room.name &&
                c.memory.target?.x === source.pos.x + i &&
                c.memory.target?.y === source.pos.y + j
            ) === undefined
          ) {
            ret.push(new RoomPosition(source.pos.x + i, source.pos.y + j, source.room.name));
          }
        }
      }
    }
  }
  return ret;
}
