const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const config = require("./config");

if (!admin.apps.length) {
  admin.initializeApp();
}

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: config.smtpContactForm.host,
  port: config.smtpContactForm.port,
  secure: config.smtpContactForm.secure,
  auth: {
    user: config.smtpContactForm.auth.user,
    pass: config.smtpContactForm.auth.pass,
  },
});

exports.sendAdminPasswordResetEmail = functions.https.onCall(async (data, context) => {
  // Safe destructure
  const email = data?.email;
  console.log("Received data:", data);
  console.log("Email:", email);

  if (!email) {
    throw new functions.https.HttpsError("invalid-argument", "Email is required.");
  }

  const logsRef = admin.firestore().collection("resetLogs");
  const logEntry = {
    email,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    ip: context.rawRequest?.ip || "unknown",
    status: "pending",
    error: null,
  };

  try {
    // Verify admin email
    const usersRef = admin.firestore().collection("users");
    const snapshot = await usersRef.where("email", "==", email).where("admin", "==", 1).get();

    if (snapshot.empty) {
      logEntry.status = "failed";
      logEntry.error = "No admin found with this email";
      await logsRef.add(logEntry);
      throw new functions.https.HttpsError("permission-denied", "No admin account found with this email.");
    }

    // Generate password reset link
    const resetLink = await admin.auth().generatePasswordResetLink(email, {
      url: "http://10.0.0.208:5173/", // replace with your app login page
      handleCodeInApp: false,
    });

    // Send email
    const mailOptions = {
      from: `"Ujaas Aroma Admin Portal" <${functions.config().gmail.email}>`,
      to: email,
      subject: "Reset Your Ujaas Aroma Admin Password",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border-radius: 8px; border: 1px solid #eee; max-width: 600px; margin: auto;">
          <h2>Password Reset Request</h2>
          <p>Hello Admin,</p>
          <p>Click below to reset your password:</p>
          <a href="${resetLink}" style="background-color:#4CAF50;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;">Reset Password</a>
          <p>If you didn't request this, ignore this email.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    logEntry.status = "success";
    await logsRef.add(logEntry);

    console.log(`✅ Password reset email sent to ${email}`);
    return { success: true };
  } catch (err) {
    console.error("❌ Error sending password reset email:", err);
    logEntry.status = "error";
    logEntry.error = err.message || "Failed to send email";
    await logsRef.add(logEntry);

    throw new functions.https.HttpsError("internal", err.message || "Failed to send email.");
  }
});
