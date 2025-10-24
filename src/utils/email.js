import mailgen from "mailgen"
import nodemailer from "nodemailer"

// we will create a function to generate an email for email verification
const emailVerificationContentGeneration = (username, verificationUrl) => {
    return {
        body: {
            name: username,
            intro: "Welcome to our App! we're excited to have you on board.",
            action: {
                instructions: "To verify you email please click on the button below",
                button: {
                    color: "#22BC66",
                    text: "Verify your email",
                    link: verificationUrl
                }
            },
            outro: "Need help, or have questions? Just reply to this email, we\'d love to help."
        }
    }
}

//we will create a function for generate email for the forgot password also
const forgotPasswordEmailGeneration = (username, passwordUrl) => {
    return {
        body: {
            name: username,
            intro: "We got a request to password reset.",
            action: {
                instructions: "To reset your password please click on the button below",
                button: {
                    color: "#22BC66",
                    text: "Reset password ->",
                    link: passwordUrl
                },
            outro: "Need help, or have questions? Just reply to this email, we\'d love to help."
        }
    }
}
}

//function to send email and it is always asyn, whoever calls this pass an options which include "to", "subject" and "body"
const sendEmail = async (options) => {
    // Configure mailgen by setting a theme and your product info
    const mailGenerator = new mailgen({
        theme: 'default',
        product: {
            // Appears in header & footer of e-mails
            name: 'Task manager',
            link: 'https://taskmanager.com'
        }
    });
    // Generate an HTML email with the provided contents
    const emaiHtml = mailGenerator.generate(options.mailgenContent);

    // Generate the plaintext version of the e-mail (for clients that do not support HTML)
    const emailText = mailGenerator.generatePlaintext(options.mailgenContent);

    //function to send email using nodemailer
    //step 1 - create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.MAILTRAP_SMTP_HOST,
      port: MAILTRAP_SMTP_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: MAILTRAP_SMTP_USER,
        pass: MAILTRAP_SMTP_PASSWORD,
      },
    });

    const mail = {
    from: "mail.taskmanager@example.com",
    to: options.to,
    subject: options.subject,
    text: emailText, // plain‑text body
    html: emaiHtml, // HTML body
  }

    //step 2 - compose an email and send it
    try {
        await transporter.sendMail(mail);
    } catch (error) {
        console.error("Email service failed silently!. Make sure that you have provided the mailtrap credentials in the .env file");
        console.error("Error :", error);
    }
}

export {emailVerificationContentGeneration, forgotPasswordEmailGeneration, sendEmail}