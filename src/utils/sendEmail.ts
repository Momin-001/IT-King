import nodemailer from "nodemailer";

interface EmailOptions {
  email: string;
  subject: string;
  message?: string;
  html?: string;
}

export const sendEmail = async (options: EmailOptions) => {
  // Creating a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT || "587"),
    // secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // tls: { rejectUnauthorized: process.env.local === "local" ? false : true },
    connectionTimeout: 30000,
  });

  console.log({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    user: process.env.EMAIL_USER,
    secure: true,
  });

  // Define email options
  const mailOptions = {
    from: `"GulzarSoft" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html, // Optional HTML version
  };

  console.log("Mail Options: ", process.env.ENV);

  // Send the email
  await transporter.sendMail(mailOptions);
};
