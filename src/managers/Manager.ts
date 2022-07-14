import { getClassMethods } from "utils/TypeUtils";

export function help(manager: Manager): string {
  let helpText = `Manager: ${manager.constructor.name}\n`;
  helpText += `Fields: ${Object.keys(manager).join(", ")}\n`;
  helpText += `Methods: ${getClassMethods(manager).join(", ")}`;
  return helpText;
}

export default abstract class Manager {
  protected abstract loop(): void;

  public run(): number {
    const cpu = Game.cpu.getUsed();
    this.loop();
    return Game.cpu.getUsed() - cpu;
  }

  public help(): string {
    return help(this);
  }
}
