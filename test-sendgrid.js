const sgMail = require('@sendgrid/mail');
require('dotenv').config();

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function testEmail() {
  const msg = {
    to: 'amalskumar20@gmail.com', // Change to your email address
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: 'SendGrid Test - OTP Setup',
    text: 'Your API key is working correctly!',
    html: '<strong>Your API key is working correctly!</strong>'
  };

  try {
    await sgMail.send(msg);
    console.log('✅ Test email sent successfully!');
    console.log('Your SendGrid setup is complete.');
  } catch (error) {
    console.error('❌ Error sending email:', error.response?.body || error.message);
  }
}

testEmail();