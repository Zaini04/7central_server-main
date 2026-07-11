// src/utils/sendSms.js
const axios = require("axios");

const sendSms = async ({
  to,
  message,
}) => {
  try {
    if (!to) {
      throw new Error("Phone number is required");
    }

    if (!message) {
      throw new Error("SMS message is required");
    }

    // normalize phone (optional: adjust for your country)
    let phone = String(to).trim();

    // Example: ensure it starts with country code (Pakistan)
    if (phone.startsWith("0")) {
      phone = "+92" + phone.slice(1);
    }

    // encode message for URL
    const encodedMessage = encodeURIComponent(message);

    // const url = `https://api.veevotech.com/v3/sendsms?hash=${process.env.OTP_API_KEY}&receivenum=${phone}&sendernum=Default&textmessage=${encodedMessage}`;
    const url = `https://api.veevotech.com/v3/sendsms?hash=${process.env.OTP_API_KEY}&receivernum=${phone}&receivernet work=Receiver_Network&sendernum=Default&textmessage=${encodedMessage}`;

    const response = await axios.get(url);

    console.log("SMS API Response:", JSON.stringify(response.data));
    if(response.data.STATUS === "ERROR") {
      throw new Error(`SMS API Error: ${JSON.stringify(response.data)}`);
    }

    return {
      success: true,
      response: response.data,
    };
  } catch (error) {
    console.error("SMS ERROR:", error?.response?.data || error.message);
      throw new Error(`SMS API Error: ${error.message}`);

    // return {
    //   success: false,
    //   error: error?.response?.data || error.message,
    // };
  }
};

module.exports = sendSms;