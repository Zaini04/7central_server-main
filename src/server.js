const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const {connectDB} = require('./utils/db');
const cors = require('cors');
const path = require('path');
const app = express();
const http = require('http');
const cookieParser = require("cookie-parser");
const loggingMiddlewares = require("./middlewares/loggingMiddlewares.js");
const cron = require("node-cron");
const { processInstallmentReminders } = require('./crons/installmentReminderJob.js');

connectDB();

// Runs every day at 9:00 AM
cron.schedule("0 9 * * *", async () => {
  console.log("Running Installment Reminder Cron:", new Date());

  try {
    await processInstallmentReminders();
    console.log("Installment reminders processed successfully");
  } catch (error) {
    console.error("Installment reminder cron failed:", error.message);
  }
});
const allowedOrigins = process.env.ALLOWED_ORIGINS;
const corsOptions = {
    origin : function (origin , callback ) {
        if (allowedOrigins.includes(origin) || !origin) {
            callback(null , true)
        }else {
            callback(new Error('Not allowed by cors.'))
        }  
    } ,
    optionsSuccessStatus: 200,
    credentials: true,
}

// MIDDLEWARES
app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.json({ limit : '100mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname , 'uploads')));
app.use(mongoSanitize());

// ROUTES
app.use('/api/user' , require('./routes/userRoutes'));
app.use('/api/project' , require('./routes/projectRoutes'));
app.use('/api/sector' , require('./routes/sectorRoutes'));
app.use('/api/customer' , require('./routes/customerRoutes'));
app.use('/api/inventory' , require('./routes/inventoryRoutes'));
app.use('/api/document' , require('./routes/documentRoutes'));
app.use('/api/notification-setting' , require('./routes/notificationSettingRoutes'));
app.use('/api/notification' , require('./routes/notificationRoutes'));
app.use('/api/sale' , require('./routes/saleRoutes'));
app.use('/api/payment' , require('./routes/paymentRoutes.js'));
app.use('/api/provisional-receipt' , require('./routes/prRoutes.js'));
app.use('/api/report' , require('./routes/reportRoutes.js'));
app.use("/api/notification-templates", require("./routes/notificationTemplateRoutes"));
app.use("/api/broadcast-campaigns", require("./routes/broadcastCampaignRoutes"));
app.use("/api/notification-logs", require("./routes/notificationLogRoutes"));

app.use("/", loggingMiddlewares.respondNoResourceFound);

// GLOBAL ERROR HANDLER
app.use("/", require("./middlewares/errorHandler"));


// initialize scoket
const server = http.createServer(app);
    //  processInstallmentReminders();
    // console.log("Installment reminders processed successfully");

const PORT = process.env.PORT || 4949;
server.listen(PORT , () => console.log(`Server is listening on port ${PORT}`));


// GRACEFULLY SHUTDOWN
const gracefulShutdown = async () => {
    console.log('Gracefully shutting down...');
    server.close(() => {
        console.log('Server closed successfully. Process terminated!');
        process.exit(0);
    });
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
