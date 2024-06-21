import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "chjkien9x@gmail.com",
    pass: "zumwehmtzismwuyb",
  },
});

export async function sendmailregister(email, otp) {
  try {
    // send mail with defined transport object
    const info = await transporter.sendMail({
      from: "chjkien9x@gmail.com (Mạng xã hội)", // sender address
      to: email, // list of receivers
      subject: "OTP Register", // Subject line
      text: "Mã OTP của bạn là: " + otp, // plain text body
      html: "<b>" + "Mã OTP của bạn là: " + otp + "</b>", // html body
    });
    console.log("Message sent: %s", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error; // Rethrow the error to be caught by the caller
  }
}

export const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
