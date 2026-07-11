const { createLogger, format, transports, level } = require('winston');
const { combine, timestamp, label, printf, json } = format;

require('dotenv').config();

module.exports = prefix => {
    // Customizing output for log
    // const logFormat = printf(({ level, message, label, timestamp }) => {
    //     return `${timestamp} | [${label}] | ${level.toUpperCase()}: ${message}`;
    // });

    const formatConf = format.combine(
        label({ label : prefix }),
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        format.json(),
        format.prettyPrint(),
        // logFormat
    );
      
    const infoLogger = createLogger({
        transports: [
            new transports.File({
                level: "info",
                filename: 'src/logs/' + process.env.INFO_LOG_FILE,
            }),
        ],
        format: formatConf,
        statusLevels: true,
    });
      
    const errLogger = createLogger({
        transports: [
            new transports.File({
                level: "error",
                filename: 'src/logs/' + process.env.ERROR_LOG_FILE,
            }),
        ],
        format: formatConf,
        statusLevels: true,
    });

    const warnLogger = createLogger({
        transports: [
            new transports.File({
                level: "warn",
                filename: 'src/logs/' + process.env.WARN_LOG_FILE,
            }),
        ],
        format: formatConf,
        statusLevels: true,
    });

    const queueLogger = createLogger({
        transports: [
            new transports.File({
                level: "info",
                filename: 'src/logs/' + process.env.QUEUE_LOG_FILE,
            }),
        ],
        format: formatConf,
        statusLevels: true,
    });


    var module = {
        info(msg) {
            infoLogger.info(`${msg}`); 
        } ,
        error (msg) {
            console.log({ error : msg })
            errLogger.error(`${msg}`)
        } ,
        warn (msg) {
            warnLogger.warn(`${msg}`)
        } ,

        queue (msg) {
            queueLogger.info(`${msg}`)
        } ,

        /**
         * This method will be used as middleware for all requests.
         * See routes.
        **/
        printRequest(req, res, next) {
            const { method, originalUrl, body } = req;

            let msg = `${method} ${originalUrl}`;
            let bodyToPrint = {...body};
            if (Object.keys(bodyToPrint).length > 0) { 
                if(bodyToPrint.image) { // bcz we don't want to print base64 string
                    bodyToPrint.image = 1;
                }else if(bodyToPrint.images) {
                    bodyToPrint.images = bodyToPrint.images.length;
                }
                msg += ` | body : ${JSON.stringify(bodyToPrint)}`; 
            }
            
            infoLogger.info(msg);
            next();
        }
    };

    return module;
}