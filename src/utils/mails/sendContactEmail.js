const nodemailer = require('nodemailer');
const { APP_NAME } = require('../../constants/app.constants');

const sendContactEmail = async (contactDetails) => {
    const { username, email, message } = contactDetails;

    let transporter = nodemailer.createTransport({
        name: process.env.EMAIL_HOST,
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    const html = `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Contact Form Submission</title>
            <style>
                :root {
                    --primary: #FBAA1D;       /* Bright yellow-orange */
                    --secondary: #0090E7;    /* Bright blue */
                    --dark1: #282727;        /* Dark background */
                    --light: #E0E0E0;        /* Light gray */
                    --pure: #fff;            /* Pure white */
                }

                body {
                    font-family: Arial, sans-serif;
                    background-color: var(--dark1);
                    color: var(--pure);
                    margin: 0;
                    padding: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                }

                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: var(--secondary);
                    border-radius: 8px;
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
                }

                .header {
                    text-align: center;
                    padding: 10px 0;
                    background-color: var(--primary);
                    border-radius: 8px 8px 0 0;
                    color: var(--pure);
                }

                .header h1 {
                    font-size: 24px;
                    margin: 0;
                }

                .content {
                    padding: 20px;
                    color: var(--light);
                }

                .content p {
                    font-size: 16px;
                    line-height: 1.5;
                }

                .footer {
                    text-align: center;
                    padding: 10px 0;
                    font-size: 14px;
                    color: var(--light);
                    border-top: 1px solid var(--light);
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Contact Form Submission</h1>
                </div>
                <div class="content">
                    <p><strong>Username:</strong> ${username}</p>
                    <p><strong>Email:</strong> <a href="mailto:${email}" style="color: var(--primary);">${email}</a></p>
                    <p><strong>Message:</strong></p>
                    <p>${message}</p>
                </div>
                <div class="footer">
                    <p>&copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>`;

    const mailOptions = {
        from: `${process.env.EMAIL_USER}`,
        to: process.env.ADMIN_EMAIL, 
        subject: `${APP_NAME}: New Contact Form Submission`,
        html,
    };

    return await transporter.sendMail(mailOptions);
};

module.exports = sendContactEmail;
