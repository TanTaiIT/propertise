import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()
export const sendEmail = async (to, subject, html) => {
    const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
  };
  console.log('mailoption', mailOptions)

  await transporter.sendMail(mailOptions);
}

