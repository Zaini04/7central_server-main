const { createLogger, format, transports } = require("winston");
const { combine, timestamp, label } = format;

require("dotenv").config();

module.exports = (prefix) => {
  const formatConf = combine(
    label({ label: prefix }),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.json(),
    format.prettyPrint()
  );

  // Use file logs locally, console logs on Vercel
  const getTransports = (level, fileName) => {
    if (process.env.VERCEL) {
      return [
        new transports.Console({
          level,
        }),
      ];
    }

    return [
      new transports.File({
        level,
        filename: `src/logs/${fileName}`,
      }),
    ];
  };

  const infoLogger = createLogger({
    level: "info",
    format: formatConf,
    transports: getTransports("info", process.env.INFO_LOG_FILE),
  });

  const errLogger = createLogger({
    level: "error",
    format: formatConf,
    transports: getTransports("error", process.env.ERROR_LOG_FILE),
  });

  const warnLogger = createLogger({
    level: "warn",
    format: formatConf,
    transports: getTransports("warn", process.env.WARN_LOG_FILE),
  });

  const queueLogger = createLogger({
    level: "info",
    format: formatConf,
    transports: getTransports("info", process.env.QUEUE_LOG_FILE),
  });

  return {
    info(msg) {
      infoLogger.info(msg);
    },

    error(msg) {
      console.error(msg);
      errLogger.error(msg);
    },

    warn(msg) {
      warnLogger.warn(msg);
    },

    queue(msg) {
      queueLogger.info(msg);
    },

    printRequest(req, res, next) {
      const { method, originalUrl, body } = req;

      let msg = `${method} ${originalUrl}`;
      let bodyToPrint = { ...body };

      if (Object.keys(bodyToPrint).length > 0) {
        if (bodyToPrint.image) {
          bodyToPrint.image = 1;
        } else if (bodyToPrint.images) {
          bodyToPrint.images = bodyToPrint.images.length;
        }

        msg += ` | body : ${JSON.stringify(bodyToPrint)}`;
      }

      infoLogger.info(msg);
      next();
    },
  };
};