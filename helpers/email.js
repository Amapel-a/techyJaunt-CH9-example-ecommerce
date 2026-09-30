const nodemailer = require("nodemailer");
const ejs = require("ejs");
const path = require("path");

const sendEmail = async (email, subject, templateName, templateData = {}) => {
  const html = await ejs.renderFile(
    path.join(__dirname, "../templates", `${templateName}.ejs`),
    {
      ...templateData,
      appName: process.env.APP_NAME || "TechyJaunt",
      subject,
    },
  );
  const port = Number(process.env.EMAIL_PORT || 587);
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject,
    text: templateData.text || subject,
    html,
  };
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
