// import emailjs from '@emailjs/browser';
import axios from 'axios';

// EmailJS configuration
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TICKET_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

// Arkesel SMS configuration
const ARKESEL_API_KEY = import.meta.env.VITE_ARKESEL_API_KEY;

// Send email using EmailJS
export const sendTicketEmail = async (recipientEmail, ticketData) => {
  try {
    const templateParams = {
      to_name: ticketData.attendee.name,
      to_email: recipientEmail,
      to_phone: ticketData.attendee.phone,
      event_name: ticketData.eventTitle,
      ticket_type: ticketData.ticketName,
      ticket_price: `GH₵${ticketData.price.toFixed(2)}`,
      ticket_quantity: ticketData.quantity,
      total_amount: `GH₵${ticketData.total.toFixed(2)}`,
      purchase_date: new Date().toLocaleDateString(),
      qr_code: ticketData.qrCodeImageUrl
    };

    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );

    console.log('Email sent successfully');
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
};

// Send SMS using Arkesel
export const sendTicketSMS = async (phoneNumber, ticketData) => {
  try {
    // Format phone number (ensure it starts with 233 for Ghana)
    let formattedPhone = phoneNumber.trim();
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '233' + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('+233')) {
      formattedPhone = formattedPhone.substring(1);
    }

    const message = `Hi ${ticketData.attendee.name}, your ticket for ${ticketData.eventTitle} has been booked successfully. Ticket: ${ticketData.ticketName} (x${ticketData.quantity}). Total: GH₵${ticketData.total.toFixed(2)}. Your QR code: ${ticketData.qrCodeImageUrl}`;

    const response = await axios.post(
      'https://sms.arkesel.com/api/v2/sms/send',
      {
        sender: "Ballotsky",
        message,
        recipients: [formattedPhone]
      },
      {
        headers: {
          'api-key': ARKESEL_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('SMS sent successfully:', response.data);
    return true;
  } catch (error) {
    console.error('Failed to send SMS:', error);
    throw error;
  }
};