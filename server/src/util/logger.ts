/**
 * @overview Logging module for 2Keys, from https://github.com/Gum-Joe/tara
 * @module logger
 */
import chalk, { Chalk } from "chalk";
import { Logger as LoggerArgs, LoggerTypes } from "./interfaces";
import { DEBUG } from "./constants";

export default class Logger {
  private args: LoggerArgs;
  private argv: string[];
  private isDebug: boolean;
  private chalk: Chalk;
  constructor(args: LoggerArgs) {
    this.args = args || { name: "logger" };
    this.argv = process.argv;
    this.isDebug = this.argv.includes("--debug") || this.argv.includes("--verbose") || this.argv.includes("-v") || process.env.DEBUG === "true";
    this.chalk = new chalk.constructor();
  }

  // Logger methods
  /**
   * Basic Logger
   * @param level {String} Log Level
   * @param colour {String} colour of string
   * @param text {String} Text to log
   * @param type {WINDOW_TYPE|PROCESS_TYPE} What sent the log (window or main process)
   * @param args {LoggerArgs} Logger args
   * @private
   */
  private _log(level: string, colour: string, text: string, type: string = this.type, args: LoggerArgs = this.args) {
    if (!this.argv.includes("--silent")) {
      // Add prefix
      let prefix = "";
      if (args.hasOwnProperty("name")) {
        prefix = this.chalk.magenta(args.name) + " "; // eslint-disable-line prefer-template
      }
      console.log(`${prefix}${this.chalk[colour](level)} ${text}`);
    }
  }
  /*
   * Info method
   * @public
   * @color green
   */
  public info(text: string) {
    this._log("info", "green", text);
  }

  /*
   * Warn method
   * @public
   * @color green
   */
  public warn(text: string) {
    if (!this.argv.includes("--silent")) {
      // Add prefix
      let prefix = "";
      if (this.args.hasOwnProperty("name")) {
        prefix = this.chalk.magenta(this.args.name) + " "; // eslint-disable-line prefer-template
      }
      console.warn(`${prefix}${this.chalk.yellow("warn")} ${text}`);
    }
  }
  /*
   * Error method
   * @color green
   * @public
   */
  public err(text: string) {
    if (!this.argv.includes("--silent")) {
      // Add prefix
      let prefix = "";
      if (this.args.hasOwnProperty("name")) {
        prefix = this.chalk.magenta(this.args.name) + " "; // eslint-disable-line prefer-template
      }
      console.error(`${prefix}${this.chalk.red("err")} ${text}`);
    }
  }

  /*
   * Debug/verbose method
   * @color green
   * @public
   */
  public debug(text: string) {
    this._log(DEBUG, "cyan", text);
  }

  /*
   * Throw an Error
   * @param err {Error} Error to throw
   * @throw Error
   * @public
   */
  public throw(err: Error) {
    this.throw_noexit(err);
    process.exit(1);
  }

  /**
   * Throw without exit method
   * @colour red
   * @param err {Error} error to throw
   * From Bedel
   * @public
   */
  public throw_noexit(err: Error) {
    if (!this.argv.includes("--silent")) {
      this.err("");
      this.err(`${err.stack.split("\n")[0]}`);
      this.err("");
      if (this.isDebug || process.env.NODE_ENV !== "production") {
        this.err("Full error:");
        this.err("");
        let e: any = 0;
        for (e of err.stack.split("\n")) {
          this.err(e);
        }
      }
      this.err("");
    }
  }

}