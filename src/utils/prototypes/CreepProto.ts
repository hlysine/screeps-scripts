declare global {
  interface Creep {
    countBodyParts(part: BodyPartConstant): number;
    isOffensive(): boolean;
  }
}

Creep.prototype.countBodyParts = function (part: BodyPartConstant): number {
  return this.body.filter(p => p.type === part).length;
};

Creep.prototype.isOffensive = function (): boolean {
  return (
    this.countBodyParts(ATTACK) > 0 ||
    this.countBodyParts(RANGED_ATTACK) > 0 ||
    this.countBodyParts(CLAIM) > 0 ||
    this.countBodyParts(HEAL) > 0
  );
};

export {};
