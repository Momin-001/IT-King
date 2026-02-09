export const verificationTemplate = (
  userName: string,
  verificationUrl: string,
) => `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; background-color: #ffffff;">
    <div style="background-color: #87CEEB; padding: 40px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px; letter-spacing: -0.5px;">Welcome to GulzarSoft!</h1>
    </div>
    
    <div style="padding: 40px; color: #475569;">
        <h2 style="color: #1e293b; margin-top: 0;">Verify your email address</h2>
        <p>Hello <strong>${userName}</strong>,</p>
        <p>Thank you for joining the GulzarSoft. To get started, please verify your email address by clicking the button below:</p>
        
        <div style="text-align: center; margin: 35px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #87CEEB; color: white; padding: 16px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px -1px rgba(135, 206, 235, 0.4);">
               Verify My Account
            </a>
        </div>

        <p style="font-size: 14px; color: #94a3b8;">
            If the button doesn't work, copy and paste this link into your browser: <br/>
            <a href="${verificationUrl}" style="color: #87CEEB; word-break: break-all;">${verificationUrl}</a>
        </p>

        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 30px 0;" />
        
        <p style="font-size: 13px; line-height: 1.5;">
            <strong>Why did I receive this?</strong><br/>
            This email was sent because an account was created on our platform with this address. If you didn't sign up, you can safely ignore this email.
        </p>
        <p>This link will expire in 24 Hours </p>
    </div>
</div>
`;
