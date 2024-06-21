// Import express and other required modules
import express from "express";
import { MailService } from "../../../services/index.js";
import { Otp, User } from "../../../schemas/index.js";

// Create an instance of Express router
const router = express.Router({ mergeParams: true });

// Verify OTP endpoint
router.post("/v1/verify-otp", async (req, res, next) => {
  const { email, otp } = req.body;

  try {
    // Find OTP record in the database
    const otpRecord = await Otp.findOne({ email, otp });

    if (!otpRecord) {
      // If OTP record not found, send error response
      return res.status(400).send({ message: "Invalid OTP" });
    }

    // Check if OTP is expired (5 minutes threshold)
    const now = new Date();
    const otpCreatedAt = new Date(otpRecord.createdAt);
    const timeDifferenceInMinutes = (now - otpCreatedAt) / (1000 * 60);

    if (timeDifferenceInMinutes > 5) {
      // If OTP is expired, send error response and option to resend OTP
      return res
        .status(400)
        .send({ message: "OTP has expired", resendOption: true });
    }

    // Update user's isEmailValidated attribute
    await User.findOneAndUpdate({ email }, { isEmailValidated: true });

    // Send success response
    res.status(200).send({ message: "OTP verified successfully" });
  } catch (error) {
    next(error);
  }
});

// Resend OTP endpoint
router.post("/v1/send-otp", async (req, res, next) => {
  const { email } = req.body;

  try {
    // Generate new OTP
    const otp = MailService.generateOtp();

    // Update or create OTP record in the database
    let otpRecord = await Otp.findOne({ email });
    if (!otpRecord) {
      otpRecord = new Otp({ email, otp });
    } else {
      otpRecord.otp = otp;
      otpRecord.createdAt = new Date();
    }
    await otpRecord.save();

    // Send email with new OTP
    await MailService.sendmailregister(email, otp);

    // Send success response
    res
      .status(200)
      .send({ message: "New OTP generated and sent successfully" });
  } catch (error) {
    next(error);
  }
});

// Export the router
export default router;
