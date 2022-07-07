export default class Logger {
  public readonly source: string;

  public constructor(source: string) {
    this.source = source;
  }

  public log(...args: any[]): void {
    console.log(`[${this.source}]`, ...args);
  }
}
