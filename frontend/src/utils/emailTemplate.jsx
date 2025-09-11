export const verificationEmailTemplate = (userName, verificationCode) => {
    const primaryColor = '#7C3AED'; // Your primary color
    const logoUrl = 'https://ballotsky.vercel.app/logo.png';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Verify Your Ballotsky Account</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f9fafb;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
          }
          .header {
            text-align: center;
            padding: 20px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .logo {
            height: 40px;
            margin-bottom: 20px;
          }
          .content {
            padding: 30px 20px;
          }
          .verification-code {
            background-color: #f3f4f6;
            border-radius: 6px;
            padding: 15px;
            text-align: center;
            margin: 25px 0;
            font-size: 24px;
            font-weight: bold;
            letter-spacing: 2px;
            color: ${primaryColor};
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: ${primaryColor};
            color: white !important;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="${logoUrl}" alt="Ballotsky" class="logo">
            <h1 style="margin: 0; color: ${primaryColor};">Verify Your Email</h1>
          </div>
          
          <div class="content">
            <p>Hello ${userName},</p>
            <p>Thank you for registering with Ballotsky! To complete your registration and start using our platform, please verify your email address.</p>
            
            <div class="verification-code">
              ${verificationCode}
            </div>
            
            <p>This verification code will expire in 24 hours. If you didn't request this, please ignore this email.</p>
            
            <p style="margin-top: 30px;">Best regards,<br>The Ballotsky Team</p>
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} Ballotsky. All rights reserved.</p>
            <p>
              <a href="https://ballotsky.com" style="color: ${primaryColor}; text-decoration: none;">Website</a> | 
              <a href="https://ballotsky.com/privacy" style="color: ${primaryColor}; text-decoration: none;">Privacy Policy</a> | 
              <a href="https://ballotsky.com/contact" style="color: ${primaryColor}; text-decoration: none;">Contact Us</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  };