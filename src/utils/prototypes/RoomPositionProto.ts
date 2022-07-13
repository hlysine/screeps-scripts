declare global {
  interface RoomPosition {
    /**
     * Find the closest hostile creep by path. This only finds creeps that are "truly hostile".
     */
    findClosestHostileByPath(): Creep | null;
    /**
     * Find the closest hostile creep by range. This only finds creeps that are "truly hostile".
     */
    findClosestHostileByRange(): Creep | null;
  }
}

RoomPosition.prototype.findClosestHostileByPath = function (): Creep | null {
  return this.findClosestByPath(FIND_HOSTILE_CREEPS, {
    filter: _ => true // c.isOffensive()
  });
};

RoomPosition.prototype.findClosestHostileByRange = function (): Creep | null {
  return this.findClosestByRange(FIND_HOSTILE_CREEPS, {
    filter: _ => true // c.isOffensive()
  });
};

export {};
