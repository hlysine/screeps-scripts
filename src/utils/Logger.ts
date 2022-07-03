export default class Logger {
  public readonly source: string;

  public constructor(source: string) {
    this.source = source;
  }

  public log(...args: any[]): void {
    console.log(`[${this.source}]`, ...args);
  }

  public warn(...args: any[]): void {
    console.warn(`[${this.source}]`, ...args);
  }

  public error(...args: any[]): void {
    console.error(`[${this.source}]`, ...args);
  }

  public debug(...args: any[]): void {
    console.debug(`[${this.source}]`, ...args);
  }

  public info(...args: any[]): void {
    console.info(`[${this.source}]`, ...args);
  }
}
