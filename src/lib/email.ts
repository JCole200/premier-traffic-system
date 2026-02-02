import nodemailer from 'nodemailer';
import { BookingRequest } from '../types/inventory';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.example.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function sendBookingEmail(booking: BookingRequest) {
    // If no real credentials are set, we might want to skip or log
    if (!process.env.SMTP_USER || process.env.SMTP_USER.includes('example.com')) {
        console.log('Mock Email Sent:', booking);
        return;
    }

    const {
        clientName,
        campaignName,
        bookerName,
        contractNumber,
        bookingType,
        startDate,
        endDate,
        additionalDetails
    } = booking;

    // Use specific targeting details if available
    let detailsHtml = '';
    if (additionalDetails) {
        // Since we might have parsed JSON or it might be an object
        const details = typeof additionalDetails === 'string' ? JSON.parse(additionalDetails) : additionalDetails;

        detailsHtml = `
            <h3>Additional Details</h3>
            <ul>
                ${Object.entries(details).map(([key, value]) => `
                    <li><strong>${key}:</strong> ${Array.isArray(value) ? value.join(', ') : value}</li>
                `).join('')}
            </ul>
        `;
    }

    const html = `
        <div style="font-family: Arial, sans-serif; color: #333;">
            <h1 style="color: #0070f3;">New Booking Request</h1>
            <p><strong>Client / Brand:</strong> ${clientName}</p>
            <p><strong>Campaign:</strong> ${campaignName}</p>
            <p><strong>Booked By:</strong> ${bookerName || 'N/A'}</p>
            <p><strong>Contract Number:</strong> ${contractNumber || 'N/A'}</p>
            <p><strong>Type:</strong> ${bookingType}</p>
            <p><strong>Dates:</strong> ${startDate} to ${endDate}</p>
            
            <hr />
            
            ${detailsHtml}
            
            <p><em>This booking was submitted via the Premier Traffic System.</em></p>
        </div>
    `;

    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || '"Premier Traffic" <noreply@premier.org.uk>',
            to: 'cristina.turlacu@premier.org.uk',
            subject: `New Booking: ${clientName} - ${bookingType}`,
            html,
        });

        console.log('Message sent: %s', info.messageId);
    } catch (error) {
        console.error('Error sending email:', error);
    }
}
