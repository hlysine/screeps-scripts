export default interface StructureBrain<TStructure extends Structure> {
  run: (structure: TStructure) => void;
}
