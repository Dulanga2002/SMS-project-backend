const nodemailer = require("nodemailer");

// Create a transporter using environment variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const sendAppointmentDeletionEmail = async (appointment, customerEmail, staffEmail) => {
  const { customer, staff, services, appointmentDate, appointmentTime, totalCost } = appointment;
  const formattedDate = new Date(appointmentDate).toLocaleDateString();

  const servicesHtml = services
    .map(s => `<li><strong>${s.serviceName}</strong> - LKR ${s.serviceCost}</li>`)
    .join("");

  // Customer Email HTML
  const customerSubject = `Appointment Cancelled - Aura Salon`;
  const customerHtml = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff;">
      <div style="text-align: center; border-bottom: 2px solid #8b5cf6; padding-bottom: 20px;">
        <h1 style="color: #8b5cf6; margin: 0; font-size: 28px;">Aura Salon</h1>
        <p style="color: #6b7280; font-size: 14px; margin: 5px 0 0 0;">Appointment Cancellation Notice</p>
      </div>
      <div style="padding: 20px 0;">
        <p style="font-size: 16px; color: #374151; line-height: 1.6;">Dear <strong>${customer.customerName}</strong>,</p>
        <p style="font-size: 16px; color: #374151; line-height: 1.6;">We regret to inform you that your scheduled appointment at Aura Salon has been cancelled/deleted by the administrator.</p>
        
        <div style="background-color: #f9fafb; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <h3 style="color: #111827; margin-top: 0; margin-bottom: 10px; font-size: 16px;">Appointment Details</h3>
          <p style="margin: 5px 0; font-size: 14px; color: #4b5563;"><strong>Date:</strong> ${formattedDate}</p>
          <p style="margin: 5px 0; font-size: 14px; color: #4b5563;"><strong>Time:</strong> ${appointmentTime}</p>
          <p style="margin: 5px 0; font-size: 14px; color: #4b5563;"><strong>Staff Member:</strong> ${staff.staffName}</p>
          <p style="margin: 5px 0; font-size: 14px; color: #4b5563;"><strong>Total Cost:</strong> LKR ${totalCost}</p>
        </div>

        <div style="margin: 20px 0;">
          <h4 style="color: #374151; margin-bottom: 5px;">Services Booked:</h4>
          <ul style="color: #4b5563; font-size: 14px; padding-left: 20px; line-height: 1.5;">
            ${servicesHtml}
          </ul>
        </div>

        <p style="font-size: 14px; color: #6b7280; line-height: 1.6; margin-top: 30px;">
          If you have any questions or would like to reschedule, please contact us or visit our booking page.
        </p>
      </div>
      <div style="text-align: center; border-top: 1px solid #e5e7eb; padding-top: 20px; color: #9ca3af; font-size: 12px;">
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} Aura Salon. All rights reserved.</p>
      </div>
    </div>
  `;

  // Staff Email HTML
  const staffSubject = `Appointment Cancelled - Action Required`;
  const staffHtml = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff;">
      <div style="text-align: center; border-bottom: 2px solid #8b5cf6; padding-bottom: 20px;">
        <h1 style="color: #8b5cf6; margin: 0; font-size: 28px;">Aura Salon</h1>
        <p style="color: #6b7280; font-size: 14px; margin: 5px 0 0 0;">Staff Schedule Update</p>
      </div>
      <div style="padding: 20px 0;">
        <p style="font-size: 16px; color: #374151; line-height: 1.6;">Hello <strong>${staff.staffName}</strong>,</p>
        <p style="font-size: 16px; color: #374151; line-height: 1.6;">Please be notified that the following appointment assigned to you has been cancelled/deleted by the administrator.</p>
        
        <div style="background-color: #f9fafb; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <h3 style="color: #111827; margin-top: 0; margin-bottom: 10px; font-size: 16px;">Cancelled Appointment Details</h3>
          <p style="margin: 5px 0; font-size: 14px; color: #4b5563;"><strong>Customer:</strong> ${customer.customerName}</p>
          <p style="margin: 5px 0; font-size: 14px; color: #4b5563;"><strong>Date:</strong> ${formattedDate}</p>
          <p style="margin: 5px 0; font-size: 14px; color: #4b5563;"><strong>Time:</strong> ${appointmentTime}</p>
        </div>

        <div style="margin: 20px 0;">
          <h4 style="color: #374151; margin-bottom: 5px;">Services:</h4>
          <ul style="color: #4b5563; font-size: 14px; padding-left: 20px; line-height: 1.5;">
            ${servicesHtml}
          </ul>
        </div>

        <p style="font-size: 14px; color: #6b7280; line-height: 1.6; margin-top: 30px;">
          Your schedule has been updated automatically, and this slot is now marked as available.
        </p>
      </div>
      <div style="text-align: center; border-top: 1px solid #e5e7eb; padding-top: 20px; color: #9ca3af; font-size: 12px;">
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} Aura Salon. All rights reserved.</p>
      </div>
    </div>
  `;

  const mailPromises = [];

  if (customerEmail) {
    mailPromises.push(
      transporter.sendMail({
        from: process.env.SMTP_USER,
        to: customerEmail,
        subject: customerSubject,
        html: customerHtml,
      })
    );
  }

  if (staffEmail) {
    mailPromises.push(
      transporter.sendMail({
        from: process.env.SMTP_USER,
        to: staffEmail,
        subject: staffSubject,
        html: staffHtml,
      })
    );
  }

  // Execute sending in parallel
  await Promise.all(mailPromises);
};

module.exports = {
  sendAppointmentDeletionEmail,
};
