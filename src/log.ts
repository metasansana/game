
/**
 * Logger
 *
 * Conveinence logger, mostly for debugging.
 */
export class Logger {

    static info(...msg: any[]): Logger {

      if ((<any>window).ENABLE_LOGGER)
            console.info.apply(console, msg);
        return this;

    }

    static warn(...msg: any[]): Logger {

      if ((<any>window).ENABLE_LOGGER)
            console.warn.apply(console, msg);
        return this;

    }

}
