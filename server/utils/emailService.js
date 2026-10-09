// utils/emailService.js
// Sends emails to users.
// DEVELOPMENT: emails are SIMULATED by printing them in the backend terminal,
// so no email account is needed. To send real emails later, only this file
// needs to change (for example, using the "nodemailer" package).

const sendPasswordResetEmail = async (user, resetLink, minutesValid) => {
  console.log("\n================ PASSWORD RESET EMAIL (simulated) ================");
  console.log(`To:      ${user.email}`);
  console.log("Subject: Reset your password");
  console.log("");
  console.log(`Hello ${user.fullName},`);
  console.log(`Open this link to set a new password (valid for ${minutesValid} minutes):`);
  console.log(resetLink);
  console.log("If you did not request this, you can ignore this email.");
  console.log("==================================================================\n");
};

module.exports = { sendPasswordResetEmail };
