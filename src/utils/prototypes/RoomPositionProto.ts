declare global {
  interface RoomPosition {
    findClosestHostileByPath(): Creep | null;
    findClosestHostileByRange(): Creep | null;
  }
}

RoomPosition.prototype.findClosestHostileByPath = function (): Creep | null {
  return this.findClosestByPath(FIND_HOSTILE_CREEPS, {
    filter: c => c.isOffensive()
  });
};

RoomPosition.prototype.findClosestHostileByRange = function (): Creep | null {
  return this.findClosestByRange(FIND_HOSTILE_CREEPS, {
    filter: c => c.isOffensive()
  });
};

export {};
