declare global {
  interface Room {
    findTrulyHostileCreeps(): Creep[];
  }
}

Room.prototype.findTrulyHostileCreeps = function (): Creep[] {
  return this.find(FIND_HOSTILE_CREEPS, {
    filter: c => c.isOffensive()
  });
};

export {};
