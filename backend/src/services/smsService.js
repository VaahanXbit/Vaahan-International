// backend/src/services/smsService.js
/*
================================================================================
File Name : smsService.js
Author : Tahseen Raza
Created Date : 2026-06-22
Description : SMS service for sending OTP via Twilio (or other providers)
Company : Vaahan International
Copyright : (c) 2026 Vaahan International. All rights reserved.
================================================================================
*/

// Note: This is a placeholder. Uncomment when you have SMS provider configured.

const sendSMSOTP = async (phoneNumber, otp, purpose = 'verify') => {
  try {
    console.log(`📱 Would send SMS to ${phoneNumber} with OTP: ${otp}`);
    console.log(`📱 Purpose: ${purpose}`);
    
    // For development, just log the OTP
    console.log(`📱 [DEV] SMS OTP for ${phoneNumber}: ${otp}`);
    
    // TODO: Integrate with Twilio, TextLocal, or other SMS provider
    // Example with Twilio (uncomment when ready):
    /*
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    
    await client.messages.create({
      body: `Your OTP for Vaahan International is: ${otp}. Valid for 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });
    */
    
    // For now, return success (simulated)
    return { 
      success: true, 
      messageId: 'simulated-' + Date.now(),
      status: 'simulated'
    };
    
  } catch (error) {
    console.error('❌ SMS sending failed:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendSMSOTP };