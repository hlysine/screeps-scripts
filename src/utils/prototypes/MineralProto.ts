declare global {
  interface Mineral {
    getExtractor(): StructureExtractor | undefined;
  }
}

Mineral.prototype.getExtractor = function (): StructureExtractor | undefined {
  if (!this.room) return undefined;
  return this.pos.lookFor(LOOK_STRUCTURES).find(s => s.structureType === STRUCTURE_EXTRACTOR) as
    | StructureExtractor
    | undefined;
};

export {};
