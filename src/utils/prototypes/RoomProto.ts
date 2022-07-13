declare global {
  interface Room {
    /**
     * Find creeps in this room that are truly hostile.
     */
    findTrulyHostileCreeps(): Creep[];
  }
}

Room.prototype.findTrulyHostileCreeps = function (): Creep[] {
  return this.find(FIND_HOSTILE_CREEPS, {
    filter: _ => true // c.isOffensive()
  });
};

export {};
