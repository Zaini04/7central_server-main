const nodemailer = require('nodemailer');
const { APP_NAME } = require('../../constants/app.constants');


const sendWelcomeEmail = async (user) => {

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
            <title>Welcome to ${APP_NAME}</title>
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
                    background-color: var(--dark1) !important;
                    color: var(--pure) !important;
                    margin: 0;
                    padding: 24px;
                    min-height: 100vh;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: var(--secondary) !important;
                    border-radius: 8px;
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
                    margin-top: 2rem;
                }

                .header {
                    text-align: center;
                    padding: 10px 0;
                    background-color: var(--primary) !important;
                    border-radius: 8px 8px 0 0;
                    color: var(--pure) !important;
                }

                .header h1 {
                    color: var(--pure);
                    font-size: 24px;
                    margin: 0;
                }

                .content {
                    padding: 20px;
                    color: var(--light) !important;
                }

                .content p {
                    font-size: 16px;
                    line-height: 1.5;
                    color: var(--light) !important;
                }

                .cta {
                    display: block;
                    text-align: center;
                    font-size: 16px;
                    margin: 20px 0;
                    padding: 10px 20px;
                    background-color: var(--primary);
                    color: var(--pure);
                    text-decoration: none;
                    border-radius: 8px;
                    font-weight: bold;
                }

                .footer {
                    text-align: center;
                    padding: 10px 0;
                    font-size: 14px;
                    color: var(--light);
                    border-top: 1px solid var(--light);
                }

                .footer a {
                    color: var(--primary);
                    text-decoration: none;
                }
            </style>
        </head>

        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome to ${APP_NAME}!</h1>
                </div>
                <div class="content">
                    <p>Merhaba ${user?.username},</p>
                    <p>Dinlemenin keyfini doyasıya yaşayacağınız en iyi adres Boindo'ya hoş geldiniz!</p>

                </div>
            </div>
        </body>
        </html>`;


    const mailOptions = {
        from: `${process.env.EMAIL_USER}`,
        to: user?.email,
        subject: `${APP_NAME}: Welcome To Boindo`,
        html
    };

    return await transporter.sendMail(mailOptions);
}

module.exports = sendWelcomeEmail;
