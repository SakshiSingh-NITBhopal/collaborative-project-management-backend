import mailgen from "mailgen"

// we will create a function to generate an email and export that
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

//we will generate email for the forgot password also
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
                }
            },
            outro: "Need help, or have questions? Just reply to this email, we\'d love to help."
        }
    }
}

export {emailVerificationContentGeneration, forgotPasswordEmailGeneration}