import type { APIRoute } from 'astro';

// Disable prerendering for API endpoint - required for Cloudflare Pages Functions
export const prerender = false;

/**
 * Contact Form Submission API
 * 
 * Workflow:
 * 1. Receive FormData from contact form
 * 2. Validate required fields
 * 3. Store submission in D1 database
 * 4. Send notification email via Resend
 * 5. Return success/error response
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Parse FormData from request
    const formData = await request.formData();
    
    const firstName = formData.get('firstName')?.toString() || '';
    const lastName = formData.get('lastName')?.toString() || '';
    const email = formData.get('email')?.toString() || '';
    const company = formData.get('company')?.toString() || '';
    const phone = formData.get('phone')?.toString() || '';
    const subject = formData.get('subject')?.toString() || '';
    const message = formData.get('message')?.toString() || '';

    // Step 2: Validate required fields
    if (!firstName || !lastName || !email || !subject || !message) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields' 
        }), 
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid email format' 
        }), 
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Step 3: Store in D1 Database
    // D1 binding is available via locals.runtime.env.DB
    const db = locals.runtime?.env?.DB;
    
    if (db) {
      // Create table if not exists (should be done in migration, but included for reference)
      // await db.exec(`
      //   CREATE TABLE IF NOT EXISTS inquiries (
      //     id INTEGER PRIMARY KEY AUTOINCREMENT,
      //     first_name TEXT NOT NULL,
      //     last_name TEXT NOT NULL,
      //     email TEXT NOT NULL,
      //     company TEXT,
      //     phone TEXT,
      //     subject TEXT NOT NULL,
      //     message TEXT NOT NULL,
      //     status TEXT DEFAULT 'new',
      //     created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      //   )
      // `);

      // Insert inquiry record
      await db.prepare(`
        INSERT INTO inquiries (first_name, last_name, email, company, phone, subject, message)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(firstName, lastName, email, company, phone, subject, message).run();
    }

    // Step 4: Send email notification via Resend
    const resendApiKey = locals.runtime?.env?.RESEND_API_KEY;
    
    if (resendApiKey) {
      const emailPayload = {
        from: 'YourBrand <noreply@yourbrand.com>',
        to: ['sales@yourbrand.com'],
        subject: `New Inquiry: ${subject}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${firstName} ${lastName}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Company:</strong> ${company || 'N/A'}</p>
          <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
        `,
        reply_to: email,
      };

      // Send email via Resend API
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload),
      });

      if (!resendResponse.ok) {
        console.error('Failed to send email:', await resendResponse.text());
        // Continue execution - don't fail the submission if email fails
      }
    }

    // Step 5: Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Thank you for your inquiry. We will contact you within 24 hours.' 
      }), 
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Form submission error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'An error occurred while processing your request. Please try again later.' 
      }), 
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
};

// Handle OPTIONS for CORS preflight
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
