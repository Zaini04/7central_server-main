const nodemailer = require('nodemailer');
const { APP_NAME } = require('../../constants/app.constants');


const sendVerificationEmail = async (otp, user) => {

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
    <title>${APP_NAME}</title>
    <style>
        :root {
            --primary: #FBAA1D;        /* Bright orange-yellow */
            --secondary: #0090E7;     /* Bright blue */
            --dark1: #282727;         /* Dark gray/black background */
            --light: #E0E0E0;         /* Light gray */
            --pure: #fff;             /* Pure white */
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

        .otp {
            display: block;
            text-align: center;
            font-size: 24px;
            color: var(--primary);
            margin: 20px 0;
            padding: 10px 0;
            background-color: var(--dark1);
            border: 2px dashed var(--light);
            border-radius: 8px;
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
            <h1>E-posta Doğrulama</h1>
        </div>
        <div class="content">
            <p>Sevgili, ${user?.username}</p>
            <p>E-posta adresinizi doğrulamak için bir talep aldık. Doğrulama işleminizi tamamlamak için aşağıdaki OTP'yi kullanın:</p>
            <span class="otp">
                ${otp}
            </span>
            <p>Eğer bu isteği siz yapmadıysanız, lütfen bu e-postayı yok sayın veya herhangi bir endişeniz varsa destek ile iletişime geçin.</p>
            <p>Teşekkür ederiz!</p>
        </div>
        <div class="footer">
            <p>Yardıma mı ihtiyacınız var? <a href="mailto:${process.env.EMAIL_USER}">Destek ile iletişime geçin</a></p>
            <p>&copy; ${new Date().getFullYear()} ${APP_NAME}. Tüm hakları saklıdır.</p>
        </div>
    </div>
</body>
</html>`;

    const mailOptions = {
        from: `${process.env.EMAIL_USER}`,
        to: user?.email,
        subject: `${APP_NAME}: Confirm Your Email Address`,
        html
    };

    return await transporter.sendMail(mailOptions);
}

module.exports = sendVerificationEmail;
