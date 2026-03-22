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
    const company = formData.get('company')?.toString() || '';
    const email = formData.get('email')?.toString() || '';
    const phone = formData.get('phone')?.toString() || '';
    const industry = formData.get('industry')?.toString() || '';
    const targetMarket = formData.get('targetMarket')?.toString() || '';
    const currentWebsite = formData.get('currentWebsite')?.toString() || '';
    const message = formData.get('message')?.toString() || '';

    // Step 2: Validate required fields
    if (!firstName || !company || !email || !phone || !industry) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: '请填写所有必填字段' 
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
          error: '邮箱格式不正确' 
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
      // Insert inquiry record
      await db.prepare(`
        INSERT INTO inquiries 
        (first_name, company, email, phone, industry, target_market, current_website, message, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new', datetime('now'))
      `).bind(firstName, company, email, phone, industry, targetMarket, currentWebsite, message).run();
    }

    // Step 4: Send email notification via Resend
    const resendApiKey = locals.runtime?.env?.RESEND_API_KEY;
    const contactEmail = locals.runtime?.env?.PUBLIC_CONTACT_EMAIL || 'hello@xunpanyun.com';
    
    if (resendApiKey) {
      const emailPayload = {
        from: '询盘云 <no-reply@376543.xyz>',
        to: ['shepherd.shen@gmail.com'],
        subject: `新询盘: ${company} - ${industry}`,
        html: `
          <h2>新询盘提交</h2>
          <p><strong>联系人:</strong> ${firstName}</p>
          <p><strong>公司:</strong> ${company}</p>
          <p><strong>邮箱:</strong> ${email}</p>
          <p><strong>电话:</strong> ${phone}</p>
          <p><strong>行业:</strong> ${industry}</p>
          <p><strong>目标市场:</strong> ${targetMarket || '未填写'}</p>
          <p><strong>现有网站:</strong> ${currentWebsite || '未填写'}</p>
          <p><strong>需求描述:</strong></p>
          <p>${message ? message.replace(/\n/g, '<br>') : '未填写'}</p>
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
        message: '提交成功！我们将在24小时内与您联系。' 
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
        error: '提交失败，请稍后重试或通过电话联系我们。' 
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
