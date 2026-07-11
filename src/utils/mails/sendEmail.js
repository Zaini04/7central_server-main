// src/utils/sendEmail.js
const nodemailer = require("nodemailer");
const { APP_NAME } = require("../../constants/app.constants");

const createTransporter = () => {
  return nodemailer.createTransport({
    name: process.env.EMAIL_HOST,
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: Number(process.env.EMAIL_PORT) === 465, // true for 465, false for others
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

const buildDefaultHtmlTemplate = ({
  title = APP_NAME,
  heading = APP_NAME,
  content = "",
  footerText = `Thank you for choosing ${APP_NAME}`,
}) => {
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${title}</title>
      <style>
          :root {
              --primary: #FBAA1D;
              --secondary: #0090E7;
              --dark1: #282727;
              --light: #E0E0E0;
              --pure: #ffffff;
              --card: #1f1f1f;
              --border: #3a3a3a;
          }

          body {
              font-family: Arial, sans-serif;
              background-color: var(--dark1);
              color: var(--pure);
              margin: 0;
              padding: 24px;
          }

          .wrapper {
              width: 100%;
              padding: 20px 0;
          }

          .container {
              max-width: 650px;
              margin: 0 auto;
              background-color: var(--card);
              border: 1px solid var(--border);
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
          }

          .header {
              background-color: var(--primary);
              color: var(--pure);
              padding: 18px 24px;
              text-align: center;
          }

          .header h1 {
              margin: 0;
              font-size: 24px;
          }

          .content {
              padding: 24px;
              color: var(--light);
              line-height: 1.7;
              font-size: 15px;
              white-space: pre-line;
          }

          .footer {
              border-top: 1px solid var(--border);
              padding: 16px 24px;
              font-size: 13px;
              color: var(--light);
              text-align: center;
              background-color: #181818;
          }
      </style>
  </head>
  <body>
      <div class="wrapper">
          <div class="container">
              <div class="header">
                  <h1>${heading}</h1>
              </div>
              <div class="content">
                  ${content}
              </div>
              <div class="footer">
                  ${footerText}
              </div>
          </div>
      </div>
  </body>
  </html>`;
};

const sendEmail = async ({
  to,
  subject,
  html = "",
  text = "",
  from = process.env.EMAIL_USER,
}) => {
  if (!to) {
    throw new Error("Recipient email is required");
  }

  if (!subject) {
    throw new Error("Email subject is required");
  }

  const transporter = createTransporter();

  const finalHtml =
    html && html.trim()
      ? html
      : buildDefaultHtmlTemplate({
          title: subject,
          heading: APP_NAME,
          content: text || "",
        });

  const mailOptions = {
    from,
    to,
    subject,
    html: finalHtml,
    text: text || "",
  };

  return await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;