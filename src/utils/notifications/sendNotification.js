const messaging = require('./messaging');

const MAX_TOKENS_PER_BATCH = 500; // Maximum tokens per batch

const sendNotification = async (title , body , tokens ) => {

    const notificationData = {
        title,
        body,
    };

    const tokenBatches = [];
    for (let i = 0; i < tokens.length; i += MAX_TOKENS_PER_BATCH) {
        tokenBatches.push(tokens.slice(i, i + MAX_TOKENS_PER_BATCH));
    }

    for (const batchTokens of tokenBatches) {
        try {
            const message = {
                tokens: batchTokens,
                notification: notificationData,
                android: {
                    priority: "high",
                    notification: {
                        sound: "default" ,
                    }
                },
                apns: {
                    payload: {
                        aps: {
                            sound: "default"
                        }
                    }
                }
            };
   
            const response = await messaging.sendEachForMulticast(message , false);
            console.log({ response : response.responses[0].error })
            console.log("Notifications sent:", `${response.successCount} successful, ${response.failureCount} failed`);
        } catch (error) {
            console.log("Error sending message:", error);
        }
    }
};

module.exports = sendNotification;
