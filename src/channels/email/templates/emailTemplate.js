const { appUrl, applicaionName } = require('../config/setting');
const env = require('../config/env');
const buildEmailHTML = (opts = {}) => {
  // Support ctaButton as an alias for primaryCTA (backwards compat — many templates use ctaButton)
  if (opts.ctaButton && !opts.primaryCTA) opts = { ...opts, primaryCTA: opts.ctaButton };

  // -------------------------
  // Defaults & helpers
  // -------------------------
  const {
    preheader = '',
    title = 'Notification',
    applicationName = opts.applicationName || opts.applicaionName || applicaionName, // support earlier typo; falls back to module-level env value
    baseUrl = opts.baseUrl || opts.appUrl || opts.frontendUrl || appUrl, // falls back to module-level env value
    logo = null, // { url, alt, width, height, href, align: 'center'|'left' }
    headerBg = '#2563eb',
    headerText = '',
    bodyHTML = '', // main html content (string)
    alert = null, // { type: 'info'|'success'|'warn'|'error', text }
    primaryCTA = null, // { url, text, color }
    secondaryCTA = null, // { url, text }
    cards = [], // [{ title, text, image, url }]
    twoColumn = null, // { leftHTML, rightHTML } OR array of blocks
    invoice = null, // { number, date, dueDate, items: [{desc, qty, price}], subtotal, tax, total, link }
    security = null, // { device, os, browser, ip, location, when }
    review = null, // { promptText, ratingUrl }
    footerNote = '',
    links = {}, // { support, privacy, terms, unsubscribe, notifications }
    lang = 'en', // used for 'Manage notifications' label translations
    social = {}, // { linkedin, twitter, github, instagram, facebook } URLs
    showSocial = true,
    showDivider = true,
    includeAccessibilityAttributes = true,
    theme = {
      // theme palette
      bg: '#eef1f5',
      cardBg: '#ffffff',
      text: '#111827',
      muted: '#6b7280',
      border: '#e5e7eb',
      radius: 10
    }
  } = opts;

  const year = new Date().getFullYear();

  const {
    support = `${baseUrl}/support`,
    privacy = `${baseUrl}/privacy`,
    terms = `${baseUrl}/terms`,
    unsubscribe = `${baseUrl}/unsubscribe`,
    notifications = `${baseUrl}/notifications`
  } = links;

  // small escape helper
  const esc = s => (s == null ? '' : String(s));

  // Social icon SVGs (inline, small)
  const svg = {
    linkedin: `<svg width="20" height="20" viewBox="0 0 24 24" role="img" aria-hidden="true" focusable="false"><path fill="currentColor" d="M4.98 3.5C4.98 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM.5 8h4v12h-4zM9.5 8h3.84v1.64h.05c.54-1.02 1.86-2.08 3.83-2.08 4.1 0 4.86 2.7 4.86 6.21V20H18.2v-5.2c0-1.24-.02-2.83-1.73-2.83-1.73 0-1.99 1.35-1.99 2.75V20H9.5z"/></svg>`,
    twitter: `<svg width="20" height="20" viewBox="0 0 24 24" role="img" aria-hidden="true" focusable="false"><path fill="currentColor" d="M22.46 6c-.77.35-1.6.58-2.46.69.89-.53 1.57-1.38 1.89-2.4-.83.5-1.75.86-2.72 1.06C18.4 4.6 17.17 4 15.82 4c-2.45 0-4.43 1.98-4.43 4.43 0 .35.04.7.11 1.03C7.69 9.26 4.07 7.38 1.64 4.5c-.38.66-.6 1.42-.6 2.24 0 1.55.79 2.92 1.99 3.72-.73-.02-1.42-.22-2.02-.56v.06c0 2.17 1.54 3.98 3.58 4.39-.37.1-.77.15-1.18.15-.29 0-.57-.03-.84-.08.57 1.78 2.22 3.08 4.18 3.12-1.53 1.2-3.46 1.92-5.56 1.92-.36 0-.71-.02-1.06-.06 1.98 1.27 4.34 2.01 6.87 2.01 8.24 0 12.76-6.83 12.76-12.76 0-.19 0-.39-.01-.58.88-.63 1.64-1.41 2.25-2.3-.8.35-1.66.58-2.55.69z"/></svg>`,
    github: `<svg width="20" height="20" viewBox="0 0 24 24" role="img" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 .5C5.73.5.75 5.48.75 11.75c0 4.96 3.22 9.16 7.69 10.64.56.1.77-.24.77-.54 0-.27-.01-1.15-.01-2.09-3.13.68-3.79-1.51-3.79-1.51-.51-1.3-1.24-1.65-1.24-1.65-1.01-.69.08-.68.08-.68 1.12.08 1.71 1.15 1.71 1.15.99 1.7 2.6 1.21 3.24.92.1-.71.39-1.21.71-1.49-2.5-.29-5.13-1.25-5.13-5.56 0-1.23.44-2.24 1.15-3.04-.12-.29-.5-1.45.11-3.02 0 0 .94-.3 3.08 1.15a10.7 10.7 0 012.8-.38c.95 0 1.9.13 2.8.38 2.14-1.45 3.08-1.15 3.08-1.15.61 1.57.23 2.73.11 3.02.72.8 1.15 1.81 1.15 3.04 0 4.32-2.63 5.27-5.14 5.55.4.34.76 1.01.76 2.04 0 1.47-.01 2.65-.01 3.01 0 .3.21.65.78.54 4.47-1.48 7.69-5.68 7.69-10.64C23.25 5.48 18.27.5 12 .5z"/></svg>`,
    instagram: `<svg width="20" height="20" viewBox="0 0 24 24" role="img" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 2.2c3.2 0 3.584.012 4.85.07 1.17.054 1.8.24 2.22.4.54.2.92.45 1.32.86.4.4.66.8.86 1.32.16.42.35 1.05.4 2.22.06 1.27.07 1.65.07 4.85s-.012 3.584-.07 4.85c-.054 1.17-.24 1.8-.4 2.22-.2.54-.45.92-.86 1.32-.4.4-.8.66-1.32.86-.42.16-1.05.35-2.22.4-1.27.06-1.65.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.054-1.8-.24-2.22-.4-.54-.2-.92-.45-1.32-.86-.4-.4-.66-.8-.86-1.32-.16-.42-.35-1.05-.4-2.22-.06-1.27-.07-1.65-.07-4.85s.012-3.584.07-4.85c.054-1.17.24-1.8.4-2.22.2-.54.45-.92.86-1.32.4-.4.8-.66 1.32-.86.42-.16 1.05-.35 2.22-.4C8.416 2.212 8.8 2.2 12 2.2zm0 3.5A6.3 6.3 0 1018.3 12 6.31 6.31 0 0012 5.7zm0 10.4A4.1 4.1 0 1116.1 12 4.1 4.1 0 0112 16.1zM18.6 6a1.47 1.47 0 11-1.47-1.47A1.47 1.47 0 0118.6 6z"/></svg>`,
    facebook: `<svg width="20" height="20" viewBox="0 0 24 24" role="img" aria-hidden="true" focusable="false"><path fill="currentColor" d="M22 12.07C22 6.48 17.52 2 11.93 2S2 6.48 2 12.07C2 17.02 5.66 21.09 10.44 21.9v-6.4H8.07v-2.9h2.37V9.8c0-2.34 1.39-3.64 3.51-3.64 1.02 0 2.08.18 2.08.18v2.29h-1.17c-1.15 0-1.51.72-1.51 1.46v1.75h2.58l-.41 2.9h-2.17V21.9C18.34 21.09 22 17.02 22 12.07z"/></svg>`
  };

  // color for alert types
  const alertColor = t => {
    switch (t) {
      case 'success':
        return { bg: '#ecfdf5', border: '#bbf7d0', text: '#065f46' };
      case 'warn':
        return { bg: '#fff7ed', border: '#ffedd5', text: '#92400e' };
      case 'error':
        return { bg: '#fff1f2', border: '#fecaca', text: '#9f1239' };
      default:
        return { bg: '#f0f9ff', border: '#bae6fd', text: '#0369a1' };
    }
  };

  // invoice item row builder
  const buildInvoiceRows = items =>
    (items || [])
      .map(
        it => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid ${esc(theme.border)}">${esc(it.desc)}</td>
      <td style="padding:8px 0;border-bottom:1px solid ${esc(theme.border)};text-align:center">${esc(it.qty || 1)}</td>
      <td style="padding:8px 0;border-bottom:1px solid ${esc(theme.border)};text-align:right">${esc(it.price)}</td>
    </tr>
  `
      )
      .join('');

  // two-column builder (responsive stack)
  const renderTwoColumn = tc =>
    tc
      ? `
    <table role="presentation" width="100%" style="margin-top:18px">
      <tr>
        <td style="vertical-align:top;padding:8px 12px;width:50%">${tc.leftHTML || ''}</td>
        <td style="vertical-align:top;padding:8px 12px;width:50%">${tc.rightHTML || ''}</td>
      </tr>
    </table>
  `
      : '';

  // cards builder
  const renderCards = arr =>
    arr && arr.length
      ? `
    <table role="presentation" width="100%" style="margin-top:18px">
      ${arr
        .map(
          card => `
        <tr>
          <td style="padding:12px;border:1px solid ${esc(theme.border)};border-radius:8px;margin-bottom:12px;">
            <div style="display:flex;gap:12px;align-items:center;">
              ${card.image ? `<img src="${card.image}" alt="${esc(card.title)}" style="width:64px;height:64px;border-radius:8px;object-fit:cover" />` : ''}
              <div>
                <div style="font-weight:700;margin-bottom:6px">${esc(card.title)}</div>
                <div style="color:${esc(theme.muted)};font-size:14px;line-height:20px">${card.text || ''}</div>
                ${card.url ? `<div style="margin-top:8px"><a href="${card.url}" style="font-weight:600;color:${esc(headerBg)};text-decoration:none">Learn more →</a></div>` : ''}
              </div>
            </div>
          </td>
        </tr>
      `
        )
        .join('')}
    </table>
  `
      : '';

  // security block
  const renderSecurity = s =>
    s
      ? `
    <table role="presentation" width="100%" style="margin-top:18px;border-radius:8px;background:${esc(theme.cardBg)};border:1px solid ${esc(theme.border)};">
      <tr><td style="padding:12px">
        <div style="font-weight:700;margin-bottom:8px">Security details</div>
        <div style="color:${esc(theme.muted)};font-size:14px;line-height:20px">
          ${s.device ? `Device: ${esc(s.device)}<br/>` : ''}
          ${s.os ? `OS: ${esc(s.os)}<br/>` : ''}
          ${s.browser ? `Browser: ${esc(s.browser)}<br/>` : ''}
          ${s.ip ? `IP: ${esc(s.ip)}<br/>` : ''}
          ${s.location ? `Location: ${esc(s.location)}<br/>` : ''}
          ${s.when ? `Time: ${esc(s.when)}<br/>` : ''}
        </div>
      </td></tr>
    </table>
  `
      : '';

  // review block
  const renderReview = r =>
    r
      ? `
    <table role="presentation" width="100%" style="margin-top:18px;">
      <tr>
        <td style="padding:12px;border-radius:8px;border:1px solid ${esc(theme.border)};background:${esc(theme.cardBg)}">
          <div style="font-weight:700;margin-bottom:8px">${esc(r.promptText || 'Rate your experience')}</div>
          <div style="display:flex;gap:8px;align-items:center;">
            <a href="${esc(r.ratingUrl || '#')}" style="display:inline-block;padding:10px 14px;border-radius:6px;border:1px solid ${esc(theme.border)};text-decoration:none">Give feedback</a>
            <div style="color:${esc(theme.muted)};font-size:13px">or reply to this email</div>
          </div>
        </td>
      </tr>
    </table>
  `
      : '';

  // footer multilingual labels
  const manageLabels = {
    en: 'Manage Notifications',
    fr: 'Gérer les notifications',
    de: 'Benachrichtigungen verwalten',
    hi: 'सूचनाएँ प्रबंधित करें',
    es: 'Administrar notificaciones'
  };
  const manageLabel = manageLabels[lang] || manageLabels.en;

  // alert block
  const renderAlert = a =>
    a
      ? (() => {
          const c = alertColor(a.type || 'info');
          return `
      <table role="presentation" width="100%" style="margin-bottom:18px">
        <tr>
          <td style="background:${c.bg};border:1px solid ${c.border};color:${c.text};padding:12px;border-radius:8px">
            <div style="font-weight:600">${esc(a.text)}</div>
          </td>
        </tr>
      </table>
    `;
        })()
      : '';

  // social icons render
  const renderSocial = s => {
    if (!showSocial) return '';
    const list = [
      { key: 'linkedin', url: s.linkedin },
      { key: 'twitter', url: s.twitter },
      { key: 'github', url: s.github },
      { key: 'instagram', url: s.instagram },
      { key: 'facebook', url: s.facebook }
    ].filter(x => x.url);
    if (!list.length) return '';
    return `
      <div style="margin-top:12px;display:flex;gap:12px;justify-content:center;align-items:center">
        ${list.map(it => `<a href="${it.url}" style="color:${esc(theme.muted)};text-decoration:none" aria-label="${it.key}" title="${it.key}">${svg[it.key]}</a>`).join('')}
      </div>
    `;
  };

  // logo render (supports left/center)
  const renderLogo = l => {
    if (!l || !l.url) return '';
    const align = l.align === 'left' ? 'left' : 'center';
    const href = l.href || baseUrl;
    const width = l.width || 120;
    const height = l.height || 40;
    return `
      <tr>
        <td style="padding:20px 30px;text-align:${align}">
          <a href="${href}" style="display:inline-block;text-decoration:none">
            <img src="${l.url}" alt="${esc(l.alt || applicationName)}" width="${width}" height="${height}" style="display:block;max-width:100%;height:auto" />
          </a>
        </td>
      </tr>
    `;
  };

  // accessibility attributes for links/buttons
  const a11y = includeAccessibilityAttributes ? 'role="link" tabindex="0"' : '';

  // -------------------------
  // MAIN TEMPLATE
  // -------------------------
  return `<!doctype html>
<html lang="${esc(lang)}">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${esc(title)}</title>
  <style>
    /* Basic reset */
    body,table,td,a{ -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    table,td{ mso-table-lspace:0pt; mso-table-rspace:0pt; }
    img{ -ms-interpolation-mode:bicubic; border:0; height:auto; line-height:100%; outline:none; text-decoration:none; }
    body{ margin:0; padding:0; background:${esc(theme.bg)}; color:${esc(theme.text)}; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing:antialiased; }
    .email-wrap{ padding:28px 12px; }
    .card { max-width:720px; margin:0 auto; background:${esc(theme.cardBg)}; border-radius:${esc(theme.radius)}px; border:1px solid ${esc(theme.border)}; overflow:hidden; }
    .header { padding:12px 20px 6px 20px; text-align:left; }
    .hero { padding:32px 40px; background: linear-gradient(135deg, ${esc(headerBg)} 0%, ${esc(headerBg)}dd 100%); color:#fff; text-align:left; }
    .hero h1 { margin:0; font-size:22px; font-weight:700; }
    .content { padding:28px 36px; color:${esc(theme.text)}; font-size:16px; line-height:24px; }
    .cta { margin-top:18px; text-align:left; }
    .btn-primary {
      display:inline-block; padding:12px 22px; border-radius:8px; background:${esc(primaryCTA?.color || headerBg)}; color:#fff; text-decoration:none; font-weight:700; font-size:15px;
    }
    .btn-secondary {
      display:inline-block; padding:10px 18px; border-radius:8px; background:transparent; color:${esc(headerBg)}; text-decoration:none; border:1px solid ${esc(theme.border)}; font-weight:700; font-size:14px; margin-left:10px;
    }
    .muted { color:${esc(theme.muted)}; font-size:13px; }
    .divider { height:1px; background:${esc(theme.border)}; margin:20px 0; border:none; }
    .footer { padding:20px 36px; background:${esc(theme.cardBg)}; color:${esc(theme.muted)}; font-size:13px; text-align:center; border-top:1px solid ${esc(theme.border)}; }
    .footer a { color:${esc(headerBg)}; text-decoration:none; }
    .invoice-table { width:100%; margin-top:12px; border-collapse:collapse; }
    .invoice-table th { text-align:left; padding:8px 0; color:${esc(theme.muted)}; font-weight:600; }
    .invoice-table td { padding:8px 0; }
    /* Dark mode */
    @media (prefers-color-scheme:dark) {
      body { background:#0b1220!important; color:#e6eef8!important; }
      .card { background:#0f1724!important; border-color:#1f2937!important; }
      .content { color:#e6eef8!important; }
      .muted { color:#9aa4b2!important; }
      .footer { background:#0f1724!important; color:#9aa4b2!important; border-top-color:#1f2937!important; }
      .btn-primary { color:#fff!important; }
    }
    /* Responsive */
    @media only screen and (max-width:600px) {
      .hero, .content, .footer { padding-left:20px!important; padding-right:20px!important; }
      .hero h1 { font-size:20px!important; }
    }
  </style>
</head>
<body>
  <div class="email-wrap">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <table role="presentation" class="card" width="100%" cellpadding="0" cellspacing="0">
            ${renderLogo(logo)}
            <tr>
              <td class="hero" style="background:${esc(headerBg)};">
                ${headerText ? `<h1>${esc(headerText)}</h1>` : `<h1>${esc(title)}</h1>`}
              </td>
            </tr>

            <tr>
              <td class="content" style="background:${esc(theme.cardBg)};">
                ${renderAlert(alert)}
                ${bodyHTML}

                ${twoColumn ? renderTwoColumn(twoColumn) : ''}

                ${cards && cards.length ? renderCards(cards) : ''}

                ${
                  invoice
                    ? `
                  <div style="margin-top:18px;">
                    <div style="display:flex;justify-content:space-between;align-items:center">
                      <div style="font-weight:700">Invoice ${esc(invoice.number || '')}</div>
                      <div class="muted">Date: ${esc(invoice.date || '')}</div>
                    </div>

                    <table class="invoice-table" role="presentation" width="100%" style="margin-top:12px;">
                      <thead>
                        <tr><th>Description</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th></tr>
                      </thead>
                      <tbody>
                        ${buildInvoiceRows(invoice.items || [])}
                        <tr><td></td><td style="text-align:right;padding-top:12px">Subtotal</td><td style="text-align:right;padding-top:12px">${esc(invoice.subtotal || '')}</td></tr>
                        <tr><td></td><td style="text-align:right">Tax</td><td style="text-align:right">${esc(invoice.tax || '')}</td></tr>
                        <tr style="font-weight:700"><td></td><td style="text-align:right">Total</td><td style="text-align:right">${esc(invoice.total || '')}</td></tr>
                      </tbody>
                    </table>

                    ${invoice.link ? `<div style="margin-top:12px"><a href="${invoice.link}" class="btn-primary" ${a11y}>View receipt</a></div>` : ''}
                  </div>
                `
                    : ''
                }

                ${security ? renderSecurity(security) : ''}

                ${review ? renderReview(review) : ''}

                ${primaryCTA ? `<div class="cta" style="margin-top:18px;"><a href="${primaryCTA.url}" style="display:inline-block;padding:12px 22px;border-radius:8px;background:${esc(primaryCTA?.color || headerBg)};color:#fff;text-decoration:none;font-weight:700;font-size:15px;" class="btn-primary" ${a11y}>${esc(primaryCTA.text)}</a>${secondaryCTA ? `<a href="${secondaryCTA.url}" style="display:inline-block;padding:10px 18px;border-radius:8px;background:transparent;color:${esc(headerBg)};text-decoration:none;border:1px solid #e5e7eb;font-weight:700;font-size:14px;margin-left:10px;" class="btn-secondary" ${a11y}>${esc(secondaryCTA.text)}</a>` : ''}</div>` : ''}

                ${showDivider && (cards.length || invoice || security || review) ? `<hr class="divider"/>` : ''}
                ${renderSocial(social)}
              </td>
            </tr>

            <tr>
              <td class="footer">
                <div>${footerNote || `This email was sent by ${esc(applicationName)}.`}</div>

                <div style="margin-top:10px;font-size:13px;">
                  <a href="${support}">Support</a> &nbsp;|&nbsp;
                  <a href="${privacy}">Privacy</a> &nbsp;|&nbsp;
                  <a href="${terms}">Terms</a> &nbsp;|&nbsp;
                  <a href="${notifications}">${esc(manageLabel)}</a> &nbsp;|&nbsp;
                  <a href="${unsubscribe}">Unsubscribe</a>
                </div>

                <div style="margin-top:10px;color:${esc(theme.muted)};font-size:12px">&copy; ${year} ${esc(applicationName)}. All rights reserved.</div>

              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
};

/**
 * USER_CREATED Email Template
 * Sent when: A new user account has been created.
 */

const CONTACT_NOTIFICATION = ({
  name,
  email,
  phone,
  company,
  subject,
  message,
  submittedAt,
  contactId,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaPath = null
}) => {
  return {
    subject: `New Contact Form Submission: ${subject || 'No subject'}`,
    html: buildEmailHTML({
      preheader: `You received a new contact form submission from ${name || email}.`,
      title: 'New Contact Form Submission',
      headerBg: '#6366f1',
      headerText: '📩 New Contact Inquiry',
      appUrl: _appUrl,
      applicationName: _appName,
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          You have received a new contact form submission from your website.
        </p>

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Contact Details:</strong><br/>
            <span style="color:#6b7280;">Name:</span>
            <strong style="color:#111827;">${name || 'Not provided'}</strong><br/>
            <span style="color:#6b7280;">Email:</span>
            <strong style="color:#111827;">${email}</strong><br/>
            <span style="color:#6b7280;">Phone:</span>
            <strong style="color:#111827;">${phone || 'Not provided'}</strong><br/>
            <span style="color:#6b7280;">Company:</span>
            <strong style="color:#111827;">${company || 'Not provided'}</strong><br/>
            <span style="color:#6b7280;">Subject:</span>
            <strong style="color:#111827;">${subject || 'Not provided'}</strong><br/>
            <span style="color:#6b7280;">Submitted at:</span>
            <strong style="color:#111827;">${submittedAt}</strong><br/>
            <span style="color:#6b7280;">Contact ID:</span>
            <strong style="color:#111827;">${contactId}</strong>
          </td></tr>
        </table>

        <p style="margin:0 0 8px 0;color:#4b5563;">
          <strong style="color:#111827;">Message:</strong>
        </p>
        <p style="margin:0 0 0 0;color:#4b5563;white-space:pre-line;">
          ${message}
        </p>
      `,
      ctaButton: {
        url: ctaPath ? _appUrl + ctaPath : _appUrl,
        text: 'View in Dashboard',
        color: '#6366f1'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * USER_CREATED — System/admin notification that a new account was created.
 * Sent to admins or used internally. Original contract preserved.
 * Variables: { userId, username, email, timestamp }
 */
const USER_CREATED = ({
  userId,
  username,
  email,
  timestamp,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaPath = null
}) => {
  return {
    subject: `New User Account Created`,
    html: buildEmailHTML({
      preheader: `A new user account has been created.`,
      title: 'New User Account Created',
      headerBg: '#10b981',
      headerText: '👤 Account Created',
      appUrl: _appUrl,
      applicationName: _appName,
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          A new user account has been created.
        </p>

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Account Details:</strong><br/>
            <span style="color:#6b7280;">User ID:</span> <strong style="color:#111827;">${userId}</strong><br/>
            <span style="color:#6b7280;">Email:</span> <strong style="color:#111827;">${email}</strong><br/>
            <span style="color:#6b7280;">Created:</span> <strong style="color:#111827;">${new Date(timestamp).toLocaleString()}</strong>
          </td></tr>
        </table>

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Welcome to our platform! Get started by completing your profile.
        </p>
      `,
      ctaButton: {
        url: ctaPath ? _appUrl + ctaPath : _appUrl,
        text: 'Go to Dashboard',
        color: '#10b981'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * USER_WELCOME — User-facing welcome + email verification email.
 * Sent to the user immediately after self-registration.
 * Variables: { userId, username, email, verifyLink, timestamp }
 */
const USER_WELCOME = ({ userId, username, email, verifyLink, timestamp }) => {
  return {
    subject: `Welcome! Please verify your email address`,
    html: buildEmailHTML({
      preheader: `Hi ${username || 'there'}, one quick step to activate your account.`,
      title: 'Welcome — Verify Your Email',
      headerBg: '#10b981',
      headerText: '👋 Welcome Aboard!',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hi <strong>${username || 'there'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Thanks for signing up! To get started, please verify your email address by clicking the button below.
        </p>
        <p style="margin:0 0 16px 0;color:#6b7280;font-size:13px;">
          This link will expire in <strong>24 hours</strong>. If you didn\'t create this account, you can safely ignore this email.
        </p>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px 20px;background:#f0fdf4;border-left:4px solid #10b981;border-radius:4px;">
          <tr><td style="font-size:13px;line-height:20px;color:#065f46;">
            <strong>Your account details:</strong><br/>
            Email: <strong>${email}</strong><br/>
            Registered: <strong>${timestamp ? new Date(timestamp).toLocaleString() : new Date().toLocaleString()}</strong>
          </td></tr>
        </table>
      `,
      ctaButton: {
        url: verifyLink,
        text: 'Verify Email Address',
        color: '#10b981'
      },
      footerNote:
        "If the button doesn't work, copy and paste this link into your browser: " + verifyLink
    }),
    attachments: []
  };
};

/**
 * ADMIN_USER_REGISTERED — Admin notification when a new user registers.
 * Variables: { userId, username, email, registeredAt, ipAddress }
 */
const ADMIN_USER_REGISTERED = ({
  userId,
  username,
  email,
  registeredAt,
  ipAddress,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaPath = null
}) => {
  return {
    subject: `New user registered: ${email}`,
    html: buildEmailHTML({
      preheader: `A new user (${email}) has just created an account.`,
      title: 'New User Registration',
      headerBg: '#6366f1',
      headerText: '🆕 New User Registered',
      appUrl: _appUrl,
      applicationName: _appName,
      bodyHTML: `
        <p style="margin:0 0 16px 0;">Hello,</p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          A new user has registered on your platform.
        </p>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:24px;">
            <strong style="color:#111827;">Registration Details:</strong><br/>
            <span style="color:#6b7280;">User ID:</span> <strong style="color:#111827;">${userId || 'N/A'}</strong><br/>
            <span style="color:#6b7280;">Username:</span> <strong style="color:#111827;">${username || 'N/A'}</strong><br/>
            <span style="color:#6b7280;">Email:</span> <strong style="color:#111827;">${email}</strong><br/>
            <span style="color:#6b7280;">Registered at:</span> <strong style="color:#111827;">${registeredAt ? new Date(registeredAt).toLocaleString() : new Date().toLocaleString()}</strong><br/>
            <span style="color:#6b7280;">IP Address:</span> <strong style="color:#111827;">${ipAddress || 'Unknown'}</strong>
          </td></tr>
        </table>
      `,
      ctaButton: {
        url: ctaPath ? _appUrl + ctaPath : _appUrl,
        text: 'View in Dashboard',
        color: '#6366f1'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * USER_UPDATED Email Template
 * Sent when: Your account information has been updated.
 */
const USER_UPDATED = ({ userId, username, email, timestamp }) => {
  const displayName = username || email || 'User';

  return {
    subject: 'User Account Updated',
    html: buildEmailHTML({
      preheader: 'Your account information has been updated.',
      title: 'User Account Updated',
      headerBg: '#3b82f6',
      headerText: '✏️ Account Updated',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${displayName}</strong>,
        </p>

        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your account information has been updated${
            timestamp ? ` on <strong>${new Date(timestamp).toLocaleString()}</strong>` : ''
          }.
        </p>

        <p style="margin:24px 0 0 0;color:#4b5563;">
          This notification is for your records. No action is required unless specified.
        </p>

        <p style="margin:8px 0 0 0;color:#9ca3af;font-size:12px;">
          User ID: ${userId}
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * USER_DELETED Email Template
 * Sent when: Your account has been permanently deleted.
 */
const USER_DELETED = ({ userId, username, email, timestamp, reason }) => {
  return {
    subject: `User Account Deleted`,
    html: buildEmailHTML({
      preheader: `Your account has been permanently deleted.`,
      title: 'User Account Deleted',
      headerBg: '#6b7280',
      headerText: '🗑️ Account Deleted',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your account has been permanently deleted.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fee2e2;border-left:4px solid #dc2626;border-radius:4px;">
          <tr><td style="font-size:14px;color:#7f1d1d;">
            <strong>Reason:</strong><br/>
            ${reason || 'Policy violation or security concern'}
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          If you believe this is a mistake, please contact our support team.
        </p>
      `,
      ctaButton: null,
      footerNote: 'This action is permanent and cannot be undone.'
    }),
    attachments: []
  };
};

/**
 * Helper function to create suspension or ban emails to reduce duplication.
 * @private
 */
const createSuspensionOrBanEmail = ({
  type, // 'suspended' or 'banned'
  userId,
  username,
  email,
  timestamp,
  reason,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaPath = null
}) => {
  const isSuspended = type === 'suspended';

  const subject = isSuspended ? 'Account Suspended' : 'Account Banned';
  const preheader = isSuspended
    ? 'Your account has been temporarily suspended.'
    : 'Your account has been permanently banned.';
  const title = subject;
  const headerText = isSuspended ? '⚠️ Account Suspended' : '🚫 Account Banned';
  const bodyIntro = isSuspended
    ? 'Your account has been temporarily suspended.'
    : 'Your account has been permanently banned due to a violation of our terms of service.';
  const defaultReason = isSuspended
    ? 'Policy violation or security concern'
    : 'Repeated policy violations or security concerns.';
  const bodyOutro = isSuspended
    ? 'If you believe this is a mistake, please contact our support team.'
    : 'This action is permanent and cannot be appealed. If you believe this is a mistake, you may contact our support team, but we cannot guarantee a reversal of this decision.';
  const footerNote = isSuspended
    ? 'If you need assistance, our support team is here to help.'
    : 'This decision is final.';

  return {
    subject,
    html: buildEmailHTML({
      preheader,
      title,
      headerBg: '#dc2626',
      headerText,
      appUrl: _appUrl,
      applicationName: _appName,
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          ${bodyIntro}
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fee2e2;border-left:4px solid #dc2626;border-radius:4px;">
          <tr><td style="font-size:14px;color:#7f1d1d;">
            <strong>Reason:</strong><br/>
            ${reason || defaultReason}
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          ${bodyOutro}
        </p>
      `,
      ctaButton: {
        url: ctaPath ? _appUrl + ctaPath : _appUrl + '/support',
        text: 'Contact Support',
        color: '#dc2626'
      },
      footerNote
    }),
    attachments: []
  };
};

/**
 * USER_SUSPENDED Email Template
 * Sent when: Your account has been temporarily suspended.
 */
const USER_SUSPENDED = props => createSuspensionOrBanEmail({ ...props, type: 'suspended' });

/**
 * USER_BANNED Email Template
 * Sent when: A user's account has been permanently banned.
 */
const USER_BANNED = props => createSuspensionOrBanEmail({ ...props, type: 'banned' });

/**
 * USER_REINSTATED Email Template
 * Sent when: Your account has been reinstated and is now active.
 */
const USER_REINSTATED = ({
  userId,
  username,
  email,
  timestamp,
  reason,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaPath = null
}) => {
  return {
    subject: `Account Reinstated`,
    html: buildEmailHTML({
      preheader: `Your account has been reinstated and is now active.`,
      title: 'Account Reinstated',
      headerBg: '#10b981',
      headerText: '✅ Account Reinstated',
      appUrl: _appUrl,
      applicationName: _appName,
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your account has been reinstated and is now active.
        </p>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          This notification is for your records. No action is required unless specified.
        </p>
      `,
      ctaButton: {
        url: ctaPath ? _appUrl + ctaPath : _appUrl,
        text: 'Go to Dashboard',
        color: '#10b981'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * ROLE_ASSIGNED Email Template
 * Sent when: A new role has been assigned to your account.
 */
const ROLE_ASSIGNED = ({ username, roleName, permissions, changedBy }) => {
  return {
    subject: `New Role Assigned`,
    html: buildEmailHTML({
      preheader: `A new role has been assigned to your account.`,
      title: 'New Role Assigned',
      headerBg: '#8b5cf6',
      headerText: '🎭 Role Assigned',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          A new role has been assigned to your account.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Role Information:</strong><br/>
            <span style="color:#6b7280;">Role Name:</span> <strong style="color:#8b5cf6;">${roleName}</strong><br/>
            <span style="color:#6b7280;">Changed By:</span> <strong style="color:#111827;">${changedBy || 'Administrator'}</strong>
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Your access and permissions have been updated accordingly.
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * ROLE_REVOKED Email Template
 * Sent when: A role has been revoked from your account.
 */
const ROLE_REVOKED = ({ username, roleName, permissions, changedBy }) => {
  return {
    subject: `Role Revoked`,
    html: buildEmailHTML({
      preheader: `A role has been revoked from your account.`,
      title: 'Role Revoked',
      headerBg: '#f59e0b',
      headerText: '🚫 Role Revoked',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          A role has been revoked from your account.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Role Information:</strong><br/>
            <span style="color:#6b7280;">Role Name:</span> <strong style="color:#8b5cf6;">${roleName}</strong><br/>
            <span style="color:#6b7280;">Changed By:</span> <strong style="color:#111827;">${changedBy || 'Administrator'}</strong>
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Your access and permissions have been updated accordingly.
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * PERMISSION_CHANGED Email Template
 * Sent when: Your account permissions have been updated.
 */
const PERMISSION_CHANGED = ({ username, roleName, permissions, changedBy }) => {
  return {
    subject: `Permissions Updated`,
    html: buildEmailHTML({
      preheader: `Your account permissions have been updated.`,
      title: 'Permissions Updated',
      headerBg: '#3b82f6',
      headerText: '🔐 Permissions Changed',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your account permissions have been updated.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Updated Permissions:</strong><br/>
            <ul style="margin:8px 0;padding-left:20px;color:#4b5563;">
              ${permissions ? permissions.map(p => `<li>${p}</li>`).join('') : '<li>View updated permissions in your dashboard</li>'}
            </ul>
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Review your new permissions in your account settings.
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * PASSWORD_CHANGED Email Template
 * Sent when: Your password has been changed successfully.
 */
const PASSWORD_CHANGED = ({
  name,
  username,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaPath = null
}) => {
  const displayName = name || username || 'User';
  return {
    subject: `Password Changed Successfully`,
    html: buildEmailHTML({
      preheader: `Your password has been changed successfully.`,
      title: 'Password Changed Successfully',
      headerBg: '#10b981',
      headerText: '🔒 Password Changed',
      appUrl: _appUrl,
      applicationName: _appName,
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${displayName}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your password has been changed successfully.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:4px;">
          <tr><td style="font-size:14px;color:#92400e;">
            <strong>If this wasn't you</strong><br/>
            Please contact our support team immediately to secure your account.
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Your account security is our top priority.
        </p>
      `,
      ctaButton: {
        url: ctaPath ? _appUrl + ctaPath : _appUrl,
        text: 'Review Security Settings',
        color: '#10b981'
      },
      footerNote: "Never share your credentials. We'll never ask for your password."
    }),
    attachments: []
  };
};

/**
 * PASSWORD_RESET_REQUESTED Email Template
 * Sent when: We received a request to reset your password.
 */
const PASSWORD_RESET_REQUESTED = ({
  name,
  username,
  resetLink,
  resetToken,
  resetUrl,
  expiryHours = 1,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName
}) => {
  const displayName = name || username || 'User';
  const ctaUrl = resetLink || resetUrl || _appUrl;
  return {
    subject: `Reset Your Password`,
    html: buildEmailHTML({
      preheader: `We received a request to reset your password. Click to set a new one.`,
      title: 'Reset Your Password',
      headerBg: '#ef4444',
      headerText: '🔑 Reset Your Password',
      appUrl: _appUrl,
      applicationName: _appName,
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${displayName}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We received a request to reset the password for your account. Click the button below to choose a new password.
        </p>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:4px;">
          <tr><td style="font-size:14px;color:#92400e;">
            <strong>⚠️ Security Notice</strong><br/>
            This link expires in <strong>${expiryHours} hour${expiryHours !== 1 ? 's' : ''}</strong>.
            If you didn't request this, you can safely ignore this email — your password will not be changed.
          </td></tr>
        </table>
      `,
      ctaButton: { url: ctaUrl, text: 'Reset Password', color: '#ef4444' },
      footerNote: `If the button doesn't work, copy and paste this link into your browser:<br/><span style="word-break:break-all">${ctaUrl}</span>`
    }),
    attachments: []
  };
};

/**
 * PASSWORD_RESET_COMPLETED Email Template
 * Sent when: Your password has been reset successfully.
 */
const PASSWORD_RESET_COMPLETED = ({
  name,
  username,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaPath = null
}) => {
  const displayName = name || username || 'User';
  return {
    subject: `Password Reset Successful`,
    html: buildEmailHTML({
      preheader: `Your password has been reset successfully. Sign in with your new password.`,
      title: 'Password Reset Successful',
      headerBg: '#10b981',
      headerText: '✅ Password Reset Successful',
      appUrl: _appUrl,
      applicationName: _appName,
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${displayName}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your password has been reset successfully. You can now sign in with your new password.
        </p>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:4px;">
          <tr><td style="font-size:14px;color:#92400e;">
            <strong>If this wasn't you</strong><br/>
            Please contact our support team immediately to secure your account.
          </td></tr>
        </table>
      `,
      ctaButton: {
        url: ctaPath ? _appUrl + ctaPath : _appUrl,
        text: 'Sign In Now',
        color: '#10b981'
      },
      footerNote: "Never share your credentials. We'll never ask for your password."
    }),
    attachments: []
  };
};

/**
 * PASSWORD_EXPIRED Email Template
 * Sent when: Your password has expired and needs to be updated.
 */
const PASSWORD_EXPIRED = ({
  username,
  resetToken,
  resetUrl,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName
}) => {
  return {
    subject: `Password Expired`,
    html: buildEmailHTML({
      preheader: `Your password has expired and needs to be updated.`,
      title: 'Password Expired',
      headerBg: '#f59e0b',
      headerText: '⏰ Password Expired',
      appUrl: _appUrl,
      applicationName: _appName,
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your password has expired and needs to be updated.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fee2e2;border-left:4px solid #dc2626;border-radius:4px;">
          <tr><td style="font-size:14px;color:#7f1d1d;">
            <strong>Action Required</strong><br/>
            For your security, passwords must be updated every 90 days. Please create a new password to continue accessing your account.
          </td></tr>
        </table>
      `,
      ctaButton: {
        url: `${resetUrl || _appUrl + '/reset-password' + (resetToken ? '/' + resetToken : '')}`,
        text: 'Reset Password',
        color: '#f59e0b'
      },
      footerNote: "Never share your credentials. We'll never ask for your password."
    }),
    attachments: []
  };
};



/**
 * PHONE_VERIFIED Email Template
 * Sent when: Your phone number has been verified successfully.
 */
const PHONE_VERIFIED = ({ username, verifiedItem }) => {
  return {
    subject: `Phone Number Verified`,
    html: buildEmailHTML({
      preheader: `Your phone number has been verified successfully.`,
      title: 'Phone Number Verified',
      headerBg: '#10b981',
      headerText: '📱 Phone Verified',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your phone number has been verified successfully.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#d1fae5;border-left:4px solid #10b981;border-radius:4px;">
          <tr><td style="font-size:14px;color:#065f46;">
            <strong>✓ Verification Complete</strong><br/>
            ${verifiedItem ? `Your ${verifiedItem} has been verified successfully.` : 'Your information has been verified.'}
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          You now have full access to all features.
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * PROFILE_COMPLETED Email Template
 * Sent when: Congratulations! Your profile is now complete.
 */
const PROFILE_COMPLETED = ({
  username,
  verifiedItem,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaPath = null
}) => {
  return {
    subject: `Profile Completed`,
    html: buildEmailHTML({
      preheader: `Congratulations! Your profile is now complete.`,
      title: 'Profile Completed',
      headerBg: '#10b981',
      headerText: '🎉 Profile Complete',
      appUrl: _appUrl,
      applicationName: _appName,
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Congratulations! Your profile is now complete.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#d1fae5;border-left:4px solid #10b981;border-radius:4px;">
          <tr><td style="font-size:14px;color:#065f46;">
            <strong>✓ Verification Complete</strong><br/>
            ${verifiedItem ? `Your ${verifiedItem} has been verified successfully.` : 'Your information has been verified.'}
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          You now have full access to all features.
        </p>
      `,
      ctaButton: {
        url: ctaPath ? _appUrl + ctaPath : _appUrl,
        text: 'Go to Dashboard',
        color: '#10b981'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * PROFILE_PICTURE_UPDATED Email Template
 * Sent when: Your profile picture has been updated.
 */
const PROFILE_PICTURE_UPDATED = ({ username, verifiedItem }) => {
  return {
    subject: `Profile Picture Updated`,
    html: buildEmailHTML({
      preheader: `Your profile picture has been updated.`,
      title: 'Profile Picture Updated',
      headerBg: '#3b82f6',
      headerText: '📸 Picture Updated',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your profile picture has been updated.
        </p>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          This notification is for your records. No action is required unless specified.
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * LOGIN_SUCCESS Email Template
 * Sent when: You have successfully logged into your account.
 */
const LOGIN_SUCCESS = ({ username, ipAddress, location, device, timestamp }) => {
  return {
    subject: `Successful Login`,
    html: buildEmailHTML({
      preheader: `You have successfully logged into your account.`,
      title: 'Successful Login',
      headerBg: '#10b981',
      headerText: '✅ Login Successful',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          You have successfully logged into your account.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Login Details:</strong><br/>
            <span style="color:#6b7280;">IP Address:</span> <strong style="color:#111827;">${ipAddress || 'Unknown'}</strong><br/>
            <span style="color:#6b7280;">Location:</span> <strong style="color:#111827;">${location || 'Unknown'}</strong><br/>
            <span style="color:#6b7280;">Device:</span> <strong style="color:#111827;">${device || 'Unknown'}</strong><br/>
            <span style="color:#6b7280;">Time:</span> <strong style="color:#111827;">${new Date(timestamp).toLocaleString()}</strong>
          </td></tr>
        </table>
      `,
      ctaButton: null,
      footerNote: "Never share your credentials. We'll never ask for your password."
    }),
    attachments: []
  };
};

/**
 * LOGIN_FAILED Email Template
 * Sent when: We detected a failed login attempt on your account.
 */
const LOGIN_FAILED = ({
  name,
  username,
  ip,
  ipAddress,
  location,
  device,
  time,
  timestamp,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaPath = null
}) => {
  const displayName = name || username || 'User';
  const displayIp = ip || ipAddress || 'Unknown';
  const displayTime = time || timestamp;
  return {
    subject: `Failed Login Attempt Detected`,
    html: buildEmailHTML({
      preheader: `We detected a failed login attempt on your account.`,
      title: 'Failed Login Attempt',
      headerBg: '#dc2626',
      headerText: '⚠️ Failed Login Attempt',
      appUrl: _appUrl,
      applicationName: _appName,
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${displayName}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We detected a failed login attempt on your account.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Attempt Details:</strong><br/>
            <span style="color:#6b7280;">IP Address:</span> <strong style="color:#111827;">${displayIp}</strong><br/>
            ${location ? `<span style="color:#6b7280;">Location:</span> <strong style="color:#111827;">${location}</strong><br/>` : ''}
            ${device ? `<span style="color:#6b7280;">Device:</span> <strong style="color:#111827;">${device}</strong><br/>` : ''}
            <span style="color:#6b7280;">Time:</span> <strong style="color:#111827;">${displayTime ? new Date(displayTime).toLocaleString() : 'Just now'}</strong>
          </td></tr>
        </table>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fee2e2;border-left:4px solid #dc2626;border-radius:4px;">
          <tr><td style="font-size:14px;color:#7f1d1d;">
            <strong>If this wasn't you</strong><br/>
            Secure your account immediately by resetting your password.
          </td></tr>
        </table>
      `,
      ctaButton: {
        url: ctaPath ? _appUrl + ctaPath : _appUrl,
        text: 'Secure My Account',
        color: '#dc2626'
      },
      footerNote: "Never share your credentials. We'll never ask for your password."
    }),
    attachments: []
  };
};

/**
 * NEW_DEVICE_LOGIN Email Template
 * Sent when: Your account was accessed from a new device.
 */
const NEW_DEVICE_LOGIN = ({
  name,
  username,
  ip,
  ipAddress,
  location,
  device,
  time,
  timestamp,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaPath = null
}) => {
  const displayName = name || username || 'User';
  const displayIp = ip || ipAddress || 'Unknown';
  const displayTime = time || timestamp;
  return {
    subject: `New Device Login Detected`,
    html: buildEmailHTML({
      preheader: `Your account was accessed from a new device or location.`,
      title: 'New Device Login',
      headerBg: '#f59e0b',
      headerText: '🔔 New Device Login Detected',
      appUrl: _appUrl,
      applicationName: _appName,
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${displayName}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We noticed a sign-in to your account from a new device or location.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Login Details:</strong><br/>
            <span style="color:#6b7280;">IP Address:</span> <strong style="color:#111827;">${displayIp}</strong><br/>
            ${location ? `<span style="color:#6b7280;">Location:</span> <strong style="color:#111827;">${location}</strong><br/>` : ''}
            ${device ? `<span style="color:#6b7280;">Device:</span> <strong style="color:#111827;">${device}</strong><br/>` : ''}
            <span style="color:#6b7280;">Time:</span> <strong style="color:#111827;">${displayTime ? new Date(displayTime).toLocaleString() : 'Just now'}</strong>
          </td></tr>
        </table>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fee2e2;border-left:4px solid #dc2626;border-radius:4px;">
          <tr><td style="font-size:14px;color:#7f1d1d;">
            <strong>If this wasn't you</strong><br/>
            Secure your account immediately by resetting your password and reviewing active sessions.
          </td></tr>
        </table>
      `,
      ctaButton: {
        url: ctaPath ? _appUrl + ctaPath : _appUrl,
        text: 'Secure My Account',
        color: '#f59e0b'
      },
      footerNote: "Never share your credentials. We'll never ask for your password."
    }),
    attachments: []
  };
};

/**
 * ACCOUNT_LOCKED Email Template
 * Sent when: Your account has been locked for security reasons.
 */
const ACCOUNT_LOCKED = ({
  name,
  username,
  maxAttempts,
  reason,
  supportUrl,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaPath = null
}) => {
  const displayName = name || username || 'User';
  const lockReason = maxAttempts
    ? `Too many failed login attempts (${maxAttempts} attempts exceeded).`
    : reason || 'Suspicious activity detected on your account.';
  return {
    subject: `Your Account Has Been Locked`,
    html: buildEmailHTML({
      preheader: `Your account has been temporarily locked for security reasons.`,
      title: 'Account Locked',
      headerBg: '#dc2626',
      headerText: '🔒 Account Temporarily Locked',
      appUrl: _appUrl,
      applicationName: _appName,
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${displayName}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your account has been temporarily locked for security reasons.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fee2e2;border-left:4px solid #dc2626;border-radius:4px;">
          <tr><td style="font-size:14px;color:#7f1d1d;">
            <strong>Reason:</strong><br/>
            ${lockReason}
          </td></tr>
        </table>
        
        <p style="margin:16px 0 0 0;color:#4b5563;">
          To unlock your account, use the button below to submit an unlock request. If you believe this is a mistake, contact our support team.
        </p>
      `,
      ctaButton: {
        url: supportUrl || (ctaPath ? _appUrl + ctaPath : _appUrl + '/account/unlock'),
        text: 'Request Account Unlock',
        color: '#dc2626'
      },
      footerNote: 'If you need assistance, our support team is here to help.'
    }),
    attachments: []
  };
};

/**
 * ACCOUNT_UNLOCKED Email Template
 * Sent when: Your account has been unlocked and is now accessible.
 */
const ACCOUNT_UNLOCKED = ({
  name,
  username,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaPath = null
}) => {
  const displayName = name || username || 'User';
  return {
    subject: `Account Unlocked — You Can Now Sign In`,
    html: buildEmailHTML({
      preheader: `Your account has been unlocked and is now accessible.`,
      title: 'Account Unlocked',
      headerBg: '#10b981',
      headerText: '🔓 Account Unlocked',
      appUrl: _appUrl,
      applicationName: _appName,
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${displayName}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your account has been successfully unlocked. You can now sign in as normal.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#d1fae5;border-left:4px solid #10b981;border-radius:4px;">
          <tr><td style="font-size:14px;color:#065f46;">
            <strong>✓ Access Restored</strong><br/>
            To prevent future lockouts, make sure to use the correct credentials when signing in.
          </td></tr>
        </table>
      `,
      ctaButton: {
        url: ctaPath ? _appUrl + ctaPath : _appUrl,
        text: 'Sign In Now',
        color: '#10b981'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * ACCOUNT_RECOVERY_REQUESTED Email Template
 * Sent when: We received a request to recover your account.
 */
const ACCOUNT_RECOVERY_REQUESTED = ({
  name,
  username,
  unlockLink,
  expiryHours = 1,
  accountId,
  reason,
  supportUrl,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName
}) => {
  const displayName = name || username || 'User';
  const ctaUrl = unlockLink || supportUrl || _appUrl + '/account/unlock';
  return {
    subject: `Account Unlock Request`,
    html: buildEmailHTML({
      preheader: `We received a request to unlock your account. Click the button to confirm.`,
      title: 'Account Unlock Request',
      headerBg: '#f59e0b',
      headerText: '🔄 Account Unlock Request',
      appUrl: _appUrl,
      applicationName: _appName,
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${displayName}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We received a request to unlock your account. Click the button below to confirm and regain access.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:4px;">
          <tr><td style="font-size:14px;color:#92400e;">
            <strong>⚠️ This link expires in ${expiryHours} hour${expiryHours !== 1 ? 's' : ''}</strong><br/>
            If you didn't request this, you can safely ignore this email.
          </td></tr>
        </table>
      `,
      ctaButton: { url: ctaUrl, text: 'Unlock My Account', color: '#f59e0b' },
      footerNote: `If the button doesn't work, copy and paste this link into your browser:<br/><span style="word-break:break-all">${ctaUrl}</span>`
    }),
    attachments: []
  };
};

/**
 * ACCOUNT_RECOVERY_COMPLETED Email Template
 * Sent when: Your account has been recovered successfully.
 */
const ACCOUNT_RECOVERY_COMPLETED = ({
  username,
  accountId,
  reason,
  supportUrl,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaPath = null
}) => {
  return {
    subject: `Account Recovery Completed`,
    html: buildEmailHTML({
      preheader: `Your account has been recovered successfully.`,
      title: 'Account Recovery Completed',
      headerBg: '#10b981',
      headerText: '✅ Recovery Complete',
      appUrl: _appUrl,
      applicationName: _appName,
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your account has been recovered successfully.
        </p>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          This notification is for your records. No action is required unless specified.
        </p>
      `,
      ctaButton: {
        url: ctaPath ? _appUrl + ctaPath : _appUrl,
        text: 'Go to Dashboard',
        color: '#10b981'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * CONSENT_REQUIRED Email Template
 * Sent when: We need your consent to continue providing our services.
 */
const CONSENT_REQUIRED = ({
  username,
  consentType,
  detailsUrl,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaPath = null
}) => {
  return {
    subject: `Consent Required`,
    html: buildEmailHTML({
      preheader: `We need your consent to continue providing our services.`,
      title: 'Consent Required',
      headerBg: '#3b82f6',
      headerText: '📋 Action Required',
      appUrl: _appUrl,
      applicationName: _appName,
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We need your consent to continue providing our services.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#dbeafe;border-left:4px solid #3b82f6;border-radius:4px;">
          <tr><td style="font-size:14px;color:#1e40af;">
            <strong>Consent Type:</strong> ${consentType || 'Data Processing'}<br/><br/>
            Your consent is important to us and helps us provide better services.
          </td></tr>
        </table>
      `,
      ctaButton: {
        url: detailsUrl || (ctaPath ? _appUrl + ctaPath : _appUrl + '/consent'),
        text: 'Manage Consent',
        color: '#3b82f6'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * CONSENT_REVOKED Email Template
 * Sent when: Your consent has been revoked as requested.
 */
const CONSENT_REVOKED = ({ username, consentType, detailsUrl }) => {
  return {
    subject: `Consent Revoked`,
    html: buildEmailHTML({
      preheader: `Your consent has been revoked as requested.`,
      title: 'Consent Revoked',
      headerBg: '#6b7280',
      headerText: '🚫 Consent Revoked',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your consent has been revoked as requested.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#dbeafe;border-left:4px solid #3b82f6;border-radius:4px;">
          <tr><td style="font-size:14px;color:#1e40af;">
            <strong>Consent Type:</strong> ${consentType || 'Data Processing'}<br/><br/>
            Your consent is important to us and helps us provide better services.
          </td></tr>
        </table>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * ACCOUNT_MERGED Email Template
 * Sent when: Your accounts have been merged successfully.
 */
const ACCOUNT_MERGED = ({ username, accountId, reason, supportUrl }) => {
  return {
    subject: `Accounts Merged Successfully`,
    html: buildEmailHTML({
      preheader: `Your accounts have been merged successfully.`,
      title: 'Accounts Merged Successfully',
      headerBg: '#8b5cf6',
      headerText: '🔗 Accounts Merged',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your accounts have been merged successfully.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">What this means:</strong><br/>
            • Your data from all accounts is now consolidated<br/>
            • Use any previous login method<br/>
            • All preferences and history are preserved
          </td></tr>
        </table>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * ACCOUNT_TERMINATED Email Template
 * Sent when: Your account has been permanently terminated.
 */
const ACCOUNT_TERMINATED = ({ name, username, accountId, reason, supportUrl }) => {
  const displayName = name || username || 'User';
  return {
    subject: `Your Account Has Been Closed`,
    html: buildEmailHTML({
      preheader: `Your account has been permanently closed.`,
      title: 'Account Closed',
      headerBg: '#dc2626',
      headerText: '❌ Account Closed',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${displayName}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your account has been permanently closed and all associated data has been scheduled for removal.
        </p>
        
        ${
          reason
            ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fee2e2;border-left:4px solid #dc2626;border-radius:4px;">
          <tr><td style="font-size:14px;color:#7f1d1d;">
            <strong>Reason:</strong><br/>${reason}
          </td></tr>
        </table>
        `
            : ''
        }
        
        <p style="margin:16px 0 0 0;color:#4b5563;">
          If you believe this was done in error, please contact our support team as soon as possible.
        </p>
      `,
      ctaButton: null,
      footerNote: 'This action is permanent. Please contact support if you have any questions.'
    }),
    attachments: []
  };
};

/**
 * SOCIAL_LOGIN_CONNECTED Email Template
 * Sent when: A social login account has been connected.
 */
const SOCIAL_LOGIN_CONNECTED = ({
  name,
  username,
  provider,
  email,
  time,
  timestamp,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaPath = null
}) => {
  const displayName = name || username || 'User';
  const displayTime = time || timestamp;
  return {
    subject: `${provider || 'Social'} Account Connected`,
    html: buildEmailHTML({
      preheader: `Your ${provider || 'social'} account has been connected successfully.`,
      title: 'Social Account Connected',
      headerBg: '#10b981',
      headerText: '🔗 Account Connected',
      appUrl: _appUrl,
      applicationName: _appName,
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${displayName}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your <strong>${provider || 'social'}</strong> account has been successfully connected.
          You can now use it to sign in quickly.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Provider:</strong> <span style="color:#8b5cf6;">${provider || 'Social Account'}</span><br/>
            ${email ? `<strong style="color:#111827;">Account Email:</strong> ${email}<br/>` : ''}
            ${displayTime ? `<strong style="color:#111827;">Connected:</strong> ${new Date(displayTime).toLocaleString()}<br/>` : ''}
          </td></tr>
        </table>
        
        <p style="margin:0 0 0 0;color:#4b5563;">
          If you didn't connect this account, please review your linked accounts immediately.
        </p>
      `,
      ctaButton: {
        url: ctaPath ? _appUrl + ctaPath : _appUrl,
        text: 'Manage Connected Accounts',
        color: '#10b981'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * SOCIAL_LOGIN_DISCONNECTED Email Template
 * Sent when: A social login account has been disconnected.
 */
const SOCIAL_LOGIN_DISCONNECTED = ({
  name,
  username,
  provider,
  email,
  time,
  timestamp,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaPath = null
}) => {
  const displayName = name || username || 'User';
  const displayTime = time || timestamp;
  return {
    subject: `${provider || 'Social'} Account Disconnected`,
    html: buildEmailHTML({
      preheader: `Your ${provider || 'social'} account has been disconnected.`,
      title: 'Social Account Disconnected',
      headerBg: '#f59e0b',
      headerText: '🔌 Account Disconnected',
      appUrl: _appUrl,
      applicationName: _appName,
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${displayName}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your <strong>${provider || 'social'}</strong> account has been disconnected from your profile.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Provider:</strong> <span style="color:#8b5cf6;">${provider || 'Social Account'}</span><br/>
            ${email ? `<strong style="color:#111827;">Account Email:</strong> ${email}<br/>` : ''}
            ${displayTime ? `<strong style="color:#111827;">Disconnected:</strong> ${new Date(displayTime).toLocaleString()}<br/>` : ''}
          </td></tr>
        </table>
        
        <p style="margin:0 0 0 0;color:#4b5563;">
          If you didn't do this, please review your security settings immediately.
        </p>
      `,
      ctaButton: {
        url: ctaPath ? _appUrl + ctaPath : _appUrl,
        text: 'Review Security Settings',
        color: '#f59e0b'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * MFA_ENABLED Email Template
 * Sent when: Two-factor authentication has been enabled on your account.
 */
const MFA_ENABLED = ({ name, username, device, time, timestamp }) => {
  const displayName = name || username || 'User';
  const displayTime = time || timestamp;
  return {
    subject: `Two-Factor Authentication Enabled`,
    html: buildEmailHTML({
      preheader: `Two-factor authentication has been successfully enabled on your account.`,
      title: 'Two-Factor Authentication Enabled',
      headerBg: '#10b981',
      headerText: '🔐 2FA Enabled',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${displayName}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Two-factor authentication (2FA) has been successfully enabled on your account.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#d1fae5;border-left:4px solid #10b981;border-radius:4px;">
          <tr><td style="font-size:14px;color:#065f46;">
            <strong>✓ Security Enhanced</strong><br/>
            Your account now has an extra layer of protection. You'll need your authenticator app each time you sign in.
          </td></tr>
        </table>
        
        ${displayTime ? `<p style="margin:16px 0 0 0;color:#6b7280;font-size:13px;">Enabled on: <strong>${new Date(displayTime).toLocaleString()}</strong>${device ? ` from ${device}` : ''}</p>` : ''}
      `,
      ctaButton: null,
      footerNote: "Never share your credentials. We'll never ask for your 2FA code."
    }),
    attachments: []
  };
};

/**
 * MFA_DISABLED Email Template
 * Sent when: Two-factor authentication has been disabled.
 */
const MFA_DISABLED = ({
  name,
  username,
  device,
  time,
  timestamp,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaPath = null
}) => {
  const displayName = name || username || 'User';
  const displayTime = time || timestamp;
  return {
    subject: `Two-Factor Authentication Disabled`,
    html: buildEmailHTML({
      preheader: `Two-factor authentication has been disabled on your account.`,
      title: 'Two-Factor Authentication Disabled',
      headerBg: '#f59e0b',
      headerText: '⚠️ 2FA Disabled',
      appUrl: _appUrl,
      applicationName: _appName,
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${displayName}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Two-factor authentication (2FA) has been disabled on your account.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:4px;">
          <tr><td style="font-size:14px;color:#92400e;">
            <strong>⚠️ Security Reduced</strong><br/>
            Your account is now less secure. We strongly recommend re-enabling two-factor authentication.
          </td></tr>
        </table>
        
        ${displayTime ? `<p style="margin:8px 0 16px 0;color:#6b7280;font-size:13px;">Disabled on: <strong>${new Date(displayTime).toLocaleString()}</strong>${device ? ` from ${device}` : ''}</p>` : ''}
        
        <p style="margin:0 0 0 0;color:#4b5563;">
          If you didn't make this change, please secure your account immediately.
        </p>
      `,
      ctaButton: {
        url: ctaPath ? _appUrl + ctaPath : _appUrl,
        text: 'Re-enable 2FA',
        color: '#f59e0b'
      },
      footerNote: "Never share your credentials. We'll never ask for your password."
    }),
    attachments: []
  };
};

/**
 * SESSION_EXPIRED Email Template
 * Sent when: Your session has expired. Please log in again.
 */
const SESSION_EXPIRED = ({
  username,
  device,
  timestamp,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaPath = null
}) => {
  return {
    subject: `Session Expired`,
    html: buildEmailHTML({
      preheader: `Your session has expired. Please log in again.`,
      title: 'Session Expired',
      headerBg: '#6b7280',
      headerText: '⏰ Session Expired',
      appUrl: _appUrl,
      applicationName: _appName,
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your session has expired. Please log in again.
        </p>
        
        <p style="margin:24px 0;color:#4b5563;">
          For your security, sessions expire after a period of inactivity. Please log in again to continue.
        </p>
      `,
      ctaButton: {
        url: ctaPath ? _appUrl + ctaPath : _appUrl,
        text: 'Log In Again',
        color: '#6b7280'
      },
      footerNote: "Never share your credentials. We'll never ask for your password."
    }),
    attachments: []
  };
};

/**
 * PRIVACY_POLICY_UPDATED Email Template
 * Sent when: Our privacy policy has been updated.
 */
const PRIVACY_POLICY_UPDATED = ({
  effectiveDate,
  changesUrl,
  documentUrl,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaPath = null
}) => {
  return {
    subject: `Privacy Policy Updated`,
    html: buildEmailHTML({
      preheader: `Our privacy policy has been updated.`,
      title: 'Privacy Policy Updated',
      headerBg: '#3b82f6',
      headerText: '📜 Policy Update',
      appUrl: _appUrl,
      applicationName: _appName,
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>User</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Our privacy policy has been updated.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Effective Date:</strong> ${effectiveDate || 'Immediately'}<br/><br/>
            We've updated our privacy policy to better serve you and ensure transparency.
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Please review the changes at your earliest convenience.
        </p>
      `,
      ctaButton: {
        url: documentUrl || changesUrl || (ctaPath ? _appUrl + ctaPath : _appUrl + '/legal'),
        text: 'View Changes',
        color: '#3b82f6'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * TERMS_OF_SERVICE_UPDATED Email Template
 * Sent when: Our terms of service have been updated.
 */
const TERMS_OF_SERVICE_UPDATED = ({
  effectiveDate,
  changesUrl,
  documentUrl,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaPath = null
}) => {
  return {
    subject: `Terms of Service Updated`,
    html: buildEmailHTML({
      preheader: `Our terms of service have been updated.`,
      title: 'Terms of Service Updated',
      headerBg: '#3b82f6',
      headerText: '📜 Terms Updated',
      appUrl: _appUrl,
      applicationName: _appName,
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>User</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Our terms of service have been updated.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Effective Date:</strong> ${effectiveDate || 'Immediately'}<br/><br/>
            We've updated our terms of service to better serve you and ensure transparency.
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Please review the changes at your earliest convenience.
        </p>
      `,
      ctaButton: {
        url: documentUrl || changesUrl || (ctaPath ? _appUrl + ctaPath : _appUrl + '/legal'),
        text: 'View Changes',
        color: '#3b82f6'
      },
      footerNote: null
    }),
    attachments: []
  };
};

const ORG_CREATED = ({
  orgName,
  orgId,
  adminName,
  adminEmail,
  createdAt,
  planName,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName
}) => {
  return {
    subject: `Organization "${orgName}" Created Successfully`,
    html: buildEmailHTML({
      preheader: `Your organization ${orgName} has been created and is ready to use.`,
      title: 'Organization Created',
      headerBg: '#10b981',
      headerText: '🏢 Organization Created',
      appUrl: _appUrl,
      applicationName: _appName,
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${adminName || 'Admin'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your organization <strong style="color:#111827;">${orgName}</strong> has been created successfully!
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Organization Details:</strong><br/>
            <span style="color:#6b7280;">Organization ID:</span> <strong style="color:#111827;">${orgId}</strong><br/>
            <span style="color:#6b7280;">Organization Name:</span> <strong style="color:#111827;">${orgName}</strong><br/>
            <span style="color:#6b7280;">Plan:</span> <strong style="color:#10b981;">${planName || 'Free'}</strong><br/>
            <span style="color:#6b7280;">Created:</span> <strong style="color:#111827;">${new Date(createdAt).toLocaleString()}</strong>
          </td></tr>
        </table>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#d1fae5;border-left:4px solid #10b981;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#065f46;">
            <strong>🎉 Next Steps:</strong><br/>
            • Invite team members to your organization<br/>
            • Configure organization settings and preferences<br/>
            • Set up security policies and access controls<br/>
            • Customize your organization profile
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Start building with your team today!
        </p>
      `,
      ctaButton: {
        url: `${_appUrl}/organizations/${orgId}`,
        text: 'Go to Organization',
        color: '#10b981'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * ORG_UPDATED Email Template
 * Sent when: Organization details have been updated
 */
const ORG_UPDATED = ({
  orgName,
  orgId,
  updatedBy,
  updatedFields,
  updatedAt,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName
}) => {
  const fieldsHTML =
    updatedFields && updatedFields.length > 0
      ? updatedFields.map(field => `<li style="margin:4px 0;">${field}</li>`).join('')
      : '<li>Organization details updated</li>';

  return {
    subject: `Organization "${orgName}" Updated`,
    html: buildEmailHTML({
      preheader: `${orgName} organization details have been updated.`,
      title: 'Organization Updated',
      headerBg: '#3b82f6',
      headerText: '✏️ Organization Updated',
      appUrl: _appUrl,
      applicationName: _appName,
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          The organization <strong style="color:#111827;">${orgName}</strong> has been updated.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Updated Fields:</strong><br/>
            <ul style="margin:8px 0;padding-left:20px;color:#4b5563;">
              ${fieldsHTML}
            </ul>
            <br/>
            <span style="color:#6b7280;">Updated By:</span> <strong style="color:#111827;">${updatedBy || 'Admin'}</strong><br/>
            <span style="color:#6b7280;">Updated At:</span> <strong style="color:#111827;">${new Date(updatedAt).toLocaleString()}</strong>
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          This is a notification of the change for your records.
        </p>
      `,
      ctaButton: {
        url: `${_appUrl}/organizations/${orgId}/settings`,
        text: 'View Organization Settings',
        color: '#3b82f6'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * ORG_DELETED Email Template
 * Sent when: An organization has been permanently deleted
 */
const ORG_DELETED = ({
  orgName,
  orgId,
  deletedBy,
  deletedAt,
  reason,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaPath = null
}) => {
  return {
    subject: `Organization "${orgName}" Deleted`,
    html: buildEmailHTML({
      preheader: `Organization ${orgName} has been permanently deleted.`,
      title: 'Organization Deleted',
      headerBg: '#dc2626',
      headerText: '🗑️ Organization Deleted',
      appUrl: _appUrl,
      applicationName: _appName,
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          The organization <strong style="color:#111827;">${orgName}</strong> has been permanently deleted.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fee2e2;border-left:4px solid #dc2626;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#7f1d1d;">
            <strong>⚠️ Important:</strong><br/>
            ${reason || 'This action is permanent and cannot be undone. All organization data, settings, and member access have been removed.'}
          </td></tr>
        </table>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <span style="color:#6b7280;">Deleted By:</span> <strong style="color:#111827;">${deletedBy || 'Administrator'}</strong><br/>
            <span style="color:#6b7280;">Deleted At:</span> <strong style="color:#111827;">${new Date(deletedAt).toLocaleString()}</strong>
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          If you have questions or need assistance, please contact our support team.
        </p>
      `,
      ctaButton: {
        url: ctaPath ? _appUrl + ctaPath : `${_appUrl}/support`,
        text: 'Contact Support',
        color: '#dc2626'
      },
      footerNote: 'This action is permanent and cannot be undone.'
    }),
    attachments: []
  };
};

/**
 * ORG_PLAN_CHANGED Email Template
 * Sent when: Organization subscription plan has been changed
 */
const ORG_PLAN_CHANGED = ({
  orgName,
  orgId,
  oldPlan,
  newPlan,
  changedBy,
  effectiveDate,
  features,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName
}) => {
  const featuresHTML =
    features && features.length > 0
      ? features.map(feature => `<li style="margin:4px 0;">✓ ${feature}</li>`).join('')
      : '<li>View your new plan features in the dashboard</li>';

  return {
    subject: `Plan Updated: ${orgName} is now on ${newPlan}`,
    html: buildEmailHTML({
      preheader: `Your organization plan has been changed from ${oldPlan} to ${newPlan}.`,
      title: 'Plan Changed',
      headerBg: '#8b5cf6',
      headerText: '📋 Plan Updated',
      appUrl: _appUrl,
      applicationName: _appName,
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          The subscription plan for <strong style="color:#111827;">${orgName}</strong> has been updated.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;">
          <tr>
            <td align="center" style="padding:20px;">
              <div style="font-size:14px;color:#6b7280;margin-bottom:8px;">Previous Plan</div>
              <div style="font-size:20px;font-weight:700;color:#6b7280;padding:12px 24px;background:#f3f4f6;border-radius:6px;display:inline-block;">${oldPlan || 'N/A'}</div>
            </td>
            <td align="center" style="padding:20px;">
              <div style="font-size:24px;color:#8b5cf6;">→</div>
            </td>
            <td align="center" style="padding:20px;">
              <div style="font-size:14px;color:#6b7280;margin-bottom:8px;">New Plan</div>
              <div style="font-size:20px;font-weight:700;color:#8b5cf6;padding:12px 24px;background:#f3f4f6;border-radius:6px;display:inline-block;">${newPlan}</div>
            </td>
          </tr>
        </table>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">New Plan Features:</strong><br/>
            <ul style="margin:8px 0;padding-left:20px;color:#4b5563;">
              ${featuresHTML}
            </ul>
            <br/>
            <span style="color:#6b7280;">Effective Date:</span> <strong style="color:#111827;">${effectiveDate ? new Date(effectiveDate).toLocaleDateString() : 'Immediately'}</strong><br/>
            <span style="color:#6b7280;">Changed By:</span> <strong style="color:#111827;">${changedBy || 'Administrator'}</strong>
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Enjoy your new plan features!
        </p>
      `,
      ctaButton: {
        url: `${_appUrl}/organizations/${orgId}/billing`,
        text: 'View Billing Details',
        color: '#8b5cf6'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * ORG_MEMBER_INVITED Email Template
 * Sent when: A new member has been invited to the organization
 */
const ORG_MEMBER_INVITED = ({
  orgName,
  orgId,
  inviteeEmail,
  inviteeName,
  invitedBy,
  role,
  inviteUrl,
  expiresAt,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName
}) => {
  return {
    subject: `You've been invited to join ${orgName}`,
    html: buildEmailHTML({
      preheader: `${invitedBy} has invited you to join ${orgName} as ${role}.`,
      title: 'Organization Invitation',
      headerBg: '#10b981',
      headerText: "🎉 You're Invited!",
      appUrl: _appUrl,
      applicationName: _appName,
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${inviteeName || inviteeEmail}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          <strong style="color:#111827;">${invitedBy}</strong> has invited you to join the organization <strong style="color:#111827;">${orgName}</strong>.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Invitation Details:</strong><br/>
            <span style="color:#6b7280;">Organization:</span> <strong style="color:#111827;">${orgName}</strong><br/>
            <span style="color:#6b7280;">Role:</span> <strong style="color:#8b5cf6;">${role || 'Member'}</strong><br/>
            <span style="color:#6b7280;">Invited By:</span> <strong style="color:#111827;">${invitedBy}</strong><br/>
            ${expiresAt ? `<span style="color:#6b7280;">Expires:</span> <strong style="color:#dc2626;">${new Date(expiresAt).toLocaleString()}</strong>` : ''}
          </td></tr>
        </table>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#d1fae5;border-left:4px solid #10b981;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#065f46;">
            <strong>✓ What happens next?</strong><br/>
            Click the button below to accept the invitation and join the organization. You'll get access to all team resources and collaboration tools.
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          We're excited to have you on the team!
        </p>
      `,
      ctaButton: {
        url: inviteUrl || `${_appUrl}/organizations/invite/accept`,
        text: 'Accept Invitation',
        color: '#10b981'
      },
      footerNote: 'This invitation link is unique to you. Do not share it with others.'
    }),
    attachments: []
  };
};

/**
 * ORG_MEMBER_REMOVED Email Template
 * Sent when: A member has been removed from the organization
 */
const ORG_MEMBER_REMOVED = ({
  orgName,
  orgId,
  memberName,
  memberEmail,
  removedBy,
  reason,
  removedAt,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaPath = null
}) => {
  return {
    subject: `Removed from Organization: ${orgName}`,
    html: buildEmailHTML({
      preheader: `You have been removed from ${orgName}.`,
      title: 'Member Removed',
      headerBg: '#dc2626',
      headerText: '👋 Access Removed',
      appUrl: _appUrl,
      applicationName: _appName,
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${memberName || memberEmail}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          You have been removed from the organization <strong style="color:#111827;">${orgName}</strong>.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fee2e2;border-left:4px solid #dc2626;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#7f1d1d;">
            <strong>Access Status:</strong><br/>
            Your access to ${orgName} has been revoked. You will no longer be able to access organization resources, data, or tools.
          </td></tr>
        </table>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            ${reason ? `<span style="color:#6b7280;">Reason:</span> <strong style="color:#111827;">${reason}</strong><br/>` : ''}
            <span style="color:#6b7280;">Removed By:</span> <strong style="color:#111827;">${removedBy || 'Administrator'}</strong><br/>
            <span style="color:#6b7280;">Date:</span> <strong style="color:#111827;">${new Date(removedAt).toLocaleString()}</strong>
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          If you believe this was done in error, please contact the organization administrator or our support team.
        </p>
      `,
      ctaButton: {
        url: ctaPath ? _appUrl + ctaPath : `${_appUrl}/support`,
        text: 'Contact Support',
        color: '#dc2626'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * ORG_ROLE_ASSIGNED Email Template
 * Sent when: A role has been assigned to a member in the organization
 */
const ORG_ROLE_ASSIGNED = ({
  orgName,
  orgId,
  memberName,
  memberEmail,
  roleName,
  assignedBy,
  permissions,
  assignedAt,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName
}) => {
  const permissionsHTML =
    permissions && permissions.length > 0
      ? permissions.map(perm => `<li style="margin:4px 0;">✓ ${perm}</li>`).join('')
      : '<li>View your permissions in organization settings</li>';

  return {
    subject: `New Role Assigned in ${orgName}`,
    html: buildEmailHTML({
      preheader: `You've been assigned the role of ${roleName} in ${orgName}.`,
      title: 'Role Assigned',
      headerBg: '#8b5cf6',
      headerText: '🎭 Role Assigned',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${memberName || memberEmail}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          You have been assigned a new role in <strong style="color:#111827;">${orgName}</strong>.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Role Information:</strong><br/>
            <span style="color:#6b7280;">Role:</span> <strong style="color:#8b5cf6;font-size:18px;">${roleName}</strong><br/>
            <span style="color:#6b7280;">Assigned By:</span> <strong style="color:#111827;">${assignedBy || 'Administrator'}</strong><br/>
            <span style="color:#6b7280;">Date:</span> <strong style="color:#111827;">${new Date(assignedAt).toLocaleString()}</strong>
          </td></tr>
        </table>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Your Permissions:</strong><br/>
            <ul style="margin:8px 0;padding-left:20px;color:#4b5563;">
              ${permissionsHTML}
            </ul>
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Your access and capabilities have been updated accordingly.
        </p>
      `,
      ctaButton: {
        url: `${_appUrl}/organizations/${orgId}/members`,
        text: 'View Team',
        color: '#8b5cf6'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * ORG_ROLE_CHANGED Email Template
 * Sent when: A member's role has been changed in the organization
 */
const ORG_ROLE_CHANGED = ({
  orgName,
  orgId,
  memberName,
  memberEmail,
  oldRole,
  newRole,
  changedBy,
  changedAt,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName
}) => {
  return {
    subject: `Role Changed in ${orgName}`,
    html: buildEmailHTML({
      preheader: `Your role in ${orgName} has been changed from ${oldRole} to ${newRole}.`,
      title: 'Role Changed',
      headerBg: '#3b82f6',
      headerText: '🔄 Role Updated',
      appUrl: _appUrl,
      applicationName: _appName,
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${memberName || memberEmail}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your role in <strong style="color:#111827;">${orgName}</strong> has been updated.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;">
          <tr>
            <td align="center" style="padding:20px;">
              <div style="font-size:14px;color:#6b7280;margin-bottom:8px;">Previous Role</div>
              <div style="font-size:18px;font-weight:700;color:#6b7280;padding:12px 24px;background:#f3f4f6;border-radius:6px;display:inline-block;">${oldRole || 'N/A'}</div>
            </td>
            <td align="center" style="padding:20px;">
              <div style="font-size:24px;color:#3b82f6;">→</div>
            </td>
            <td align="center" style="padding:20px;">
              <div style="font-size:14px;color:#6b7280;margin-bottom:8px;">New Role</div>
              <div style="font-size:18px;font-weight:700;color:#8b5cf6;padding:12px 24px;background:#f3f4f6;border-radius:6px;display:inline-block;">${newRole}</div>
            </td>
          </tr>
        </table>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <span style="color:#6b7280;">Changed By:</span> <strong style="color:#111827;">${changedBy || 'Administrator'}</strong><br/>
            <span style="color:#6b7280;">Date:</span> <strong style="color:#111827;">${new Date(changedAt).toLocaleString()}</strong>
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Your permissions and access have been updated to match your new role.
        </p>
      `,
      ctaButton: {
        url: `${_appUrl}/organizations/${orgId}/settings`,
        text: 'View Organization',
        color: '#3b82f6'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * ORG_ROLE_REVOKED Email Template
 * Sent when: A role has been revoked from a member in the organization
 */
const ORG_ROLE_REVOKED = ({
  orgName,
  orgId,
  memberName,
  memberEmail,
  roleName,
  revokedBy,
  revokedAt,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName
}) => {
  return {
    subject: `Role Revoked in ${orgName}`,
    html: buildEmailHTML({
      preheader: `The ${roleName} role has been revoked from your account in ${orgName}.`,
      title: 'Role Revoked',
      headerBg: '#f59e0b',
      headerText: '🚫 Role Revoked',
      appUrl: _appUrl,
      applicationName: _appName,
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${memberName || memberEmail}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          A role has been revoked from your account in <strong style="color:#111827;">${orgName}</strong>.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#92400e;">
            <strong>⚠️ Role Status:</strong><br/>
            Your <strong>${roleName}</strong> role has been removed. Your access and permissions have been adjusted accordingly.
          </td></tr>
        </table>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <span style="color:#6b7280;">Revoked Role:</span> <strong style="color:#111827;">${roleName}</strong><br/>
            <span style="color:#6b7280;">Revoked By:</span> <strong style="color:#111827;">${revokedBy || 'Administrator'}</strong><br/>
            <span style="color:#6b7280;">Date:</span> <strong style="color:#111827;">${new Date(revokedAt).toLocaleString()}</strong>
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          If you have questions about this change, please contact your organization administrator.
        </p>
      `,
      ctaButton: {
        url: `${_appUrl}/organizations/${orgId}`,
        text: 'View Organization',
        color: '#f59e0b'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * ORG_SECURITY_POLICY_UPDATED Email Template
 * Sent when: Organization security policy has been updated
 */
const ORG_SECURITY_POLICY_UPDATED = ({
  orgName,
  orgId,
  updatedBy,
  policyChanges,
  effectiveDate,
  requiresAction,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName
}) => {
  const changesHTML =
    policyChanges && policyChanges.length > 0
      ? policyChanges.map(change => `<li style="margin:4px 0;">${change}</li>`).join('')
      : '<li>Security policy has been updated</li>';

  return {
    subject: `Security Policy Updated: ${orgName}`,
    html: buildEmailHTML({
      preheader: `Security policy for ${orgName} has been updated.`,
      title: 'Security Policy Updated',
      headerBg: '#8b5cf6',
      headerText: '🔐 Security Update',
      appUrl: _appUrl,
      applicationName: _appName,
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          The security policy for <strong style="color:#111827;">${orgName}</strong> has been updated to enhance protection.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Policy Changes:</strong><br/>
            <ul style="margin:8px 0;padding-left:20px;color:#4b5563;">
              ${changesHTML}
            </ul>
            <br/>
            <span style="color:#6b7280;">Updated By:</span> <strong style="color:#111827;">${updatedBy || 'Administrator'}</strong><br/>
            <span style="color:#6b7280;">Effective Date:</span> <strong style="color:#111827;">${effectiveDate ? new Date(effectiveDate).toLocaleDateString() : 'Immediately'}</strong>
          </td></tr>
        </table>
        
        ${
          requiresAction
            ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fee2e2;border-left:4px solid #dc2626;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#7f1d1d;">
            <strong>⚠️ Action Required:</strong><br/>
            You may need to update your security settings or re-authenticate to comply with the new policy.
          </td></tr>
        </table>
        `
            : ''
        }
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          These changes help keep your organization secure and compliant.
        </p>
      `,
      ctaButton: {
        url: `${_appUrl}/organizations/${orgId}/security`,
        text: 'View Security Settings',
        color: '#8b5cf6'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * ORG_API_KEY_CREATED Email Template
 * Sent when: A new API key has been created for the organization
 */
const ORG_API_KEY_CREATED = ({
  orgName,
  orgId,
  keyName,
  keyPrefix,
  createdBy,
  permissions,
  expiresAt,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName
}) => {
  const permissionsHTML =
    permissions && permissions.length > 0
      ? permissions.map(perm => `<li style="margin:4px 0;">${perm}</li>`).join('')
      : '<li>Full API access</li>';

  return {
    subject: `New API Key Created: ${orgName}`,
    html: buildEmailHTML({
      preheader: `A new API key has been created for ${orgName}.`,
      title: 'API Key Created',
      headerBg: '#f59e0b',
      headerText: '🔑 API Key Created',
      appUrl: _appUrl,
      applicationName: _appName,
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          A new API key has been created for <strong style="color:#111827;">${orgName}</strong>.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">API Key Details:</strong><br/>
            <span style="color:#6b7280;">Key Name:</span> <strong style="color:#111827;">${keyName}</strong><br/>
            <span style="color:#6b7280;">Key Prefix:</span> <strong style="color:#111827;font-family:monospace;">${keyPrefix}...</strong><br/>
            <span style="color:#6b7280;">Created By:</span> <strong style="color:#111827;">${createdBy || 'Administrator'}</strong><br/>
            ${expiresAt ? `<span style="color:#6b7280;">Expires:</span> <strong style="color:#dc2626;">${new Date(expiresAt).toLocaleDateString()}</strong><br/>` : ''}
          </td></tr>
        </table>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Permissions:</strong><br/>
            <ul style="margin:8px 0;padding-left:20px;color:#4b5563;">
              ${permissionsHTML}
            </ul>
          </td></tr>
        </table>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#92400e;">
            <strong>🔒 Security Notice:</strong><br/>
            Keep this API key secure. It provides programmatic access to your organization. Never share it publicly or commit it to version control.
          </td></tr>
        </table>
      `,
      ctaButton: {
        url: `${_appUrl}/organizations/${orgId}/api-keys`,
        text: 'Manage API Keys',
        color: '#f59e0b'
      },
      footerNote: 'This is a security notification for your organization.'
    }),
    attachments: []
  };
};

/**
 * ORG_API_KEY_REVOKED Email Template
 * Sent when: An API key has been revoked
 */
const ORG_API_KEY_REVOKED = ({
  orgName,
  orgId,
  keyName,
  keyPrefix,
  revokedBy,
  revokedAt,
  reason,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName
}) => {
  return {
    subject: `API Key Revoked: ${orgName}`,
    html: buildEmailHTML({
      preheader: `An API key has been revoked for ${orgName}.`,
      title: 'API Key Revoked',
      headerBg: '#dc2626',
      headerText: '🔒 API Key Revoked',
      appUrl: _appUrl,
      applicationName: _appName,
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          An API key has been revoked for <strong style="color:#111827;">${orgName}</strong>.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fee2e2;border-left:4px solid #dc2626;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#7f1d1d;">
            <strong>⚠️ Access Revoked:</strong><br/>
            This API key is no longer valid and cannot be used for API requests. Any applications using this key will lose access.
          </td></tr>
        </table>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <span style="color:#6b7280;">Key Name:</span> <strong style="color:#111827;">${keyName}</strong><br/>
            <span style="color:#6b7280;">Key Prefix:</span> <strong style="color:#111827;font-family:monospace;">${keyPrefix}...</strong><br/>
            ${reason ? `<span style="color:#6b7280;">Reason:</span> <strong style="color:#111827;">${reason}</strong><br/>` : ''}
            <span style="color:#6b7280;">Revoked By:</span> <strong style="color:#111827;">${revokedBy || 'Administrator'}</strong><br/>
            <span style="color:#6b7280;">Date:</span> <strong style="color:#111827;">${new Date(revokedAt).toLocaleString()}</strong>
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          If you need API access, create a new key in your organization settings.
        </p>
      `,
      ctaButton: {
        url: `${_appUrl}/organizations/${orgId}/api-keys`,
        text: 'Manage API Keys',
        color: '#dc2626'
      },
      footerNote: 'This is a security notification for your organization.'
    }),
    attachments: []
  };
};

/**
 * ORG_DOMAIN_VERIFIED Email Template
 * Sent when: Organization domain has been verified
 */
const ORG_DOMAIN_VERIFIED = ({
  orgName,
  orgId,
  domain,
  verifiedBy,
  verifiedAt,
  benefits,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName
}) => {
  const benefitsHTML =
    benefits && benefits.length > 0
      ? benefits.map(benefit => `<li style="margin:4px 0;">✓ ${benefit}</li>`).join('')
      : '<li>Enhanced organization features</li><li>Email domain authentication</li><li>Increased security and trust</li>';

  return {
    subject: `Domain Verified: ${domain}`,
    html: buildEmailHTML({
      preheader: `Domain ${domain} has been verified for ${orgName}.`,
      title: 'Domain Verified',
      headerBg: '#10b981',
      headerText: '✅ Domain Verified',
      appUrl: _appUrl,
      applicationName: _appName,
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          The domain <strong style="color:#111827;font-family:monospace;">${domain}</strong> has been successfully verified for <strong style="color:#111827;">${orgName}</strong>!
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#d1fae5;border-left:4px solid #10b981;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#065f46;">
            <strong>🎉 Congratulations!</strong><br/>
            Your domain is now verified. This enables additional features and security for your organization.
          </td></tr>
        </table>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">What You Can Do Now:</strong><br/>
            <ul style="margin:8px 0;padding-left:20px;color:#4b5563;">
              ${benefitsHTML}
            </ul>
            <br/>
            <span style="color:#6b7280;">Verified By:</span> <strong style="color:#111827;">${verifiedBy || 'Administrator'}</strong><br/>
            <span style="color:#6b7280;">Verified At:</span> <strong style="color:#111827;">${new Date(verifiedAt).toLocaleString()}</strong>
          </td></tr>
        </table>
      `,
      ctaButton: {
        url: `${_appUrl}/organizations/${orgId}/domains`,
        text: 'Manage Domains',
        color: '#10b981'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * ORG_DOMAIN_UNVERIFIED Email Template
 * Sent when: Organization domain verification has failed or been removed
 */
const ORG_DOMAIN_UNVERIFIED = ({
  orgName,
  orgId,
  domain,
  reason,
  unverifiedBy,
  unverifiedAt,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaPath = null
}) => {
  return {
    subject: `Domain Verification Lost: ${domain}`,
    html: buildEmailHTML({
      preheader: `Domain ${domain} is no longer verified for ${orgName}.`,
      title: 'Domain Unverified',
      headerBg: '#f59e0b',
      headerText: '⚠️ Domain Unverified',
      appUrl: _appUrl,
      applicationName: _appName,
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          The domain <strong style="color:#111827;font-family:monospace;">${domain}</strong> is no longer verified for <strong style="color:#111827;">${orgName}</strong>.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#92400e;">
            <strong>⚠️ Action Required:</strong><br/>
            ${reason || 'Your domain verification has been removed. Some features may be unavailable until you re-verify your domain.'}
          </td></tr>
        </table>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <span style="color:#6b7280;">Domain:</span> <strong style="color:#111827;font-family:monospace;">${domain}</strong><br/>
            <span style="color:#6b7280;">Status Changed By:</span> <strong style="color:#111827;">${unverifiedBy || 'System'}</strong><br/>
            <span style="color:#6b7280;">Date:</span> <strong style="color:#111827;">${new Date(unverifiedAt).toLocaleString()}</strong>
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          To restore full functionality, please re-verify your domain in organization settings.
        </p>
      `,
      ctaButton: {
        url: `${_appUrl}/organizations/${orgId}/domains`,
        text: 'Verify Domain',
        color: '#f59e0b'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * ORG_BILLING_UPDATED Email Template
 * Sent when: Organization billing information has been updated
 */
const ORG_BILLING_UPDATED = ({
  orgName,
  orgId,
  updatedBy,
  updatedFields,
  nextBillingDate,
  amount,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName
}) => {
  const fieldsHTML =
    updatedFields && updatedFields.length > 0
      ? updatedFields.map(field => `<li style="margin:4px 0;">${field}</li>`).join('')
      : '<li>Billing information updated</li>';

  return {
    subject: `Billing Updated: ${orgName}`,
    html: buildEmailHTML({
      preheader: `Billing information for ${orgName} has been updated.`,
      title: 'Billing Updated',
      headerBg: '#ec4899',
      headerText: '💳 Billing Updated',
      appUrl: _appUrl,
      applicationName: _appName,
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          The billing information for <strong style="color:#111827;">${orgName}</strong> has been updated.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Updated Information:</strong><br/>
            <ul style="margin:8px 0;padding-left:20px;color:#4b5563;">
              ${fieldsHTML}
            </ul>
            <br/>
            ${nextBillingDate ? `<span style="color:#6b7280;">Next Billing Date:</span> <strong style="color:#111827;">${new Date(nextBillingDate).toLocaleDateString()}</strong><br/>` : ''}
            ${amount ? `<span style="color:#6b7280;">Amount:</span> <strong style="color:#111827;">$${amount}</strong><br/>` : ''}
            <span style="color:#6b7280;">Updated By:</span> <strong style="color:#111827;">${updatedBy || 'Administrator'}</strong>
          </td></tr>
        </table>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#d1fae5;border-left:4px solid #10b981;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#065f46;">
            <strong>✓ All Set!</strong><br/>
            Your billing information has been updated successfully. Your subscription will continue without interruption.
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          You can view your billing history and manage payment methods anytime.
        </p>
      `,
      ctaButton: {
        url: `${_appUrl}/organizations/${orgId}/billing`,
        text: 'View Billing',
        color: '#ec4899'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * ORG_COMPLIANCE_AUDIT_COMPLETED Email Template
 * Sent when: Compliance audit has been completed for the organization
 */
const ORG_COMPLIANCE_AUDIT_COMPLETED = ({
  orgName,
  orgId,
  auditType,
  completedBy,
  completedAt,
  status,
  findings,
  reportUrl,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName
}) => {
  const findingsHTML =
    findings && findings.length > 0
      ? findings.map(finding => `<li style="margin:4px 0;">${finding}</li>`).join('')
      : '<li>No issues found</li>';

  const statusColor =
    status === 'passed' || status === 'compliant'
      ? '#10b981'
      : status === 'failed' || status === 'non-compliant'
        ? '#dc2626'
        : '#f59e0b';
  const statusBg =
    status === 'passed' || status === 'compliant'
      ? '#d1fae5'
      : status === 'failed' || status === 'non-compliant'
        ? '#fee2e2'
        : '#fef3c7';
  const statusText =
    status === 'passed' || status === 'compliant'
      ? '✓ Compliant'
      : status === 'failed' || status === 'non-compliant'
        ? '✗ Non-Compliant'
        : '⚠️ Needs Review';

  return {
    subject: `Compliance Audit Completed: ${orgName}`,
    html: buildEmailHTML({
      preheader: `${auditType} compliance audit for ${orgName} has been completed.`,
      title: 'Audit Completed',
      headerBg: '#8b5cf6',
      headerText: '📋 Audit Complete',
      appUrl: _appUrl,
      applicationName: _appName,
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          A compliance audit has been completed for <strong style="color:#111827;">${orgName}</strong>.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:${statusBg};border-left:4px solid ${statusColor};border-radius:4px;">
          <tr><td style="font-size:16px;line-height:24px;font-weight:700;color:${statusColor};">
            ${statusText}
          </td></tr>
        </table>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Audit Details:</strong><br/>
            <span style="color:#6b7280;">Audit Type:</span> <strong style="color:#111827;">${auditType || 'Compliance Audit'}</strong><br/>
            <span style="color:#6b7280;">Status:</span> <strong style="color:${statusColor};">${status || 'Completed'}</strong><br/>
            <span style="color:#6b7280;">Completed By:</span> <strong style="color:#111827;">${completedBy || 'Compliance Team'}</strong><br/>
            <span style="color:#6b7280;">Date:</span> <strong style="color:#111827;">${new Date(completedAt).toLocaleString()}</strong>
          </td></tr>
        </table>
        
        ${
          findings && findings.length > 0
            ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Key Findings:</strong><br/>
            <ul style="margin:8px 0;padding-left:20px;color:#4b5563;">
              ${findingsHTML}
            </ul>
          </td></tr>
        </table>
        `
            : ''
        }
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          ${reportUrl ? 'Download the full audit report using the button below.' : 'A detailed report is available in your organization dashboard.'}
        </p>
      `,
      ctaButton: {
        url: reportUrl || `${_appUrl}/organizations/${orgId}/compliance`,
        text: reportUrl ? 'Download Report' : 'View Compliance',
        color: '#8b5cf6'
      },
      footerNote: 'This audit report is confidential and intended for authorized personnel only.'
    }),
    attachments: []
  };
};

// =====================================================================================
// 📧 ALL EMAIL TEMPLATES (179 Total)
// =====================================================================================

/**
 * otpEmailTemplate - Your One-Time Password (OTP)
 */
const otpEmailTemplate = ({
  name,
  username,
  otp,
  purpose = 'verification',
  expiryMinutes = 10
}) => {
  const displayName = name || username || 'User';
  const purposeLabel =
    purpose === 'login'
      ? 'sign in'
      : purpose === 'mfa'
        ? 'two-factor authentication'
        : purpose === 'reset'
          ? 'password reset'
          : purpose === 'verification'
            ? 'email verification'
            : purpose;
  return {
    subject: `Your one-time code: ${otp}`,
    html: buildEmailHTML({
      preheader: `Your OTP is ${otp}. Valid for ${expiryMinutes} minutes. Do not share it.`,
      title: 'Your One-Time Code',
      headerBg: '#7c3aed',
      headerText: '🔐 Your Verification Code',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">Hello <strong>${displayName}</strong>,</p>
        <p style="margin:0 0 20px 0;color:#4b5563;">
          Use the code below to complete your <strong>${purposeLabel}</strong>. It is valid for <strong>${expiryMinutes} minutes</strong>.
        </p>

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:28px 0;">
          <tr><td align="center">
            <div style="background:linear-gradient(135deg,#7c3aed,#4f46e5);display:inline-block;padding:20px 48px;border-radius:12px;letter-spacing:10px;font-size:38px;font-weight:800;color:#fff;font-family:'Courier New',monospace;">
              ${otp}
            </div>
          </td></tr>
        </table>

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:16px 0;padding:14px 18px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:6px;">
          <tr><td style="font-size:13px;color:#92400e;">
            ⏰ This code expires in <strong>${expiryMinutes} minutes</strong>. Never share it with anyone — not even our support team.
          </td></tr>
        </table>

        <p style="margin:20px 0 0 0;color:#9ca3af;font-size:13px;">If you didn't request this code, you can safely ignore this email.</p>
      `,
      footerNote: 'We will never ask for your OTP. Keep it secret.'
    }),
    attachments: []
  };
};

/**
 * welcomeEmailTemplate - Welcome to Our App!
 */
const welcomeEmailTemplate = (data = {}) => {
  return {
    subject: `Welcome to ${applicaionName || 'Our App'}!`,
    html: buildEmailHTML({
      preheader: `Welcome to ${applicaionName || 'Our App'}!`,
      title: `Welcome to ${applicaionName || 'Our App'}!`,
      headerBg: '#10b981',
      headerText: `🎉 Welcome to ${applicaionName || 'Our App'}!`,
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${data.username || data.name || 'User'}</strong>,
        </p>

        <p style="margin:0 0 16px 16px;color:#4b5563;">
          We're excited to have you onboard! Your account has been successfully created 
          and you're all set to explore everything we offer.
        </p>

        <p style="margin:0 0 16px 0;color:#4b5563;">
          Here’s what you can do next:
        </p>

        <ul style="margin:0 0 16px 20px;padding:0;color:#4b5563;">
          <li>✔️ Access your dashboard and manage your profile</li>
          <li>✔️ Explore powerful tools and features</li>
          <li>✔️ Customize preferences to improve your experience</li>
        </ul>

        ${
          data.extraMessage
            ? `
              <p style="margin:16px 0;color:#4b5563;">
                ${data.extraMessage}
              </p>
            `
            : ''
        }

        <p style="margin:24px 0 0 0;color:#4b5563;">
          If you have any questions, feel free to reach out — we're always here to help.
        </p>

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Cheers,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: data.ctaUrl
        ? {
            text: data.ctaText || 'Get Started',
            url: data.ctaUrl
          }
        : null,
      footerNote: `If you didn’t create an account with us, you can safely ignore this email.`
    }),
    attachments: []
  };
};

/**
 * emailVerificationTemplate - Modern Email Verification
 */
const EMAIL_VERIFICATION_SEND = ({ username, token, security, appUrl: _appUrl = appUrl, applicationName: _appName = applicaionName }) => {
  const verifyUrl = `${_appUrl || '#'}/verify-email?token=${token}`;

  return {
    subject: `Verify Your Email Address`,
    html: buildEmailHTML({
      preheader: `Verify your email to continue using ${_appName || 'our service'}.`,
      title: 'Verify Your Email',
      headerBg: '#2563eb',
      headerText: '📧 Verify Your Email',
      applicationName: _appName,
      appUrl: _appUrl,

      alert: {
        type: 'info',
        text: `You're almost there! Please confirm this email address to activate your account.`
      },

      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>

        <p style="margin:0 0 18px 0;color:#4b5563;">
          Thank you for signing up! Please verify your email address to unlock full access.
        </p>

        <p style="margin:0 0 24px 0;color:#4b5563;">
          Click the button below to confirm your email. If you didn’t request this, you can safely ignore this message.
        </p>
      `,

      primaryCTA: {
        url: verifyUrl,
        text: 'Verify Email'
      },

      // secondaryCTA: {
      //   url: verifyUrl,
      //   text: 'Open Verification Link'
      // },

      security, // middleware-provided device/ip/os/browser

      footerNote: `
        If the button doesn’t work, copy & paste the link below:<br/>
        <span style="word-break:break-all">${verifyUrl}</span>
      `
    }),

    attachments: []
  };
};

/**
 * emailVerificationSuccessTemplate - Email Verified Success
 */
const USER_EMAIL_VERIFIED = ({ username }) => {
  const userNameSafe = username || 'User';
  const appName = applicaionName || 'Our App';
  const dashboardUrl = ctaPath ? _appUrl + ctaPath : _appUrl;

  return {
    subject: `Your Email Has Been Verified ✔`,
    html: buildEmailHTML({
      preheader: `Your email has been successfully verified`,
      title: `Email Verified Successfully`,
      headerBg: '#10b981',
      headerText: `🎉 You’re Verified!`,
      alert: {
        type: 'success',
        text: 'Thank you! Your email is now verified and your account is fully active.'
      },
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hi <strong>${userNameSafe}</strong>,
        </p>

        <p style="margin:0 0 18px 0;color:#4b5563;">
          🎉 Congratulations! Your email address has been successfully verified and your ${appName} account is now fully set up.
        </p>

        <p style="margin:0 0 18px 0;color:#4b5563;">
          You now have access to all features and services. We’re excited to have you with us!
        </p>

        <p style="margin:0 0 24px 0;color:#4b5563;">
          If you didn’t request this or have any concerns, our support team is here to help.
        </p>

        <p style="margin-top:24px;color:#4b5563;">
          Cheers,<br/>
          <strong style="color:#111827;">The ${appName} Team</strong>
        </p>
      `,
      primaryCTA: {
        text: 'Go to Dashboard',
        url: dashboardUrl,
        color: '#0ea271'
      },
      // Optional secondary CTA
      // secondaryCTA: {
      //   text: "Manage Account",
      //   url: `${appUrl || frontendUrl || '#'}/account`
      // },
      footerNote: `You’re receiving this because you registered with ${appName}.`
    }),
    attachments: []
  };
};


/**
 * accountDeletedTemplate - Account Deleted
 */
const accountDeletedTemplate = ({ username }) => {
  return {
    subject: `Account Deleted`,
    html: buildEmailHTML({
      preheader: `Account Deleted`,
      title: 'Account Deleted',
      headerBg: '#2563eb',
      headerText: '📧 Account Deleted',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * subscriptionUpdatedTemplate - Subscription Updated
 */
const subscriptionUpdatedTemplate = ({ username, plan }) => {
  return {
    subject: `Subscription Updated`,
    html: buildEmailHTML({
      preheader: `Subscription Updated`,
      title: 'Subscription Updated',
      headerBg: '#8b5cf6',
      headerText: '📋 Subscription Updated',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your subscription status has been updated.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};




/**
 * passwordExpiryReminderTemplate - Password Expiry Reminder
 */
const passwordExpiryReminderTemplate = ({ username, resetLink }) => {
  return {
    subject: `Password Expiry Reminder`,
    html: buildEmailHTML({
      preheader: `Password Expiry Reminder`,
      title: 'Password Expiry Reminder',
      headerBg: '#ef4444',
      headerText: '🔑 Password Expiry Reminder',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: 'Never share this information with anyone.'
    }),
    attachments: []
  };
};
const NEWSLETTER_WELCOME = ({ email, companyName, unsubscribeUrl }) => {
  return {
    subject: `Welcome to ${companyName} Newsletter! 🎉`,
    html: buildEmailHTML({
      preheader: `Thanks for joining ${companyName} updates and insights`,
      title: 'Welcome to Our Newsletter',
      headerBg: '#8b5cf6',
      headerText: '📬 Welcome Aboard!',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>Newsletter Subscriber</strong>,
        </p>

        <p style="margin:0 0 24px 0;color:#4b5563;">
          Thank you for subscribing to <strong>${companyName}</strong> newsletter! 
          You'll receive our latest updates, tips, and industry insights.
        </p>

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:24px;background:#f3e8ff;border:1px solid #ddd6fe;border-radius:8px;">
          <tr>
            <td style="font-size:14px;line-height:20px;text-align:center;">
              <strong style="color:#6d28d9;">Subscription Details:</strong><br/>
              <span style="color:#a78bfa;">📧 Email:</span>
              <strong style="color:#6d28d9;">${email}</strong><br/>
              <span style="color:#a78bfa;">🏢 Company:</span>
              <strong style="color:#6d28d9;">${companyName}</strong>
            </td>
          </tr>
        </table>

        <p style="margin:0 0 16px 0;color:#4b5563;">
          Here's what you'll receive:
        </p>

        <div style="margin:24px 0;">
          <div style="padding:16px;margin-bottom:12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
            <strong style="color:#3730a3;">🚀 Product Updates</strong><br/>
            <span style="color:#64748b;font-size:14px;">New features and platform improvements</span>
          </div>
          <div style="padding:16px;margin-bottom:12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
            <strong style="color:#3730a3;">💡 Development Tips</strong><br/>
            <span style="color:#64748b;font-size:14px;">Best practices for Next.js, Express.js & more</span>
          </div>
          <div style="padding:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
            <strong style="color:#3730a3;">📊 Industry Insights</strong><br/>
            <span style="color:#64748b;font-size:14px;">Trends in SaaS, e-commerce, and web development</span>
          </div>
        </div>

        <p style="margin:24px 0 0 0;color:#4b5563;">
          You can unsubscribe anytime using the link below.
        </p>
      `,
      ctaButton: {
        url: `${env.FRONTEND_URL}/blog`,
        text: 'Explore Latest Articles →',
        color: '#8b5cf6'
      },
      secondaryCta: {
        url: `${env.FRONTEND_URL}`,
        text: 'Visit Dashboard'
      },
      footerNote: `Happy coding! 🎉 • You're receiving this because you subscribed to ${companyName} newsletter.`
    }),
    attachments: []
  };
};

/**
 * newsletterTemplate - Newsletter Update
 */
const newsletterTemplate = ({ title, content, ctaLink }) => {
  return {
    subject: `Newsletter Update`,
    html: buildEmailHTML({
      preheader: `Newsletter Update`,
      title: 'Newsletter Update',
      headerBg: '#2563eb',
      headerText: '📧 Newsletter Update',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>User</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};




/**
 * giftCardReceivedTemplate - Gift Card Received
 */
const giftCardReceivedTemplate = ({ username, sender, amount, redeemCode }) => {
  return {
    subject: `Gift Card Received`,
    html: buildEmailHTML({
      preheader: `Gift Card Received`,
      title: 'Gift Card Received',
      headerBg: '#ec4899',
      headerText: '🎁 Gift Card Received',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};




/**
 * loyaltyPointsEarnedTemplate - Loyalty Points Earned
 */
const loyaltyPointsEarnedTemplate = ({ username, points }) => {
  return {
    subject: `Loyalty Points Earned`,
    html: buildEmailHTML({
      preheader: `Loyalty Points Earned`,
      title: 'Loyalty Points Earned',
      headerBg: '#f59e0b',
      headerText: '⭐ Loyalty Points Earned',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * dataExportRequestTemplate - Data Export Request
 */
const dataExportRequestTemplate = ({ username, requestDate }) => {
  return {
    subject: `Data Export Request`,
    html: buildEmailHTML({
      preheader: `Data Export Request`,
      title: 'Data Export Request',
      headerBg: '#2563eb',
      headerText: '📧 Data Export Request',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};


/**
 * trialExpiredTemplate - Trial Expired
 */
const trialExpiredTemplate = ({ username, upgradeLink }) => {
  return {
    subject: `Trial Expired`,
    html: buildEmailHTML({
      preheader: `Trial Expired`,
      title: 'Trial Expired',
      headerBg: '#2563eb',
      headerText: '📧 Trial Expired',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};





/**
 * newFeatureAnnouncementTemplate - New Feature Announcement
 */
const newFeatureAnnouncementTemplate = ({ username, featureName, featureLink }) => {
  return {
    subject: `New Feature Announcement`,
    html: buildEmailHTML({
      preheader: `New Feature Announcement`,
      title: 'New Feature Announcement',
      headerBg: '#2563eb',
      headerText: '📧 New Feature Announcement',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};



const twoFactorCompletedTemplate = ({ username }) => {
  return {
    subject: `Two-Factor Authentication Enabled`,
    html: buildEmailHTML({
      preheader: `Two-Factor Authentication Enabled Successfully`,
      title: 'Two-Factor Authentication Enabled',
      headerBg: '#059669',
      headerText: '🔐 Security Upgrade Complete',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>

        <p style="margin:0 0 16px 0;color:#4b5563;">
          Great news! Two-Factor Authentication (2FA) has been successfully enabled on your account.
          This adds an additional verification step each time you sign in, helping keep your account
          more secure from unauthorized access.
        </p>

        <p style="margin:0 0 16px 0;color:#4b5563;">
          If you did not make this change or believe this was done in error, please reset your
          security settings or contact our support team immediately.
        </p>

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Stay secure,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};


/**
 * backupCodesTemplate - Your Backup Login Codes
 */
const backupCodesTemplate = ({ name, username, codes = [] }) => {
  const displayName = name || username || 'User';
  const codeRows = Array.isArray(codes)
    ? codes
        .map(
          c =>
            `<tr><td style="padding:6px 16px;font-family:'Courier New',monospace;font-size:16px;font-weight:700;letter-spacing:3px;color:#1e1b4b;">${c}</td></tr>`
        )
        .join('')
    : '';
  return {
    subject: `Your 2FA Backup Codes`,
    html: buildEmailHTML({
      preheader: `Save these backup codes somewhere safe — you'll need them if you lose your authenticator.`,
      title: 'Your Backup Codes',
      headerBg: '#7c3aed',
      headerText: '🔐 Your Backup Login Codes',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${displayName}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Here are your two-factor authentication backup codes. Each code can only be used <strong>once</strong>.
          Store them somewhere safe — you'll need one if you ever lose access to your authenticator app.
        </p>

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px auto;background:#f5f3ff;border:2px solid #7c3aed;border-radius:8px;overflow:hidden;">
          <tbody>
            ${codeRows || '<tr><td style="padding:12px 16px;color:#6b7280;">No codes provided.</td></tr>'}
          </tbody>
        </table>

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fee2e2;border-left:4px solid #dc2626;border-radius:4px;">
          <tr><td style="font-size:14px;color:#7f1d1d;">
            <strong>⚠️ Keep these codes safe</strong><br/>
            • Each code can only be used once.<br/>
            • Store them in a secure location — not in your email.<br/>
            • Never share these codes with anyone.
          </td></tr>
        </table>
      `,
      ctaButton: null,
      footerNote: 'Treat backup codes like passwords — keep them private and secure.'
    }),
    attachments: []
  };
};


/**
 * emailChangedTemplate - Email Address Changed
 */
const emailChangedTemplate = ({ username, oldEmail, newEmail }) => {
  return {
    subject: `Email Address Changed`,
    html: buildEmailHTML({
      preheader: `Email Address Changed`,
      title: 'Email Address Changed',
      headerBg: '#2563eb',
      headerText: '📧 Email Address Changed',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * loginAlertTemplate - Login Alert
 */
const loginAlertTemplate = ({ username, device, location, time }) => {
  return {
    subject: `Login Alert`,
    html: buildEmailHTML({
      preheader: `Login Alert`,
      title: 'Login Alert',
      headerBg: '#dc2626',
      headerText: '⚠️ Login Alert',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We detected unusual activity that requires your attention.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};



/**
 * accountReactivationTemplate - Reactivate Your Account
 */
const accountReactivationTemplate = ({ username, reactivateLink }) => {
  return {
    subject: `Reactivate Your Account`,
    html: buildEmailHTML({
      preheader: `Reactivate Your Account`,
      title: 'Reactivate Your Account',
      headerBg: '#2563eb',
      headerText: '📧 Reactivate Your Account',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * accountSuspendedTemplate - Account Suspended
 */
const accountSuspendedTemplate = ({ username, reason, supportLink }) => {
  return {
    subject: `Account Suspended`,
    html: buildEmailHTML({
      preheader: `Account Suspended`,
      title: 'Account Suspended',
      headerBg: '#dc2626',
      headerText: '🔐 Account Suspended',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * consentRequiredTemplate - Consent Required
 */
const consentRequiredTemplate = ({ username, consentLink }) => {
  return {
    subject: `Consent Required`,
    html: buildEmailHTML({
      preheader: `Consent Required`,
      title: 'Consent Required',
      headerBg: '#2563eb',
      headerText: '📧 Consent Required',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * securitySettingsUpdatedTemplate - Security Settings Updated
 */
const securitySettingsUpdatedTemplate = ({ username, setting }) => {
  return {
    subject: `Security Settings Updated`,
    html: buildEmailHTML({
      preheader: `Security Settings Updated`,
      title: 'Security Settings Updated',
      headerBg: '#2563eb',
      headerText: '📧 Security Settings Updated',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: 'Never share this information with anyone.'
    }),
    attachments: []
  };
};

/**
 * failedLoginAttemptsTemplate - Failed Login Attempts Detected
 */
const failedLoginAttemptsTemplate = ({ username, attempts, lockLink }) => {
  return {
    subject: `Failed Login Attempts Detected`,
    html: buildEmailHTML({
      preheader: `Failed Login Attempts Detected`,
      title: 'Failed Login Attempts Detected',
      headerBg: '#2563eb',
      headerText: '📧 Failed Login Attempts Detected',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};


/**
 * logoutAllDevicesTemplate - Logged Out From All Devices
 */
const logoutAllDevicesTemplate = ({
  name,
  username,
  time,
  timestamp,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaPath = null
}) => {
  const displayName = name || username || 'User';
  const displayTime = time || timestamp;
  return {
    subject: `You've Been Signed Out of All Devices`,
    html: buildEmailHTML({
      preheader: `All active sessions on your account have been terminated.`,
      title: 'Signed Out of All Devices',
      headerBg: '#2563eb',
      headerText: '🚪 Signed Out of All Devices',
      appUrl: _appUrl,
      applicationName: _appName,
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${displayName}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          All active sessions on your account have been terminated. You have been signed out of all devices.
        </p>

        ${displayTime ? `<p style="margin:0 0 16px 0;color:#6b7280;font-size:13px;">This action was performed on: <strong>${new Date(displayTime).toLocaleString()}</strong></p>` : ''}

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:4px;">
          <tr><td style="font-size:14px;color:#92400e;">
            <strong>If this wasn't you</strong><br/>
            Someone may have unauthorized access to your account. Sign in immediately and change your password.
          </td></tr>
        </table>
      `,
      ctaButton: {
        url: ctaPath ? _appUrl + ctaPath : _appUrl,
        text: 'Sign In Again',
        color: '#2563eb'
      },
      footerNote: "Never share your credentials. We'll never ask for your password."
    }),
    attachments: []
  };
};

/**
 * trustedDeviceAddedTemplate - New Trusted Device Added
 */
const trustedDeviceAddedTemplate = ({ username, device, location }) => {
  return {
    subject: `New Trusted Device Added`,
    html: buildEmailHTML({
      preheader: `New Trusted Device Added`,
      title: 'New Trusted Device Added',
      headerBg: '#2563eb',
      headerText: '📧 New Trusted Device Added',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * phoneVerificationTemplate - Verify Your Phone Number
 */
const phoneVerificationTemplate = ({ username, phone, verificationCode, expiryMinutes }) => {
  return {
    subject: `Verify Your Phone Number`,
    html: buildEmailHTML({
      preheader: `Verify Your Phone Number`,
      title: 'Verify Your Phone Number',
      headerBg: '#2563eb',
      headerText: '📧 Verify Your Phone Number',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * emailPhoneVerificationReminderTemplate - Reminder: Verify Your Email & Phone
 */
const emailPhoneVerificationReminderTemplate = ({ username }) => {
  return {
    subject: `Reminder: Verify Your Email & Phone`,
    html: buildEmailHTML({
      preheader: `Reminder: Verify Your Email & Phone`,
      title: 'Reminder: Verify Your Email & Phone',
      headerBg: '#2563eb',
      headerText: '📧 Reminder: Verify Your Email & Phone',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * phoneNumberChangeRequestTemplate - Confirm Phone Number Change
 */
const phoneNumberChangeRequestTemplate = ({
  username,
  newPhone,
  confirmationCode,
  expiryMinutes
}) => {
  return {
    subject: `Confirm Phone Number Change`,
    html: buildEmailHTML({
      preheader: `Confirm Phone Number Change`,
      title: 'Confirm Phone Number Change',
      headerBg: '#2563eb',
      headerText: '📧 Confirm Phone Number Change',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * phoneNumberChangeConfirmationTemplate - Phone Number Updated Successfully
 */
const phoneNumberChangeConfirmationTemplate = ({
  username,
  updatedPhone,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `Phone Number Updated Successfully`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Phone Number Updated Successfully`,
      title: 'Phone Number Updated Successfully',
      headerBg: '#3b82f6',
      headerText: '✉️ Phone Number Updated Successfully',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Please verify your information by clicking the button below.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: {
        url: ctaUrl || (ctaPath ? _appUrl + ctaPath : `${_appUrl}/action`),
        text: 'Take Action',
        color: '#3b82f6'
      },
      footerNote: null
    }),
    attachments: []
  };
};



// --- 60 templates completed ---

/**
 * loginAttemptLimitExceededTemplate - Account Locked Due to Failed Logins
 */
const loginAttemptLimitExceededTemplate = ({ username }) => {
  return {
    subject: `Account Locked Due to Failed Logins`,
    html: buildEmailHTML({
      preheader: `Account Locked Due to Failed Logins`,
      title: 'Account Locked Due to Failed Logins',
      headerBg: '#2563eb',
      headerText: '📧 Account Locked Due to Failed Logins',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * twoFactorEnabledDisabledNotificationTemplate - Two-Factor Authentication Status Changed
 */
const twoFactorEnabledDisabledNotificationTemplate = ({ username, status }) => {
  return {
    subject: `Two-Factor Authentication Status Changed`,
    html: buildEmailHTML({
      preheader: `Two-Factor Authentication Status Changed`,
      title: 'Two-Factor Authentication Status Changed',
      headerBg: '#7c3aed',
      headerText: '🔐 Two-Factor Authentication Status Changed',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * accountVerificationReminderTemplate - Reminder: Verify Your Account
 */
const accountVerificationReminderTemplate = ({ username }) => {
  return {
    subject: `Reminder: Verify Your Account`,
    html: buildEmailHTML({
      preheader: `Reminder: Verify Your Account`,
      title: 'Reminder: Verify Your Account',
      headerBg: '#2563eb',
      headerText: '📧 Reminder: Verify Your Account',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};


/**
 * backupEmailAddedRemovedTemplate - Backup Email Address Updated
 */
const backupEmailAddedRemovedTemplate = ({ username, action }) => {
  return {
    subject: `Backup Email Address Updated`,
    html: buildEmailHTML({
      preheader: `Backup Email Address Updated`,
      title: 'Backup Email Address Updated',
      headerBg: '#2563eb',
      headerText: '📧 Backup Email Address Updated',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * trustedDeviceManagementUpdateTemplate - Trusted Device List Updated
 */
const trustedDeviceManagementUpdateTemplate = ({ username }) => {
  return {
    subject: `Trusted Device List Updated`,
    html: buildEmailHTML({
      preheader: `Trusted Device List Updated`,
      title: 'Trusted Device List Updated',
      headerBg: '#2563eb',
      headerText: '📧 Trusted Device List Updated',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * multiFactorAuthenticationSetupReminderTemplate - Reminder: Set Up Multi-Factor Authentication
 */
const multiFactorAuthenticationSetupReminderTemplate = ({ username }) => {
  return {
    subject: `Reminder: Set Up Multi-Factor Authentication`,
    html: buildEmailHTML({
      preheader: `Reminder: Set Up Multi-Factor Authentication`,
      title: 'Reminder: Set Up Multi-Factor Authentication',
      headerBg: '#7c3aed',
      headerText: '🔐 Reminder: Set Up Multi-Factor Authent...',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * secondaryPhoneVerificationTemplate - Verify Secondary Phone Number
 */
const secondaryPhoneVerificationTemplate = ({ username, verificationCode, expiryMinutes }) => {
  return {
    subject: `Verify Secondary Phone Number`,
    html: buildEmailHTML({
      preheader: `Verify Secondary Phone Number`,
      title: 'Verify Secondary Phone Number',
      headerBg: '#2563eb',
      headerText: '📧 Verify Secondary Phone Number',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * identityVerificationRequestTemplate - Identity Verification Required
 */
const identityVerificationRequestTemplate = ({ username }) => {
  return {
    subject: `Identity Verification Required`,
    html: buildEmailHTML({
      preheader: `Identity Verification Required`,
      title: 'Identity Verification Required',
      headerBg: '#2563eb',
      headerText: '📧 Identity Verification Required',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * identityVerificationResultTemplate - Identity Verification Result
 */
const identityVerificationResultTemplate = ({ username, result }) => {
  return {
    subject: `Identity Verification Result`,
    html: buildEmailHTML({
      preheader: `Identity Verification Result`,
      title: 'Identity Verification Result',
      headerBg: '#2563eb',
      headerText: '📧 Identity Verification Result',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * accountAccessRevokedTemplate - Temporary Account Access Revoked
 */
const accountAccessRevokedTemplate = ({ username }) => {
  return {
    subject: `Temporary Account Access Revoked`,
    html: buildEmailHTML({
      preheader: `Temporary Account Access Revoked`,
      title: 'Temporary Account Access Revoked',
      headerBg: '#dc2626',
      headerText: '🔐 Temporary Account Access Revoked',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * passwordStrengthWarningTemplate - Password Strength Warning
 */
const passwordStrengthWarningTemplate = ({ username }) => {
  return {
    subject: `Password Strength Warning`,
    html: buildEmailHTML({
      preheader: `Password Strength Warning`,
      title: 'Password Strength Warning',
      headerBg: '#ef4444',
      headerText: '🔑 Password Strength Warning',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We detected unusual activity that requires your attention.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: 'Never share this information with anyone.'
    }),
    attachments: []
  };
};

/**
 * accountMergeConfirmationTemplate - Accounts Merged Successfully
 */
const accountMergeConfirmationTemplate = ({
  username,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `Accounts Merged Successfully`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Accounts Merged Successfully`,
      title: 'Accounts Merged Successfully',
      headerBg: '#3b82f6',
      headerText: '✉️ Accounts Merged Successfully',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Please verify your information by clicking the button below.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: {
        url: ctaUrl || (ctaPath ? _appUrl + ctaPath : `${_appUrl}/action`),
        text: 'Take Action',
        color: '#3b82f6'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * socialLoginConnectionTemplate - Social Login Connection Updated
 */
const socialLoginConnectionTemplate = ({ username, action }) => {
  return {
    subject: `Social Login Connection Updated`,
    html: buildEmailHTML({
      preheader: `Social Login Connection Updated`,
      title: 'Social Login Connection Updated',
      headerBg: '#2563eb',
      headerText: '📧 Social Login Connection Updated',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * wishlistReminderTemplate - Reminder: Items in Your Wishlist
 */
const wishlistReminderTemplate = ({ username, wishlistItems }) => {
  return {
    subject: `Reminder: Items in Your Wishlist`,
    html: buildEmailHTML({
      preheader: `Reminder: Items in Your Wishlist`,
      title: 'Reminder: Items in Your Wishlist',
      headerBg: '#f59e0b',
      headerText: '🛒 Reminder: Items in Your Wishlist',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * wishlistBackInStockTemplate - Good News! Wishlist Item Back in Stock
 */
const wishlistBackInStockTemplate = ({ username, itemName }) => {
  return {
    subject: `Good News! Wishlist Item Back in Stock`,
    html: buildEmailHTML({
      preheader: `Good News! Wishlist Item Back in Stock`,
      title: 'Good News! Wishlist Item Back in Stock',
      headerBg: '#f59e0b',
      headerText: '🛒 Good News! Wishlist Item Back in Stock',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * wishlistPriceDropAlertTemplate - Price Drop Alert on Wishlist Item
 */
const wishlistPriceDropAlertTemplate = ({ username, itemName, newPrice }) => {
  return {
    subject: `Price Drop Alert on Wishlist Item`,
    html: buildEmailHTML({
      preheader: `Price Drop Alert on Wishlist Item`,
      title: 'Price Drop Alert on Wishlist Item',
      headerBg: '#dc2626',
      headerText: '⚠️ Price Drop Alert on Wishlist Item',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We detected unusual activity that requires your attention.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * savedForLaterReminderTemplate - Reminder: Items Saved For Later
 */
const savedForLaterReminderTemplate = ({ username, savedItems }) => {
  return {
    subject: `Reminder: Items Saved For Later`,
    html: buildEmailHTML({
      preheader: `Reminder: Items Saved For Later`,
      title: 'Reminder: Items Saved For Later',
      headerBg: '#2563eb',
      headerText: '📧 Reminder: Items Saved For Later',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * cartItemPriceChangedTemplate - Price Changed on Cart Item
 */
const cartItemPriceChangedTemplate = ({ username, itemName, oldPrice, newPrice }) => {
  return {
    subject: `Price Changed on Cart Item`,
    html: buildEmailHTML({
      preheader: `Price Changed on Cart Item`,
      title: 'Price Changed on Cart Item',
      headerBg: '#f59e0b',
      headerText: '🛒 Price Changed on Cart Item',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * wishlistItemDiscontinuedTemplate - Wishlist Item Discontinued
 */
const wishlistItemDiscontinuedTemplate = ({ username, itemName }) => {
  return {
    subject: `Wishlist Item Discontinued`,
    html: buildEmailHTML({
      preheader: `Wishlist Item Discontinued`,
      title: 'Wishlist Item Discontinued',
      headerBg: '#f59e0b',
      headerText: '🛒 Wishlist Item Discontinued',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

// --- 80 templates completed ---

/**
 * cartExpiryNotificationTemplate - Cart Expiry Warning
 */
const cartExpiryNotificationTemplate = ({ username }) => {
  return {
    subject: `Cart Expiry Warning`,
    html: buildEmailHTML({
      preheader: `Cart Expiry Warning`,
      title: 'Cart Expiry Warning',
      headerBg: '#f59e0b',
      headerText: '🛒 Cart Expiry Warning',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * orderProcessingTemplate - Your Order is Being Processed
 */
const orderProcessingTemplate = ({ username, orderId }) => {
  return {
    subject: `Your Order is Being Processed`,
    html: buildEmailHTML({
      preheader: `Your Order is Being Processed`,
      title: 'Your Order is Being Processed',
      headerBg: '#8b5cf6',
      headerText: '📦 Your Order is Being Processed',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your order has been updated. See details below.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * orderPackedTemplate - Your Order is Packed and Ready to Ship
 */
const orderPackedTemplate = ({ username, orderId }) => {
  return {
    subject: `Your Order is Packed and Ready to Ship`,
    html: buildEmailHTML({
      preheader: `Your Order is Packed and Ready to Ship`,
      title: 'Your Order is Packed and Ready to Ship',
      headerBg: '#8b5cf6',
      headerText: '📦 Your Order is Packed and Ready to Ship',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your order has been updated. See details below.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * orderOutForDeliveryTemplate - Your Order is Out for Delivery
 */
const orderOutForDeliveryTemplate = ({ username, orderId }) => {
  return {
    subject: `Your Order is Out for Delivery`,
    html: buildEmailHTML({
      preheader: `Your Order is Out for Delivery`,
      title: 'Your Order is Out for Delivery',
      headerBg: '#8b5cf6',
      headerText: '📦 Your Order is Out for Delivery',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your order has been updated. See details below.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * partialOrderShippedTemplate - Partial Shipment Notification
 */
const partialOrderShippedTemplate = ({ username, orderId }) => {
  return {
    subject: `Partial Shipment Notification`,
    html: buildEmailHTML({
      preheader: `Partial Shipment Notification`,
      title: 'Partial Shipment Notification',
      headerBg: '#8b5cf6',
      headerText: '📦 Partial Shipment Notification',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your order has been updated. See details below.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * orderSplitShipmentTemplate - Order Split into Multiple Shipments
 */
const orderSplitShipmentTemplate = ({ username, orderId }) => {
  return {
    subject: `Order Split into Multiple Shipments`,
    html: buildEmailHTML({
      preheader: `Order Split into Multiple Shipments`,
      title: 'Order Split into Multiple Shipments',
      headerBg: '#8b5cf6',
      headerText: '📦 Order Split into Multiple Shipments',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your order has been updated. See details below.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * deliveryDelayedNotificationTemplate - Delivery Delayed
 */
const deliveryDelayedNotificationTemplate = ({ username, orderId }) => {
  return {
    subject: `Delivery Delayed`,
    html: buildEmailHTML({
      preheader: `Delivery Delayed`,
      title: 'Delivery Delayed',
      headerBg: '#3b82f6',
      headerText: '🚚 Delivery Delayed',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * orderCanceledByCustomerTemplate - Order Canceled by You
 */
const orderCanceledByCustomerTemplate = ({ username, orderId }) => {
  return {
    subject: `Order Canceled by You`,
    html: buildEmailHTML({
      preheader: `Order Canceled by You`,
      title: 'Order Canceled by You',
      headerBg: '#8b5cf6',
      headerText: '📦 Order Canceled by You',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your order has been updated. See details below.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * orderCanceledByStoreTemplate - Order Canceled by Store
 */
const orderCanceledByStoreTemplate = ({ username, orderId, reason }) => {
  return {
    subject: `Order Canceled by Store`,
    html: buildEmailHTML({
      preheader: `Order Canceled by Store`,
      title: 'Order Canceled by Store',
      headerBg: '#8b5cf6',
      headerText: '📦 Order Canceled by Store',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your order has been updated. See details below.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * preOrderConfirmationTemplate - Pre-Order Confirmation
 */
const preOrderConfirmationTemplate = ({
  username,
  productName,
  releaseDate,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `Pre-Order Confirmation`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Pre-Order Confirmation`,
      title: 'Pre-Order Confirmation',
      headerBg: '#3b82f6',
      headerText: '✉️ Pre-Order Confirmation',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Please verify your information by clicking the button below.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: {
        url: ctaUrl || (ctaPath ? _appUrl + ctaPath : `${_appUrl}/action`),
        text: 'Take Action',
        color: '#3b82f6'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * preOrderShippedTemplate - Pre-Order Shipped
 */
const preOrderShippedTemplate = ({ username, productName }) => {
  return {
    subject: `Pre-Order Shipped`,
    html: buildEmailHTML({
      preheader: `Pre-Order Shipped`,
      title: 'Pre-Order Shipped',
      headerBg: '#8b5cf6',
      headerText: '📦 Pre-Order Shipped',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your order has been updated. See details below.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * digitalDownloadReadyTemplate - Digital Download Ready
 */
const digitalDownloadReadyTemplate = ({
  username,
  downloadLink,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `Digital Download Ready`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Digital Download Ready`,
      title: 'Digital Download Ready',
      headerBg: '#2563eb',
      headerText: '📧 Digital Download Ready',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: {
        url: ctaUrl || (ctaPath ? _appUrl + ctaPath : `${_appUrl}/action`),
        text: 'Take Action',
        color: '#2563eb'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * customOrderConfirmedTemplate - Custom Order Confirmed
 */
const customOrderConfirmedTemplate = ({
  username,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `Custom Order Confirmed`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Custom Order Confirmed`,
      title: 'Custom Order Confirmed',
      headerBg: '#3b82f6',
      headerText: '✉️ Custom Order Confirmed',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Please verify your information by clicking the button below.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: {
        url: ctaUrl || (ctaPath ? _appUrl + ctaPath : `${_appUrl}/action`),
        text: 'Take Action',
        color: '#3b82f6'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * orderModificationRequestReceivedTemplate - Order Modification Request Received
 */
const orderModificationRequestReceivedTemplate = ({ username, orderId }) => {
  return {
    subject: `Order Modification Request Received`,
    html: buildEmailHTML({
      preheader: `Order Modification Request Received`,
      title: 'Order Modification Request Received',
      headerBg: '#8b5cf6',
      headerText: '📦 Order Modification Request Received',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your order has been updated. See details below.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * orderModificationResultTemplate - Order Modification Update
 */
const orderModificationResultTemplate = ({ username, orderId, status }) => {
  return {
    subject: `Order Modification Update`,
    html: buildEmailHTML({
      preheader: `Order Modification Update`,
      title: 'Order Modification Update',
      headerBg: '#8b5cf6',
      headerText: '📦 Order Modification Update',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your order has been updated. See details below.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * returnRequestReceivedTemplate - Return Request Received
 */
const returnRequestReceivedTemplate = ({ username, orderId }) => {
  return {
    subject: `Return Request Received`,
    html: buildEmailHTML({
      preheader: `Return Request Received`,
      title: 'Return Request Received',
      headerBg: '#2563eb',
      headerText: '📧 Return Request Received',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * returnApprovedTemplate - Return Approved
 */
const returnApprovedTemplate = ({
  username,
  orderId,
  instructions,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `Return Approved`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Return Approved`,
      title: 'Return Approved',
      headerBg: '#10b981',
      headerText: '✅ Return Approved',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: {
        url: ctaUrl || (ctaPath ? _appUrl + ctaPath : `${_appUrl}/action`),
        text: 'Take Action',
        color: '#10b981'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * returnRejectedTemplate - Return Request Denied
 */
const returnRejectedTemplate = ({ username, orderId, reason }) => {
  return {
    subject: `Return Request Denied`,
    html: buildEmailHTML({
      preheader: `Return Request Denied`,
      title: 'Return Request Denied',
      headerBg: '#2563eb',
      headerText: '📧 Return Request Denied',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * refundProcessedTemplate - Refund Processed
 */
const refundProcessedTemplate = ({ username, orderId }) => {
  return {
    subject: `Refund Processed`,
    html: buildEmailHTML({
      preheader: `Refund Processed`,
      title: 'Refund Processed',
      headerBg: '#2563eb',
      headerText: '📧 Refund Processed',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * exchangeApprovedTemplate - Exchange Approved
 */
const exchangeApprovedTemplate = ({
  username,
  orderId,
  nextSteps,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `Exchange Approved`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Exchange Approved`,
      title: 'Exchange Approved',
      headerBg: '#10b981',
      headerText: '✅ Exchange Approved',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: {
        url: ctaUrl || (ctaPath ? _appUrl + ctaPath : `${_appUrl}/action`),
        text: 'Take Action',
        color: '#10b981'
      },
      footerNote: null
    }),
    attachments: []
  };
};

// --- 100 templates completed ---

/**
 * exchangeRejectedTemplate - Exchange Request Denied
 */
const exchangeRejectedTemplate = ({ username, orderId, reason }) => {
  return {
    subject: `Exchange Request Denied`,
    html: buildEmailHTML({
      preheader: `Exchange Request Denied`,
      title: 'Exchange Request Denied',
      headerBg: '#2563eb',
      headerText: '📧 Exchange Request Denied',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * returnShipmentReceivedTemplate - Return Shipment Received
 */
const returnShipmentReceivedTemplate = ({ username, orderId }) => {
  return {
    subject: `Return Shipment Received`,
    html: buildEmailHTML({
      preheader: `Return Shipment Received`,
      title: 'Return Shipment Received',
      headerBg: '#3b82f6',
      headerText: '🚚 Return Shipment Received',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * partialRefundProcessedTemplate - Partial Refund Processed
 */
const partialRefundProcessedTemplate = ({ username, orderId, details }) => {
  return {
    subject: `Partial Refund Processed`,
    html: buildEmailHTML({
      preheader: `Partial Refund Processed`,
      title: 'Partial Refund Processed',
      headerBg: '#2563eb',
      headerText: '📧 Partial Refund Processed',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * paymentSuccessfulTemplate - Payment Successful - Order #${orderId}
 */
const paymentSuccessfulTemplate = ({ username, orderId, amount }) => {
  return {
    subject: `Payment Successful - Order #${orderId}`,
    html: buildEmailHTML({
      preheader: `Payment Successful - Order #orderId`,
      title: 'Payment Successful - Order #',
      headerBg: '#10b981',
      headerText: '✅ Payment Successful - Order #orderId',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We have an update regarding your recent payment.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * paymentMethodExpiringSoonTemplate - Payment Method Expiring Soon
 */
const paymentMethodExpiringSoonTemplate = ({ username, expiryDate }) => {
  return {
    subject: `Payment Method Expiring Soon`,
    html: buildEmailHTML({
      preheader: `Payment Method Expiring Soon`,
      title: 'Payment Method Expiring Soon',
      headerBg: '#10b981',
      headerText: '💳 Payment Method Expiring Soon',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We have an update regarding your recent payment.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * subscriptionStartedTemplate - Subscription Started - ${subscriptionName}
 */
const subscriptionStartedTemplate = ({ username, subscriptionName, startDate }) => {
  return {
    subject: `Subscription Started - ${subscriptionName}`,
    html: buildEmailHTML({
      preheader: `Subscription Started - subscriptionName`,
      title: 'Subscription Started -',
      headerBg: '#8b5cf6',
      headerText: '📋 Subscription Started - subscriptionName',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your subscription status has been updated.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * subscriptionRenewedSuccessfullyTemplate - Subscription Renewed Successfully - ${subscriptionName}
 */
const subscriptionRenewedSuccessfullyTemplate = ({ username, subscriptionName }) => {
  return {
    subject: `Subscription Renewed Successfully - ${subscriptionName}`,
    html: buildEmailHTML({
      preheader: `Subscription Renewed Successfully - subscriptionName`,
      title: 'Subscription Renewed Successfully -',
      headerBg: '#10b981',
      headerText: '✅ Subscription Renewed Successfully - s...',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your subscription status has been updated.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * subscriptionFailedRetryNeededTemplate - Subscription Payment Failed - Retry Needed
 */
const subscriptionFailedRetryNeededTemplate = ({ username, subscriptionName }) => {
  return {
    subject: `Subscription Payment Failed - Retry Needed`,
    html: buildEmailHTML({
      preheader: `Subscription Payment Failed - Retry Needed`,
      title: 'Subscription Payment Failed - Retry Needed',
      headerBg: '#8b5cf6',
      headerText: '📋 Subscription Payment Failed - Retry N...',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your subscription status has been updated.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * subscriptionCanceledTemplate - Subscription Canceled - ${subscriptionName}
 */
const subscriptionCanceledTemplate = ({ username, subscriptionName }) => {
  return {
    subject: `Subscription Canceled - ${subscriptionName}`,
    html: buildEmailHTML({
      preheader: `Subscription Canceled - subscriptionName`,
      title: 'Subscription Canceled -',
      headerBg: '#8b5cf6',
      headerText: '📋 Subscription Canceled - subscriptionName',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your subscription status has been updated.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * creditNoteIssuedTemplate - Credit Note Issued - ${creditNoteNumber}
 */
const creditNoteIssuedTemplate = ({ username, creditNoteNumber, amount, issueDate }) => {
  return {
    subject: `Credit Note Issued - ${creditNoteNumber}`,
    html: buildEmailHTML({
      preheader: `Credit Note Issued - creditNoteNumber`,
      title: 'Credit Note Issued -',
      headerBg: '#2563eb',
      headerText: '📧 Credit Note Issued - creditNoteNumber',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * giftCardPurchasedTemplate - Gift Card Purchased
 */
const giftCardPurchasedTemplate = ({ username, giftCardCode, amount }) => {
  return {
    subject: `Gift Card Purchased`,
    html: buildEmailHTML({
      preheader: `Gift Card Purchased`,
      title: 'Gift Card Purchased',
      headerBg: '#ec4899',
      headerText: '🎁 Gift Card Purchased',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * giftCardRedeemedTemplate - Gift Card Redeemed
 */
const giftCardRedeemedTemplate = ({ username, giftCardCode, amount }) => {
  return {
    subject: `Gift Card Redeemed`,
    html: buildEmailHTML({
      preheader: `Gift Card Redeemed`,
      title: 'Gift Card Redeemed',
      headerBg: '#ec4899',
      headerText: '🎁 Gift Card Redeemed',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * storeCreditAddedTemplate - Store Credit Added
 */
const storeCreditAddedTemplate = ({ username, amount }) => {
  return {
    subject: `Store Credit Added`,
    html: buildEmailHTML({
      preheader: `Store Credit Added`,
      title: 'Store Credit Added',
      headerBg: '#2563eb',
      headerText: '📧 Store Credit Added',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * storeCreditUsedTemplate - Store Credit Used
 */
const storeCreditUsedTemplate = ({ username, amount }) => {
  return {
    subject: `Store Credit Used`,
    html: buildEmailHTML({
      preheader: `Store Credit Used`,
      title: 'Store Credit Used',
      headerBg: '#2563eb',
      headerText: '📧 Store Credit Used',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * emiPaymentReminderTemplate - EMI Payment Reminder
 */
const emiPaymentReminderTemplate = ({ username, dueDate }) => {
  return {
    subject: `EMI Payment Reminder`,
    html: buildEmailHTML({
      preheader: `EMI Payment Reminder`,
      title: 'EMI Payment Reminder',
      headerBg: '#10b981',
      headerText: '💳 EMI Payment Reminder',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We have an update regarding your recent payment.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * paymentDisputeNotificationTemplate - Payment Dispute Notification
 */
const paymentDisputeNotificationTemplate = ({ username, orderId }) => {
  return {
    subject: `Payment Dispute Notification`,
    html: buildEmailHTML({
      preheader: `Payment Dispute Notification`,
      title: 'Payment Dispute Notification',
      headerBg: '#10b981',
      headerText: '💳 Payment Dispute Notification',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We have an update regarding your recent payment.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * paymentDisputeResolvedTemplate - Payment Dispute Resolved
 */
const paymentDisputeResolvedTemplate = ({ username, orderId }) => {
  return {
    subject: `Payment Dispute Resolved`,
    html: buildEmailHTML({
      preheader: `Payment Dispute Resolved`,
      title: 'Payment Dispute Resolved',
      headerBg: '#10b981',
      headerText: '💳 Payment Dispute Resolved',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We have an update regarding your recent payment.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * paymentMethodUpdatedTemplate - Payment Method Updated
 */
const paymentMethodUpdatedTemplate = ({ username }) => {
  return {
    subject: `Payment Method Updated`,
    html: buildEmailHTML({
      preheader: `Payment Method Updated`,
      title: 'Payment Method Updated',
      headerBg: '#10b981',
      headerText: '💳 Payment Method Updated',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We have an update regarding your recent payment.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * subscriptionPauseConfirmationTemplate - Subscription Pause Confirmation - ${subscriptionName}
 */
const subscriptionPauseConfirmationTemplate = ({
  username,
  subscriptionName,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `Subscription Pause Confirmation - ${subscriptionName}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Subscription Pause Confirmation - subscriptionName`,
      title: 'Subscription Pause Confirmation -',
      headerBg: '#3b82f6',
      headerText: '✉️ Subscription Pause Confirmation - sub...',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Please verify your information by clicking the button below.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: {
        url: ctaUrl || (ctaPath ? _appUrl + ctaPath : `${_appUrl}/action`),
        text: 'Take Action',
        color: '#3b82f6'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * onboardingSeriesTemplate - Welcome to Our Platform!
 */
const onboardingSeriesTemplate = ({ username }) => {
  return {
    subject: `Welcome to Our Platform!`,
    html: buildEmailHTML({
      preheader: `Welcome to Our Platform!`,
      title: 'Welcome to Our Platform!',
      headerBg: '#2563eb',
      headerText: '📧 Welcome to Our Platform!',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

// --- 120 templates completed ---

/**
 * customerMilestoneTemplate - Congratulations on Your Milestone!
 */
const customerMilestoneTemplate = ({ username, period }) => {
  return {
    subject: `Congratulations on Your Milestone!`,
    html: buildEmailHTML({
      preheader: `Congratulations on Your Milestone!`,
      title: 'Congratulations on Your Milestone!',
      headerBg: '#2563eb',
      headerText: '📧 Congratulations on Your Milestone!',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * loyaltyPointsRedeemedTemplate - Loyalty Points Redeemed
 */
const loyaltyPointsRedeemedTemplate = ({ username, points }) => {
  return {
    subject: `Loyalty Points Redeemed`,
    html: buildEmailHTML({
      preheader: `Loyalty Points Redeemed`,
      title: 'Loyalty Points Redeemed',
      headerBg: '#f59e0b',
      headerText: '⭐ Loyalty Points Redeemed',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * loyaltyPointsExpiryReminderTemplate - Loyalty Points Expiring Soon
 */
const loyaltyPointsExpiryReminderTemplate = ({ username }) => {
  return {
    subject: `Loyalty Points Expiring Soon`,
    html: buildEmailHTML({
      preheader: `Loyalty Points Expiring Soon`,
      title: 'Loyalty Points Expiring Soon',
      headerBg: '#f59e0b',
      headerText: '⭐ Loyalty Points Expiring Soon',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * referralInvitationTemplate - Invite Friends, Earn Rewards
 */
const referralInvitationTemplate = ({ username }) => {
  return {
    subject: `Invite Friends, Earn Rewards`,
    html: buildEmailHTML({
      preheader: `Invite Friends, Earn Rewards`,
      title: 'Invite Friends, Earn Rewards',
      headerBg: '#10b981',
      headerText: '🤝 Invite Friends, Earn Rewards',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * referralBonusEarnedTemplate - Referral Bonus Earned
 */
const referralBonusEarnedTemplate = ({ username, bonus }) => {
  return {
    subject: `Referral Bonus Earned`,
    html: buildEmailHTML({
      preheader: `Referral Bonus Earned`,
      title: 'Referral Bonus Earned',
      headerBg: '#10b981',
      headerText: '🤝 Referral Bonus Earned',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * referralBonusUsedTemplate - Referral Bonus Used
 */
const referralBonusUsedTemplate = ({ username, bonus }) => {
  return {
    subject: `Referral Bonus Used`,
    html: buildEmailHTML({
      preheader: `Referral Bonus Used`,
      title: 'Referral Bonus Used',
      headerBg: '#10b981',
      headerText: '🤝 Referral Bonus Used',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * seasonalSaleAnnouncementTemplate - Seasonal Sale Now On!
 */
const seasonalSaleAnnouncementTemplate = ({ username }) => {
  return {
    subject: `Seasonal Sale Now On!`,
    html: buildEmailHTML({
      preheader: `Seasonal Sale Now On!`,
      title: 'Seasonal Sale Now On!',
      headerBg: '#ec4899',
      headerText: '🎊 Seasonal Sale Now On!',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * flashSaleTemplate - Flash Sale - Limited Time Offer!
 */
const flashSaleTemplate = ({ username }) => {
  return {
    subject: `Flash Sale - Limited Time Offer!`,
    html: buildEmailHTML({
      preheader: `Flash Sale - Limited Time Offer!`,
      title: 'Flash Sale - Limited Time Offer!',
      headerBg: '#ec4899',
      headerText: '🎊 Flash Sale - Limited Time Offer!',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * earlyAccessToSaleTemplate - Early Access to Sale for VIPs
 */
const earlyAccessToSaleTemplate = ({ username }) => {
  return {
    subject: `Early Access to Sale for VIPs`,
    html: buildEmailHTML({
      preheader: `Early Access to Sale for VIPs`,
      title: 'Early Access to Sale for VIPs',
      headerBg: '#ec4899',
      headerText: '🎊 Early Access to Sale for VIPs',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * sneakPeekTemplate - Coming Soon...
 */
const sneakPeekTemplate = ({ username }) => {
  return {
    subject: `Coming Soon...`,
    html: buildEmailHTML({
      preheader: `Coming Soon...`,
      title: 'Coming Soon...',
      headerBg: '#2563eb',
      headerText: '📧 Coming Soon...',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * exclusiveEventTemplate - Exclusive Event Invitation
 */
const exclusiveEventTemplate = ({ username }) => {
  return {
    subject: `Exclusive Event Invitation`,
    html: buildEmailHTML({
      preheader: `Exclusive Event Invitation`,
      title: 'Exclusive Event Invitation',
      headerBg: '#2563eb',
      headerText: '📧 Exclusive Event Invitation',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * surveyRequestTemplate - We Value Your Feedback
 */
const surveyRequestTemplate = ({ username }) => {
  return {
    subject: `We Value Your Feedback`,
    html: buildEmailHTML({
      preheader: `We Value Your Feedback`,
      title: 'We Value Your Feedback',
      headerBg: '#2563eb',
      headerText: '📧 We Value Your Feedback',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * holidayGreetingsTemplate - Happy Holidays!
 */
const holidayGreetingsTemplate = ({ username }) => {
  return {
    subject: `Happy Holidays!`,
    html: buildEmailHTML({
      preheader: `Happy Holidays!`,
      title: 'Happy Holidays!',
      headerBg: '#2563eb',
      headerText: '📧 Happy Holidays!',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * csrStoriesTemplate - Our Social Impact
 */
const csrStoriesTemplate = ({ username }) => {
  return {
    subject: `Our Social Impact`,
    html: buildEmailHTML({
      preheader: `Our Social Impact`,
      title: 'Our Social Impact',
      headerBg: '#2563eb',
      headerText: '📧 Our Social Impact',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * appDownloadInvitationTemplate - Get the Most Out of Our App
 */
const appDownloadInvitationTemplate = ({
  username,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `Get the Most Out of Our App`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Get the Most Out of Our App`,
      title: 'Get the Most Out of Our App',
      headerBg: '#2563eb',
      headerText: '📧 Get the Most Out of Our App',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: {
        url: ctaUrl || (ctaPath ? _appUrl + ctaPath : `${_appUrl}/action`),
        text: 'Take Action',
        color: '#2563eb'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * abandonedBrowseReminderTemplate - Remember These Items?
 */
const abandonedBrowseReminderTemplate = ({ username, items }) => {
  return {
    subject: `Remember These Items?`,
    html: buildEmailHTML({
      preheader: `Remember These Items?`,
      title: 'Remember These Items?',
      headerBg: '#2563eb',
      headerText: '📧 Remember These Items?',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * loyaltyTierChangeTemplate - Your Loyalty Tier Has Changed
 */
const loyaltyTierChangeTemplate = ({ username, change }) => {
  return {
    subject: `Your Loyalty Tier Has Changed`,
    html: buildEmailHTML({
      preheader: `Your Loyalty Tier Has Changed`,
      title: 'Your Loyalty Tier Has Changed',
      headerBg: '#f59e0b',
      headerText: '⭐ Your Loyalty Tier Has Changed',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * otpForLoginTemplate - Your One-Time Password (OTP)
 */
const otpForLoginTemplate = ({ username, otp, expiryMinutes }) => {
  return {
    subject: `Your One-Time Password (OTP)`,
    html: buildEmailHTML({
      preheader: `Your One-Time Password (OTP)`,
      title: 'Your One-Time Password (OTP)',
      headerBg: '#7c3aed',
      headerText: '🔐 Your One-Time Password (OTP)',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Please use the verification code below to continue.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: 'Never share this information with anyone.'
    }),
    attachments: []
  };
};

/**
 * failedLoginAttemptWarningTemplate - Warning: Multiple Failed Login Attempts
 */
const failedLoginAttemptWarningTemplate = ({ username, attempts }) => {
  return {
    subject: `Warning: Multiple Failed Login Attempts`,
    html: buildEmailHTML({
      preheader: `Warning: Multiple Failed Login Attempts`,
      title: 'Warning: Multiple Failed Login Attempts',
      headerBg: '#dc2626',
      headerText: '⚠️ Warning: Multiple Failed Login Attempts',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We detected unusual activity that requires your attention.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * systemMaintenanceNotificationTemplate - Upcoming System Maintenance Notification
 */
const systemMaintenanceNotificationTemplate = ({ username, startTime, endTime }) => {
  return {
    subject: `Upcoming System Maintenance Notification`,
    html: buildEmailHTML({
      preheader: `Upcoming System Maintenance Notification`,
      title: 'Upcoming System Maintenance Notification',
      headerBg: '#f59e0b',
      headerText: '🔧 Upcoming System Maintenance Notification',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

// --- 140 templates completed ---

/**
 * scheduledDowntimeNotificationTemplate - Scheduled Platform Downtime
 */
const scheduledDowntimeNotificationTemplate = ({ username, downtimeStart, downtimeEnd }) => {
  return {
    subject: `Scheduled Platform Downtime`,
    html: buildEmailHTML({
      preheader: `Scheduled Platform Downtime`,
      title: 'Scheduled Platform Downtime',
      headerBg: '#f59e0b',
      headerText: '🔧 Scheduled Platform Downtime',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * fraudulentTransactionAlertTemplate - Alert: Suspected Fraudulent Transaction
 */
const fraudulentTransactionAlertTemplate = ({ username, transactionId, amount }) => {
  return {
    subject: `Alert: Suspected Fraudulent Transaction`,
    html: buildEmailHTML({
      preheader: `Alert: Suspected Fraudulent Transaction`,
      title: 'Alert: Suspected Fraudulent Transaction',
      headerBg: '#dc2626',
      headerText: '⚠️ Alert: Suspected Fraudulent Transaction',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We detected unusual activity that requires your attention.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * sessionTimeoutNotificationTemplate - Session Timeout Notification
 */
const sessionTimeoutNotificationTemplate = ({ username }) => {
  return {
    subject: `Session Timeout Notification`,
    html: buildEmailHTML({
      preheader: `Session Timeout Notification`,
      title: 'Session Timeout Notification',
      headerBg: '#2563eb',
      headerText: '📧 Session Timeout Notification',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * fraudulentActivityDetectedAdminTemplate - Fraudulent Activity Detected on User Account
 */
const fraudulentActivityDetectedAdminTemplate = ({
  adminName,
  userName,
  userId,
  activityDetails
}) => {
  return {
    subject: `Fraudulent Activity Detected on User Account`,
    html: buildEmailHTML({
      preheader: `Fraudulent Activity Detected on User Account`,
      title: 'Fraudulent Activity Detected on User Account',
      headerBg: '#dc2626',
      headerText: '⚠️ Fraudulent Activity Detected on User ...',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>User</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: 'This is an automated admin notification.'
    }),
    attachments: []
  };
};

/**
 * accountSecurityCheckReminderTemplate - Reminder: Review Your Account Security Settings
 */
const accountSecurityCheckReminderTemplate = ({ username }) => {
  return {
    subject: `Reminder: Review Your Account Security Settings`,
    html: buildEmailHTML({
      preheader: `Reminder: Review Your Account Security Settings`,
      title: 'Reminder: Review Your Account Security Settings',
      headerBg: '#2563eb',
      headerText: '📧 Reminder: Review Your Account Securit...',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: 'Never share this information with anyone.'
    }),
    attachments: []
  };
};

/**
 * newOrderPlacedAdminTemplate - New Order Placed - #${orderId}
 */
const newOrderPlacedAdminTemplate = ({ adminName, orderId, customerName, total }) => {
  return {
    subject: `New Order Placed - #${orderId}`,
    html: buildEmailHTML({
      preheader: `New Order Placed - #orderId`,
      title: 'New Order Placed - #',
      headerBg: '#8b5cf6',
      headerText: '📦 New Order Placed - #orderId',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>User</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your order has been updated. See details below.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: 'This is an automated admin notification.'
    }),
    attachments: []
  };
};

/**
 * highValueOrderAlertAdminTemplate - High-Value Order Alert - #${orderId}
 */
const highValueOrderAlertAdminTemplate = ({ adminName, orderId, amount }) => {
  return {
    subject: `High-Value Order Alert - #${orderId}`,
    html: buildEmailHTML({
      preheader: `High-Value Order Alert - #orderId`,
      title: 'High-Value Order Alert - #',
      headerBg: '#dc2626',
      headerText: '⚠️ High-Value Order Alert - #orderId',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>User</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your order has been updated. See details below.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: 'This is an automated admin notification.'
    }),
    attachments: []
  };
};

/**
 * lowStockAlertAdminTemplate - Low Stock Alert - Product #${productId}
 */
const lowStockAlertAdminTemplate = ({ adminName, productId, productName, currentStock }) => {
  return {
    subject: `Low Stock Alert - Product #${productId}`,
    html: buildEmailHTML({
      preheader: `Low Stock Alert - Product #productId`,
      title: 'Low Stock Alert - Product #',
      headerBg: '#dc2626',
      headerText: '⚠️ Low Stock Alert - Product #productId',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>User</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We detected unusual activity that requires your attention.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: 'This is an automated admin notification.'
    }),
    attachments: []
  };
};

/**
 * outOfStockNotificationAdminTemplate - Out of Stock Notification - Product #${productId}
 */
const outOfStockNotificationAdminTemplate = ({ adminName, productId, productName }) => {
  return {
    subject: `Out of Stock Notification - Product #${productId}`,
    html: buildEmailHTML({
      preheader: `Out of Stock Notification - Product #productId`,
      title: 'Out of Stock Notification - Product #',
      headerBg: '#6b7280',
      headerText: '🔔 Out of Stock Notification - Product #...',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>User</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: 'This is an automated admin notification.'
    }),
    attachments: []
  };
};

/**
 * productDisabledAdminTemplate - Product Disabled - Product #${productId}
 */
const productDisabledAdminTemplate = ({ adminName, productId, productName }) => {
  return {
    subject: `Product Disabled - Product #${productId}`,
    html: buildEmailHTML({
      preheader: `Product Disabled - Product #productId`,
      title: 'Product Disabled - Product #',
      headerBg: '#6b7280',
      headerText: '🔔 Product Disabled - Product #productId',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>User</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: 'This is an automated admin notification.'
    }),
    attachments: []
  };
};

/**
 * newReviewSubmittedAdminTemplate - New Review Submitted for ${productName}
 */
const newReviewSubmittedAdminTemplate = ({
  adminName,
  productName,
  reviewId,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `New Review Submitted for ${productName}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `New Review Submitted for productName`,
      title: 'New Review Submitted for',
      headerBg: '#6b7280',
      headerText: '🔔 New Review Submitted for productName',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>User</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: {
        url: ctaUrl || (ctaPath ? _appUrl + ctaPath : `${_appUrl}/action`),
        text: 'Take Action',
        color: '#6b7280'
      },
      footerNote: 'This is an automated admin notification.'
    }),
    attachments: []
  };
};

/**
 * paymentDisputeAlertAdminTemplate - Payment Dispute Alert - Order #${orderId}
 */
const paymentDisputeAlertAdminTemplate = ({ adminName, orderId }) => {
  return {
    subject: `Payment Dispute Alert - Order #${orderId}`,
    html: buildEmailHTML({
      preheader: `Payment Dispute Alert - Order #orderId`,
      title: 'Payment Dispute Alert - Order #',
      headerBg: '#dc2626',
      headerText: '⚠️ Payment Dispute Alert - Order #orderId',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>User</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We have an update regarding your recent payment.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: 'This is an automated admin notification.'
    }),
    attachments: []
  };
};

/**
 * returnRequestNotificationAdminTemplate - Return Request Notification - Order #${orderId}
 */
const returnRequestNotificationAdminTemplate = ({ adminName, orderId }) => {
  return {
    subject: `Return Request Notification - Order #${orderId}`,
    html: buildEmailHTML({
      preheader: `Return Request Notification - Order #orderId`,
      title: 'Return Request Notification - Order #',
      headerBg: '#6b7280',
      headerText: '🔔 Return Request Notification - Order #...',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>User</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: 'This is an automated admin notification.'
    }),
    attachments: []
  };
};

/**
 * refundProcessedNotificationAdminTemplate - Refund Processed Notification - Order #${orderId}
 */
const refundProcessedNotificationAdminTemplate = ({ adminName, orderId }) => {
  return {
    subject: `Refund Processed Notification - Order #${orderId}`,
    html: buildEmailHTML({
      preheader: `Refund Processed Notification - Order #orderId`,
      title: 'Refund Processed Notification - Order #',
      headerBg: '#6b7280',
      headerText: '🔔 Refund Processed Notification - Order...',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>User</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: 'This is an automated admin notification.'
    }),
    attachments: []
  };
};

/**
 * dailySalesReportAdminTemplate - Daily Sales Report - ${reportDate}
 */
const dailySalesReportAdminTemplate = ({ adminName, reportDate, totalSales }) => {
  return {
    subject: `Daily Sales Report - ${reportDate}`,
    html: buildEmailHTML({
      preheader: `Daily Sales Report - reportDate`,
      title: 'Daily Sales Report -',
      headerBg: '#6b7280',
      headerText: '🔔 Daily Sales Report - reportDate',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>User</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: 'This is an automated admin notification.'
    }),
    attachments: []
  };
};

/**
 * weeklyMonthlySalesReportAdminTemplate - Weekly/Monthly Sales Report - ${period}
 */
const weeklyMonthlySalesReportAdminTemplate = ({ adminName, period, totalSales }) => {
  return {
    subject: `Weekly/Monthly Sales Report - ${period}`,
    html: buildEmailHTML({
      preheader: `Weekly/Monthly Sales Report - period`,
      title: 'Weekly/Monthly Sales Report -',
      headerBg: '#6b7280',
      headerText: '🔔 Weekly/Monthly Sales Report - period',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>User</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: 'This is an automated admin notification.'
    }),
    attachments: []
  };
};

/**
 * systemErrorFailedJobAlertAdminTemplate - System Error / Failed Job Alert
 */
const systemErrorFailedJobAlertAdminTemplate = ({ adminName, errorDetails }) => {
  return {
    subject: `System Error / Failed Job Alert`,
    html: buildEmailHTML({
      preheader: `System Error / Failed Job Alert`,
      title: 'System Error / Failed Job Alert',
      headerBg: '#dc2626',
      headerText: '⚠️ System Error / Failed Job Alert',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>User</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We detected unusual activity that requires your attention.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: 'This is an automated admin notification.'
    }),
    attachments: []
  };
};

/**
 * customerSupportTicketCreatedAdminTemplate - Customer Support Ticket Created - Ticket #${ticketId}
 */
const customerSupportTicketCreatedAdminTemplate = ({ adminName, ticketId, customerName }) => {
  return {
    subject: `Customer Support Ticket Created - Ticket #${ticketId}`,
    html: buildEmailHTML({
      preheader: `Customer Support Ticket Created - Ticket #ticketId`,
      title: 'Customer Support Ticket Created - Ticket #',
      headerBg: '#6b7280',
      headerText: '🔔 Customer Support Ticket Created - Tic...',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>User</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: 'This is an automated admin notification.'
    }),
    attachments: []
  };
};

/**
 * inventoryRestockNotificationAdminTemplate - Inventory Restock Notification - Product #${productId}
 */
const inventoryRestockNotificationAdminTemplate = ({ adminName, productName, productId }) => {
  return {
    subject: `Inventory Restock Notification - Product #${productId}`,
    html: buildEmailHTML({
      preheader: `Inventory Restock Notification - Product #productId`,
      title: 'Inventory Restock Notification - Product #',
      headerBg: '#6b7280',
      headerText: '🔔 Inventory Restock Notification - Prod...',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>User</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: 'This is an automated admin notification.'
    }),
    attachments: []
  };
};

// --- 160 templates completed ---

/**
 * bulkOrderRequestAdminTemplate - Bulk Order Request - Request #${requestId}
 */
const bulkOrderRequestAdminTemplate = ({ adminName, requestId, requesterName }) => {
  return {
    subject: `Bulk Order Request - Request #${requestId}`,
    html: buildEmailHTML({
      preheader: `Bulk Order Request - Request #requestId`,
      title: 'Bulk Order Request - Request #',
      headerBg: '#8b5cf6',
      headerText: '📦 Bulk Order Request - Request #requestId',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>User</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your order has been updated. See details below.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: 'This is an automated admin notification.'
    }),
    attachments: []
  };
};

/**
 * customerDataDeletionRequestAdminTemplate - Customer Data Deletion Request
 */
const customerDataDeletionRequestAdminTemplate = ({ adminName, userName, userId }) => {
  return {
    subject: `Customer Data Deletion Request`,
    html: buildEmailHTML({
      preheader: `Customer Data Deletion Request`,
      title: 'Customer Data Deletion Request',
      headerBg: '#6b7280',
      headerText: '🔔 Customer Data Deletion Request',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>User</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: 'This is an automated admin notification.'
    }),
    attachments: []
  };
};

/**
 * suspiciousAccountActivityAlertAdminTemplate - Suspicious Account Activity Alert
 */
const suspiciousAccountActivityAlertAdminTemplate = ({ adminName, userName, userId, details }) => {
  return {
    subject: `Suspicious Account Activity Alert`,
    html: buildEmailHTML({
      preheader: `Suspicious Account Activity Alert`,
      title: 'Suspicious Account Activity Alert',
      headerBg: '#dc2626',
      headerText: '⚠️ Suspicious Account Activity Alert',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>User</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We detected unusual activity that requires your attention.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: 'This is an automated admin notification.'
    }),
    attachments: []
  };
};

/**
 * multipleFailedLoginAttemptsAdminTemplate - Multiple Failed Login Attempts Alert
 */
const multipleFailedLoginAttemptsAdminTemplate = ({ adminName, userName, userId, attempts }) => {
  return {
    subject: `Multiple Failed Login Attempts Alert`,
    html: buildEmailHTML({
      preheader: `Multiple Failed Login Attempts Alert`,
      title: 'Multiple Failed Login Attempts Alert',
      headerBg: '#6b7280',
      headerText: '🔔 Multiple Failed Login Attempts Alert',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>User</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: 'This is an automated admin notification.'
    }),
    attachments: []
  };
};

/**
 * accountSuspensionReinstatementNotificationAdminTemplate - Account Suspension/Reinstatement Notification
 */
const accountSuspensionReinstatementNotificationAdminTemplate = ({
  adminName,
  userName,
  userId,
  action
}) => {
  return {
    subject: `Account Suspension/Reinstatement Notification`,
    html: buildEmailHTML({
      preheader: `Account Suspension/Reinstatement Notification`,
      title: 'Account Suspension/Reinstatement Notification',
      headerBg: '#6b7280',
      headerText: '🔔 Account Suspension/Reinstatement Noti...',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>User</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: 'This is an automated admin notification.'
    }),
    attachments: []
  };
};

/**
 * userProfileUpdateAlertAdminTemplate - User Profile Update Alert
 */
const userProfileUpdateAlertAdminTemplate = ({ adminName, userName, userId, changes }) => {
  return {
    subject: `User Profile Update Alert`,
    html: buildEmailHTML({
      preheader: `User Profile Update Alert`,
      title: 'User Profile Update Alert',
      headerBg: '#dc2626',
      headerText: '⚠️ User Profile Update Alert',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>User</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We detected unusual activity that requires your attention.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: 'This is an automated admin notification.'
    }),
    attachments: []
  };
};

/**
 * twoFactorStatusChangeAlertAdminTemplate - Two-Factor Authentication Status Change Alert
 */
const twoFactorStatusChangeAlertAdminTemplate = ({ adminName, userName, userId, status }) => {
  return {
    subject: `Two-Factor Authentication Status Change Alert`,
    html: buildEmailHTML({
      preheader: `Two-Factor Authentication Status Change Alert`,
      title: 'Two-Factor Authentication Status Change Alert',
      headerBg: '#7c3aed',
      headerText: '🔐 Two-Factor Authentication Status Chan...',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>User</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We detected unusual activity that requires your attention.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: 'This is an automated admin notification.'
    }),
    attachments: []
  };
};

/**
 * accountDeletionRequestDeniedAdminTemplate - Account Deletion Request Denied
 */
const accountDeletionRequestDeniedAdminTemplate = ({ adminName, userName, userId, reason }) => {
  return {
    subject: `Account Deletion Request Denied`,
    html: buildEmailHTML({
      preheader: `Account Deletion Request Denied`,
      title: 'Account Deletion Request Denied',
      headerBg: '#6b7280',
      headerText: '🔔 Account Deletion Request Denied',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>User</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: 'This is an automated admin notification.'
    }),
    attachments: []
  };
};

/**
 * unusualAccountLoginPatternAdminTemplate - Unusual Account Login Pattern Alert
 */
const unusualAccountLoginPatternAdminTemplate = ({ adminName, userName, userId, details }) => {
  return {
    subject: `Unusual Account Login Pattern Alert`,
    html: buildEmailHTML({
      preheader: `Unusual Account Login Pattern Alert`,
      title: 'Unusual Account Login Pattern Alert',
      headerBg: '#6b7280',
      headerText: '🔔 Unusual Account Login Pattern Alert',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>User</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: 'This is an automated admin notification.'
    }),
    attachments: []
  };
};

/**
 * phoneVerificationStatusUpdateAdminTemplate - Phone Verification Status Update
 */
const phoneVerificationStatusUpdateAdminTemplate = ({ adminName, userName, userId, status }) => {
  return {
    subject: `Phone Verification Status Update`,
    html: buildEmailHTML({
      preheader: `Phone Verification Status Update`,
      title: 'Phone Verification Status Update',
      headerBg: '#6b7280',
      headerText: '🔔 Phone Verification Status Update',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>User</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: 'This is an automated admin notification.'
    }),
    attachments: []
  };
};

/**
 * emailVerificationFailureAlertAdminTemplate - Email Verification Failure Alert
 */
const emailVerificationFailureAlertAdminTemplate = ({ adminName, userName, userId, attempts }) => {
  return {
    subject: `Email Verification Failure Alert`,
    html: buildEmailHTML({
      preheader: `Email Verification Failure Alert`,
      title: 'Email Verification Failure Alert',
      headerBg: '#dc2626',
      headerText: '⚠️ Email Verification Failure Alert',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>User</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We detected unusual activity that requires your attention.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: 'This is an automated admin notification.'
    }),
    attachments: []
  };
};

/**
 * secondaryPhoneVerificationStatusUpdateAdminTemplate - Secondary Phone Verification Status Update
 */
const secondaryPhoneVerificationStatusUpdateAdminTemplate = ({
  adminName,
  userName,
  userId,
  status
}) => {
  return {
    subject: `Secondary Phone Verification Status Update`,
    html: buildEmailHTML({
      preheader: `Secondary Phone Verification Status Update`,
      title: 'Secondary Phone Verification Status Update',
      headerBg: '#6b7280',
      headerText: '🔔 Secondary Phone Verification Status U...',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>User</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: 'This is an automated admin notification.'
    }),
    attachments: []
  };
};

/**
 * identityVerificationRequestReceivedAdminTemplate - Identity Verification Request Received
 */
const identityVerificationRequestReceivedAdminTemplate = ({ adminName, userName, userId }) => {
  return {
    subject: `Identity Verification Request Received`,
    html: buildEmailHTML({
      preheader: `Identity Verification Request Received`,
      title: 'Identity Verification Request Received',
      headerBg: '#6b7280',
      headerText: '🔔 Identity Verification Request Received',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>User</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: 'This is an automated admin notification.'
    }),
    attachments: []
  };
};

/**
 * identityVerificationOutcomeNotificationAdminTemplate - Identity Verification Outcome Notification
 */
const identityVerificationOutcomeNotificationAdminTemplate = ({
  adminName,
  userName,
  userId,
  result
}) => {
  return {
    subject: `Identity Verification Outcome Notification`,
    html: buildEmailHTML({
      preheader: `Identity Verification Outcome Notification`,
      title: 'Identity Verification Outcome Notification',
      headerBg: '#6b7280',
      headerText: '🔔 Identity Verification Outcome Notific...',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>User</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: 'This is an automated admin notification.'
    }),
    attachments: []
  };
};

/**
 * accountAccessRevocationAdminTemplate - Account Access Revocation (Admin)
 */
const accountAccessRevocationAdminTemplate = ({ adminName, userName, userId }) => {
  return {
    subject: `Account Access Revocation (Admin)`,
    html: buildEmailHTML({
      preheader: `Account Access Revocation (Admin)`,
      title: 'Account Access Revocation (Admin)',
      headerBg: '#6b7280',
      headerText: '🔔 Account Access Revocation (Admin)',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>User</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: 'This is an automated admin notification.'
    }),
    attachments: []
  };
};

/**
 * socialLoginConnectionAlertAdminTemplate - Social Login Connection Alert
 */
const socialLoginConnectionAlertAdminTemplate = ({ adminName, userName, userId, action }) => {
  return {
    subject: `Social Login Connection Alert`,
    html: buildEmailHTML({
      preheader: `Social Login Connection Alert`,
      title: 'Social Login Connection Alert',
      headerBg: '#dc2626',
      headerText: '⚠️ Social Login Connection Alert',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>User</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We detected unusual activity that requires your attention.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: 'This is an automated admin notification.'
    }),
    attachments: []
  };
};

/**
 * accountMergeRequestReceivedAdminTemplate - Account Merge Request Received
 */
const accountMergeRequestReceivedAdminTemplate = ({ adminName, userName, userId }) => {
  return {
    subject: `Account Merge Request Received`,
    html: buildEmailHTML({
      preheader: `Account Merge Request Received`,
      title: 'Account Merge Request Received',
      headerBg: '#6b7280',
      headerText: '🔔 Account Merge Request Received',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>User</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: 'This is an automated admin notification.'
    }),
    attachments: []
  };
};

/**
 * highRiskAccountActivityAlertAdminTemplate - High-Risk Account Activity Alert
 */
const highRiskAccountActivityAlertAdminTemplate = ({ adminName, userName, userId, details }) => {
  return {
    subject: `High-Risk Account Activity Alert`,
    html: buildEmailHTML({
      preheader: `High-Risk Account Activity Alert`,
      title: 'High-Risk Account Activity Alert',
      headerBg: '#dc2626',
      headerText: '⚠️ High-Risk Account Activity Alert',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>User</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We detected unusual activity that requires your attention.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: 'This is an automated admin notification.'
    }),
    attachments: []
  };
};

/**
 * accountRecoveryRequestReceivedAdminTemplate - Account Recovery Request Received
 */
const accountRecoveryRequestReceivedAdminTemplate = ({ adminName, userName, userId }) => {
  return {
    subject: `Account Recovery Request Received`,
    html: buildEmailHTML({
      preheader: `Account Recovery Request Received`,
      title: 'Account Recovery Request Received',
      headerBg: '#6b7280',
      headerText: '🔔 Account Recovery Request Received',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>User</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to inform you about an important update.
        </p>

        <!-- Add dynamic content here based on parameters -->

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you,<br/>
          <strong style="color:#111827;">The ${applicaionName || 'Team'}</strong>
        </p>
      `,
      ctaButton: null,
      footerNote: 'This is an automated admin notification.'
    }),
    attachments: []
  };
};

// =====================================================================================
// 💳 PAYMENT EMAIL TEMPLATES (16 Templates)
// =====================================================================================
// Add these to your emailTemplate.js file
// All templates use buildEmailHTML() for enterprise-grade responsive design
// =====================================================================================

/**
 * PAYMENT_SUCCESS Email Template
 * Sent when: Payment has been successfully processed
 */
const PAYMENT_SUCCESS = ({ username, amount, transactionId, paymentMethod, date }) => {
  return {
    subject: `Payment Successful - ${amount} Received`,
    html: buildEmailHTML({
      preheader: `Your payment of ${amount} was successful.`,
      title: 'Payment Successful',
      headerBg: '#10b981',
      headerText: '💰 Payment Received',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We have successfully received your payment of <strong>${amount}</strong> via ${paymentMethod || 'your selected payment method'}.
        </p>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#d1fae5;border-left:4px solid #10b981;border-radius:4px;">
          <tr><td style="font-size:14px;color:#065f46;">
            <strong>Transaction Details:</strong><br/>
            Transaction ID: <strong>${transactionId}</strong><br/>
            Payment Date: <strong>${new Date(date).toLocaleString()}</strong>
          </td></tr>
        </table>
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you for your prompt payment.
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * PAYMENT_FAILED Email Template
 * Sent when: Payment has failed
 */
const PAYMENT_FAILED = ({
  username,
  amount,
  transactionId,
  paymentMethod,
  date,
  failureReason,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `Payment Failed - ${amount} Not Received`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Your payment of ${amount} could not be processed.`,
      title: 'Payment Failed',
      headerBg: '#dc2626',
      headerText: '❌ Payment Failed',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Unfortunately, your payment of <strong>${amount}</strong> via ${paymentMethod || 'your selected payment method'} could not be processed.
        </p>
        ${failureReason ? `<p style="margin:0 0 16px 0;color:#dc2626;">Reason: ${failureReason}</p>` : ''}
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fee2e2;border-left:4px solid #dc2626;border-radius:4px;">
          <tr><td style="font-size:14px;color:#7f1d1d;">
            Transaction ID: <strong>${transactionId}</strong><br/>
            Payment Date: <strong>${new Date(date).toLocaleString()}</strong>
          </td></tr>
        </table>
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Please update your payment information and try again.
        </p>
      `,
      ctaButton: {
        url: ctaUrl || (ctaPath ? _appUrl + ctaPath : _appUrl),
        text: 'Update Payment Info',
        color: '#dc2626'
      },
      footerNote: 'If you need assistance, please contact support.'
    }),
    attachments: []
  };
};

/**
 * PAYMENT_PENDING Email Template
 * Sent when: Payment is pending and awaiting confirmation
 */
const PAYMENT_PENDING = ({ username, amount, paymentMethod, expectedDate }) => {
  return {
    subject: `Payment Pending - Awaiting Confirmation`,
    html: buildEmailHTML({
      preheader: `Your payment of ${amount} is currently pending.`,
      title: 'Payment Pending',
      headerBg: '#f59e0b',
      headerText: '⏳ Payment Pending',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your payment of <strong>${amount}</strong> via ${paymentMethod || 'your selected payment method'} is currently pending. It is expected to be confirmed by <strong>${expectedDate ? new Date(expectedDate).toLocaleDateString() : 'soon'}</strong>.
        </p>
        <p style="margin:24px 0 0 0;color:#4b5563;">
          We will notify you once the payment is confirmed.
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * PAYMENT_REFUNDED Email Template
 * Sent when: A payment has been refunded
 */
const PAYMENT_REFUNDED = ({ username, amount, transactionId, refundId, refundDate }) => {
  return {
    subject: `Payment Refunded - ${amount} Credited`,
    html: buildEmailHTML({
      preheader: `A payment of ${amount} has been refunded to your account.`,
      title: 'Payment Refunded',
      headerBg: '#3b82f6',
      headerText: '🔄 Payment Refunded',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          A refund of <strong>${amount}</strong> has been issued for your payment.
        </p>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#d1e7ff;border-left:4px solid #3b82f6;border-radius:4px;">
          <tr><td style="font-size:14px;color:#1d4ed8;">
            <strong>Transaction Details:</strong><br/>
            Original Transaction ID: <strong>${transactionId}</strong><br/>
            Refund ID: <strong>${refundId}</strong><br/>
            Refund Date: <strong>${new Date(refundDate).toLocaleString()}</strong>
          </td></tr>
        </table>
        <p style="margin:24px 0 0 0;color:#4b5563;">
          The refund will reflect on your original payment method within several business days.
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * INVOICE_GENERATED Email Template
 * Sent when: An invoice has been generated
 */
const INVOICE_GENERATED = ({
  username,
  invoiceNumber,
  dueDate,
  amount,
  invoiceUrl,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `Invoice #${invoiceNumber} Generated - Due ${new Date(dueDate).toLocaleDateString()}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Your invoice #${invoiceNumber} for ${amount} is ready.`,
      title: 'Invoice Generated',
      headerBg: '#3b82f6',
      headerText: '📄 Invoice Generated',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your invoice <strong>#${invoiceNumber}</strong> for <strong>${amount}</strong> has been generated and is due by <strong>${new Date(dueDate).toLocaleDateString()}</strong>.
        </p>
        <p style="margin:24px 0 0 0;color:#4b5563;">
          You can view and pay your invoice at the link below.
        </p>
      `,
      ctaButton: {
        url: invoiceUrl || ctaUrl || `${_appUrl}/invoices/${invoiceNumber}`,
        text: 'View Invoice',
        color: '#3b82f6'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * INVOICE_PAID Email Template
 * Sent when: An invoice has been paid successfully
 */
const INVOICE_PAID = ({ username, invoiceNumber, paymentDate, amount }) => {
  return {
    subject: `Invoice #${invoiceNumber} Paid Successfully`,
    html: buildEmailHTML({
      preheader: `Payment for invoice #${invoiceNumber} received.`,
      title: 'Invoice Paid',
      headerBg: '#10b981',
      headerText: '✅ Invoice Paid',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We have received your payment of <strong>${amount}</strong> for invoice <strong>#${invoiceNumber}</strong> on <strong>${new Date(paymentDate).toLocaleDateString()}</strong>.
        </p>
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you for your prompt payment.
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * INVOICE_OVERDUE Email Template
 * Sent when: An invoice payment is overdue
 */
const INVOICE_OVERDUE = ({
  username,
  invoiceNumber,
  dueDate,
  amount,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `Invoice #${invoiceNumber} Payment Overdue`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Payment for invoice #${invoiceNumber} was due on ${new Date(dueDate).toLocaleDateString()}.`,
      title: 'Invoice Overdue',
      headerBg: '#f59e0b',
      headerText: '⚠️ Invoice Overdue',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your invoice <strong>#${invoiceNumber}</strong> with amount <strong>${amount}</strong> was due on <strong>${new Date(dueDate).toLocaleDateString()}</strong> and is now overdue.
        </p>
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Please make the payment as soon as possible to avoid additional fees.
        </p>
      `,
      ctaButton: {
        url: ctaUrl || `${_appUrl}/invoices/${invoiceNumber}`,
        text: 'Pay Invoice',
        color: '#f59e0b'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * INVOICE_CANCELLED Email Template
 * Sent when: An invoice has been cancelled
 */
const INVOICE_CANCELLED = ({ username, invoiceNumber, cancelledAt, reason }) => {
  return {
    subject: `Invoice #${invoiceNumber} Cancelled`,
    html: buildEmailHTML({
      preheader: `Invoice #${invoiceNumber} has been cancelled.`,
      title: 'Invoice Cancelled',
      headerBg: '#6b7280',
      headerText: '🚫 Invoice Cancelled',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your invoice <strong>#${invoiceNumber}</strong> has been cancelled.
        </p>
        ${reason ? `<p style="margin:0 0 16px 0;color:#6b7280;">Reason: ${reason}</p>` : ''}
        <p style="margin:24px 0 0 0;color:#4b5563;">
          If you have questions, please contact support.
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * BILLING_INFO_UPDATED Email Template
 * Sent when: Billing information has been updated
 */
const BILLING_INFO_UPDATED = ({
  username,
  updatedFields,
  updatedAt,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  const fieldsHTML =
    updatedFields && updatedFields.length
      ? updatedFields.map(field => `<li>${field}</li>`).join('')
      : '<li>Billing information updated</li>';
  return {
    subject: `Billing Information Updated`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Your billing information has been updated.`,
      title: 'Billing Updated',
      headerBg: '#ec4899',
      headerText: '💳 Billing Info Updated',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your billing information has been successfully updated. Here are the changes:
        </p>
        <ul style="color:#4b5563; padding-left:20px; margin:0 0 16px 0;">
          ${fieldsHTML}
        </ul>
        <p style="margin:24px 0 0 0;color:#4b5563;">
          If you did not authorize this change, please contact support immediately.
        </p>
      `,
      ctaButton: {
        url: ctaUrl || (ctaPath ? _appUrl + ctaPath : `${_appUrl}/billing`),
        text: 'Manage Billing',
        color: '#ec4899'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * AUTO_RENEWAL_REMINDER Email Template
 * Sent when: Subscription auto-renewal is coming up
 */
const AUTO_RENEWAL_REMINDER = ({
  username,
  subscriptionName,
  renewalDate,
  amount,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `Auto-Renewal Reminder for ${subscriptionName}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Your subscription ${subscriptionName} will auto-renew on ${new Date(renewalDate).toLocaleDateString()}.`,
      title: 'Auto-Renewal Reminder',
      headerBg: '#3b82f6',
      headerText: '🔄 Auto-Renewal Coming Up',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your subscription <strong>${subscriptionName}</strong> is set to auto-renew on <strong>${new Date(renewalDate).toLocaleDateString()}</strong>.
        </p>
        <p style="margin:24px 0 0 0;color:#4b5563;">
          The amount of <strong>${amount}</strong> will be charged to your payment method.
        </p>
      `,
      ctaButton: {
        url: ctaUrl || (ctaPath ? _appUrl + ctaPath : `${_appUrl}/subscriptions`),
        text: 'Manage Subscription',
        color: '#3b82f6'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * SUBSCRIPTION_STARTED Email Template
 * Sent when: Subscription has started
 */
const SUBSCRIPTION_STARTED = ({
  username,
  subscriptionName,
  startDate,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `Subscription Started: ${subscriptionName}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Your subscription to ${subscriptionName} has started.`,
      title: 'Subscription Started',
      headerBg: '#10b981',
      headerText: '🎉 Subscription Started',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your subscription to <strong>${subscriptionName}</strong> has started on <strong>${new Date(startDate).toLocaleDateString()}</strong>.
        </p>
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you for joining us!
        </p>
      `,
      ctaButton: {
        url: ctaUrl || (ctaPath ? _appUrl + ctaPath : `${_appUrl}/subscriptions`),
        text: 'View Subscription',
        color: '#10b981'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * SUBSCRIPTION_CANCELLED Email Template
 * Sent when: Subscription has been cancelled
 */
const SUBSCRIPTION_CANCELLED = ({
  username,
  subscriptionName,
  cancelledAt,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `Subscription Cancelled: ${subscriptionName}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Your subscription to ${subscriptionName} has been cancelled.`,
      title: 'Subscription Cancelled',
      headerBg: '#dc2626',
      headerText: '❌ Subscription Cancelled',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your subscription to <strong>${subscriptionName}</strong> was cancelled on <strong>${new Date(cancelledAt).toLocaleDateString()}</strong>.
        </p>
        <p style="margin:24px 0 0 0;color:#4b5563;">
          We're sorry to see you go. If this was a mistake, you can restart your subscription anytime.
        </p>
      `,
      ctaButton: {
        url: ctaUrl || (ctaPath ? _appUrl + ctaPath : `${_appUrl}/subscriptions`),
        text: 'Restart Subscription',
        color: '#dc2626'
      },
      footerNote: null
    }),
    attachments: []
  };
};
/**
 * CHARGEBACK_INITIATED Email Template
 * Sent when: A chargeback has been initiated on a payment
 */
const CHARGEBACK_INITIATED = ({
  username,
  transactionId,
  amount,
  chargebackDate,
  reason,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `Chargeback Initiated - Transaction ${transactionId}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `A chargeback has been initiated on your payment of ${amount}.`,
      title: 'Chargeback Initiated',
      headerBg: '#f59e0b',
      headerText: '⚠️ Chargeback Initiated',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          A chargeback has been initiated on your payment of <strong>${amount}</strong> with transaction ID <strong>${transactionId}</strong> on <strong>${new Date(chargebackDate).toLocaleString()}</strong>.
        </p>
        ${reason ? `<p style="margin:0 0 16px 0;color:#dc2626;">Reason: ${reason}</p>` : ''}
        <p style="margin:24px 0 0 0;color:#4b5563;">
          We are reviewing the issue and will notify you once resolved. Please contact support if you have questions.
        </p>
      `,
      ctaButton: {
        url: ctaUrl || (ctaPath ? _appUrl + ctaPath : `${_appUrl}/support/chargebacks`),
        text: 'View Chargeback Details',
        color: '#f59e0b'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * CHARGEBACK_RESOLVED Email Template
 * Sent when: A chargeback has been resolved
 */
const CHARGEBACK_RESOLVED = ({
  username,
  transactionId,
  amount,
  resolutionDate,
  outcome,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `Chargeback Resolved - Transaction ${transactionId}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `The chargeback on your payment of ${amount} has been resolved.`,
      title: 'Chargeback Resolved',
      headerBg: '#10b981',
      headerText: '✅ Chargeback Resolved',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          The chargeback on your payment of <strong>${amount}</strong> with transaction ID <strong>${transactionId}</strong> has been resolved on <strong>${new Date(resolutionDate).toLocaleString()}</strong>.
        </p>
        <p style="margin:0 0 16px 0; color:#4b5563;">
          Outcome: <strong>${outcome || 'Resolved'}</strong>
        </p>
        <p style="margin:24px 0 0 0;color:#4b5563;">
          If you have any questions, please contact our support team.
        </p>
      `,
      ctaButton: {
        url: ctaUrl || (ctaPath ? _appUrl + ctaPath : `${_appUrl}/support/chargebacks`),
        text: 'View Resolution Details',
        color: '#10b981'
      },
      footerNote: null
    }),
    attachments: []
  };
};
/**
 * SUBSCRIPTION_RENEWED Email Template
 * Sent when: A subscription has been renewed successfully
 */
const SUBSCRIPTION_RENEWED = ({
  username,
  subscriptionName,
  renewalDate,
  amount,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `Subscription Renewed: ${subscriptionName}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Your subscription to ${subscriptionName} has been renewed successfully.`,
      title: 'Subscription Renewed',
      headerBg: '#10b981',
      headerText: '🔄 Subscription Renewed',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your subscription to <strong>${subscriptionName}</strong> has been renewed successfully on <strong>${new Date(renewalDate).toLocaleDateString()}</strong>.
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          The renewal amount charged is <strong>${amount}</strong>.
        </p>
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you for your continued support. We look forward to serving you in the coming period.
        </p>
      `,
      ctaButton: {
        url: ctaUrl || (ctaPath ? _appUrl + ctaPath : `${_appUrl}/subscriptions`),
        text: 'Manage Subscription',
        color: '#10b981'
      },
      footerNote: null
    }),
    attachments: []
  };
};

// =====================================================================================
// 🛒 SHOPPING EMAIL TEMPLATES (9 Templates)
// =====================================================================================
// Add these to your emailTemplate.js file
// All templates use buildEmailHTML() for enterprise-grade responsive design
// =====================================================================================

/**
 * CART_CREATED Email Template
 * Sent when: A new shopping cart has been created
 */
const CART_CREATED = ({
  username,
  cartId,
  itemCount,
  createdAt,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `Shopping Cart Created`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `You've started a cart with ${itemCount} item${itemCount > 1 ? 's' : ''}.`,
      title: 'Cart Created',
      headerBg: '#3b82f6',
      headerText: '🛒 Cart Started',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'Shopper'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          You've created a new shopping cart with <strong>${itemCount}</strong> item${itemCount > 1 ? 's' : ''}.
        </p>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Cart Details:</strong><br/>
            <span style="color:#6b7280;">Cart ID:</span> <strong style="color:#111827;">${cartId}</strong><br/>
            <span style="color:#6b7280;">Items:</span> <strong style="color:#111827;">${itemCount}</strong><br/>
            <span style="color:#6b7280;">Created:</span> <strong style="color:#111827;">${new Date(createdAt).toLocaleString()}</strong>
          </td></tr>
        </table>
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Continue shopping or checkout when you're ready!
        </p>
      `,
      ctaButton: {
        url: ctaUrl || `${_appUrl}/cart/${cartId}`,
        text: 'View Cart',
        color: '#3b82f6'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * CART_UPDATED Email Template
 * Sent when: Shopping cart has been updated
 */
const CART_UPDATED = ({
  username,
  cartId,
  itemCount,
  totalAmount,
  updatedAt,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `Cart Updated - ${itemCount} Item${itemCount > 1 ? 's' : ''}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Your cart has been updated with ${itemCount} items.`,
      title: 'Cart Updated',
      headerBg: '#3b82f6',
      headerText: '🛒 Cart Updated',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'Shopper'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your shopping cart has been updated.
        </p>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Current Cart:</strong><br/>
            <span style="color:#6b7280;">Items:</span> <strong style="color:#111827;">${itemCount}</strong><br/>
            ${totalAmount ? `<span style="color:#6b7280;">Total:</span> <strong style="color:#111827;">${totalAmount}</strong><br/>` : ''}
            <span style="color:#6b7280;">Updated:</span> <strong style="color:#111827;">${new Date(updatedAt).toLocaleString()}</strong>
          </td></tr>
        </table>
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Ready to checkout? Complete your purchase now!
        </p>
      `,
      ctaButton: {
        url: ctaUrl || `${_appUrl}/cart/${cartId}`,
        text: 'View Cart',
        color: '#3b82f6'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * CART_ABANDONED Email Template
 * Sent when: A shopping cart has been abandoned
 */
const CART_ABANDONED = ({
  username,
  cartId,
  itemCount,
  items,
  totalAmount,
  abandonedAt,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  const itemsHTML =
    items && items.length > 0
      ? items
          .slice(0, 3)
          .map(
            item => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="width:60px;vertical-align:top;">
                ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width:50px;height:50px;border-radius:4px;object-fit:cover;" />` : '<div style="width:50px;height:50px;background:#e5e7eb;border-radius:4px;"></div>'}
              </td>
              <td style="padding-left:12px;vertical-align:top;">
                <div style="font-size:14px;font-weight:600;color:#111827;margin-bottom:4px;">${item.name}</div>
                <div style="font-size:13px;color:#6b7280;">Qty: ${item.quantity || 1}</div>
              </td>
              <td align="right" style="vertical-align:top;white-space:nowrap;">
                <div style="font-size:15px;font-weight:700;color:#111827;">${item.price}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `
          )
          .join('')
      : '<tr><td style="padding:12px 0;color:#6b7280;">Your cart items are waiting for you!</td></tr>';

  return {
    subject: `Don't Forget Your Cart! ${itemCount} Item${itemCount > 1 ? 's' : ''} Waiting`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `You left ${itemCount} item${itemCount > 1 ? 's' : ''} in your cart. Complete your purchase now!`,
      title: 'Cart Reminder',
      headerBg: '#f59e0b',
      headerText: '🛒 You Left Items Behind',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'Shopper'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          You left <strong>${itemCount}</strong> item${itemCount > 1 ? 's' : ''} in your cart. Don't miss out!
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="padding:16px;background:#f9fafb;">
              <strong style="font-size:16px;color:#111827;">Your Cart Items</strong>
            </td>
          </tr>
          ${itemsHTML}
          ${
            totalAmount
              ? `
          <tr>
            <td style="padding:16px;background:#f3f4f6;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="font-size:16px;font-weight:700;color:#111827;">Total:</td>
                  <td align="right" style="font-size:18px;font-weight:700;color:#f59e0b;">${totalAmount}</td>
                </tr>
              </table>
            </td>
          </tr>
          `
              : ''
          }
        </table>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#92400e;">
            <strong>⏰ Hurry!</strong> Items in your cart are in high demand. Complete your purchase before they're gone!
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Complete your purchase with just one click!
        </p>
      `,
      ctaButton: {
        url: ctaUrl || `${_appUrl}/cart/${cartId}`,
        text: 'Complete Purchase',
        color: '#f59e0b'
      },
      footerNote: 'Your cart is saved for 30 days.'
    }),
    attachments: []
  };
};

/**
 * WISHLIST_CREATED Email Template
 * Sent when: A wishlist has been created
 */
const WISHLIST_CREATED = ({
  username,
  wishlistId,
  itemCount,
  createdAt,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `Wishlist Created - ${itemCount} Item${itemCount > 1 ? 's' : ''} Saved`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `You've created a wishlist with ${itemCount} item${itemCount > 1 ? 's' : ''}.`,
      title: 'Wishlist Created',
      headerBg: '#ec4899',
      headerText: '💝 Wishlist Created',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'Shopper'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          You've created a new wishlist with <strong>${itemCount}</strong> item${itemCount > 1 ? 's' : ''}!
        </p>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#fce7f3;border-left:4px solid #ec4899;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#831843;">
            <strong>✨ What's Next?</strong><br/>
            • Get notified when prices drop<br/>
            • Receive alerts when items are back in stock<br/>
            • Share your wishlist with friends and family
          </td></tr>
        </table>
        <p style="margin:24px 0 0 0;color:#4b5563;">
          We'll keep you updated on your favorite items!
        </p>
      `,
      ctaButton: {
        url: ctaUrl || `${_appUrl}/wishlist/${wishlistId}`,
        text: 'View Wishlist',
        color: '#ec4899'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * WISHLIST_REMINDER Email Template
 * Sent when: Reminder about saved wishlist items
 */
const WISHLIST_REMINDER = ({
  username,
  wishlistId,
  itemCount,
  items,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  const itemsHTML =
    items && items.length > 0
      ? items
          .slice(0, 3)
          .map(item => `<li style="margin:8px 0;color:#4b5563;">• ${item.name}</li>`)
          .join('')
      : '<li style="color:#6b7280;">Your wishlist items</li>';

  return {
    subject: `Don't Forget Your Wishlist - ${itemCount} Item${itemCount > 1 ? 's' : ''} Waiting`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `You have ${itemCount} item${itemCount > 1 ? 's' : ''} in your wishlist.`,
      title: 'Wishlist Reminder',
      headerBg: '#ec4899',
      headerText: '💝 Your Wishlist Awaits',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'Shopper'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          You have <strong>${itemCount}</strong> item${itemCount > 1 ? 's' : ''} in your wishlist that you might want to check out!
        </p>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Featured Items:</strong><br/>
            <ul style="margin:8px 0;padding-left:20px;">
              ${itemsHTML}
            </ul>
          </td></tr>
        </table>
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Some items may be selling fast. Check them out now!
        </p>
      `,
      ctaButton: {
        url: ctaUrl || `${_appUrl}/wishlist/${wishlistId}`,
        text: 'View Wishlist',
        color: '#ec4899'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * WISHLIST_PRICE_DROP Email Template
 * Sent when: Price has dropped on a wishlist item
 */
const WISHLIST_PRICE_DROP = ({
  username,
  productName,
  productId,
  oldPrice,
  newPrice,
  savings,
  productImage,
  productUrl,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `🎉 Price Drop Alert! ${productName} - ${savings} Off`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `${productName} is now ${newPrice} - Save ${savings}!`,
      title: 'Price Drop Alert',
      headerBg: '#10b981',
      headerText: '🎉 Price Drop Alert!',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'Shopper'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Great news! A product on your wishlist has dropped in price!
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
          <tr>
            <td align="center" style="padding:20px;background:#f9fafb;">
              ${productImage ? `<img src="${productImage}" alt="${productName}" style="max-width:200px;max-height:200px;border-radius:8px;" />` : ''}
            </td>
          </tr>
          <tr>
            <td style="padding:20px;">
              <h2 style="margin:0 0 12px 0;font-size:18px;font-weight:700;color:#111827;">${productName}</h2>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:16px 0;">
                <tr>
                  <td>
                    <div style="font-size:14px;color:#6b7280;margin-bottom:4px;">Was:</div>
                    <div style="font-size:18px;color:#6b7280;text-decoration:line-through;">${oldPrice}</div>
                  </td>
                  <td align="right">
                    <div style="font-size:14px;color:#6b7280;margin-bottom:4px;">Now:</div>
                    <div style="font-size:24px;font-weight:700;color:#10b981;">${newPrice}</div>
                  </td>
                </tr>
              </table>
              <div style="text-align:center;padding:12px;background:#d1fae5;border-radius:6px;">
                <span style="font-size:16px;font-weight:700;color:#065f46;">Save ${savings}!</span>
              </div>
            </td>
          </tr>
        </table>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#92400e;">
            <strong>⏰ Limited Time!</strong> This price drop won't last forever. Get it before it's gone!
          </td></tr>
        </table>
      `,
      ctaButton: {
        url: productUrl || ctaUrl || `${_appUrl}/products/${productId}`,
        text: 'Buy Now',
        color: '#10b981'
      },
      footerNote: 'Prices subject to change. Act fast!'
    }),
    attachments: []
  };
};

/**
 * WISHLIST_BACK_IN_STOCK Email Template
 * Sent when: A wishlist item is back in stock
 */
const WISHLIST_BACK_IN_STOCK = ({
  username,
  productName,
  productId,
  productImage,
  productUrl,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `🎊 Back in Stock! ${productName}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `${productName} is back in stock - Get it now!`,
      title: 'Back in Stock',
      headerBg: '#10b981',
      headerText: '🎊 Back in Stock!',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'Shopper'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Exciting news! <strong>${productName}</strong> from your wishlist is back in stock!
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
          <tr>
            <td align="center" style="padding:20px;background:#f9fafb;">
              ${productImage ? `<img src="${productImage}" alt="${productName}" style="max-width:200px;max-height:200px;border-radius:8px;" />` : ''}
            </td>
          </tr>
          <tr>
            <td style="padding:20px;">
              <h2 style="margin:0 0 12px 0;font-size:18px;font-weight:700;color:#111827;">${productName}</h2>
              <div style="text-align:center;padding:12px;background:#d1fae5;border-radius:6px;margin:16px 0;">
                <span style="font-size:16px;font-weight:700;color:#065f46;">✓ In Stock Now!</span>
              </div>
            </td>
          </tr>
        </table>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#92400e;">
            <strong>⚡ Act Fast!</strong> This popular item sold out before. Don't miss your chance this time!
          </td></tr>
        </table>
      `,
      ctaButton: {
        url: productUrl || ctaUrl || `${_appUrl}/products/${productId}`,
        text: 'Shop Now',
        color: '#10b981'
      },
      footerNote: 'Limited stock available.'
    }),
    attachments: []
  };
};

/**
 * CART_ITEM_PRICE_CHANGED Email Template
 * Sent when: Price of an item in cart has changed
 */
const CART_ITEM_PRICE_CHANGED = ({
  username,
  cartId,
  productName,
  oldPrice,
  newPrice,
  priceChange
}) => {
  const isPriceIncrease =
    parseFloat(newPrice.replace(/[^0-9.-]+/g, '')) > parseFloat(oldPrice.replace(/[^0-9.-]+/g, ''));
  const changeColor = isPriceIncrease ? '#dc2626' : '#10b981';
  const changeBg = isPriceIncrease ? '#fee2e2' : '#d1fae5';
  const changeIcon = isPriceIncrease ? '⬆️' : '⬇️';

  return {
    subject: `Price ${isPriceIncrease ? 'Increased' : 'Decreased'}: ${productName}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `The price of ${productName} in your cart has changed.`,
      title: 'Cart Price Update',
      headerBg: '#f59e0b',
      headerText: '💰 Price Changed',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'Shopper'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          The price of <strong>${productName}</strong> in your cart has changed.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:${changeBg};border-left:4px solid ${changeColor};border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <div style="margin-bottom:12px;"><strong style="color:#111827;">${productName}</strong></div>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="color:#6b7280;">Previous: <strong style="text-decoration:line-through;">${oldPrice}</strong></td>
                <td align="right" style="font-size:18px;font-weight:700;color:${changeColor};">${changeIcon} ${newPrice}</td>
              </tr>
            </table>
            <div style="margin-top:8px;color:#6b7280;">Change: <strong style="color:${changeColor};">${priceChange}</strong></div>
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          ${isPriceIncrease ? 'Prices are subject to change. Complete your purchase soon!' : "Great news! You'll save more on this item."}
        </p>
      `,
      ctaButton: {
        url: ctaUrl || `${_appUrl}/cart/${cartId}`,
        text: 'Review Cart',
        color: '#f59e0b'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * CART_EXPIRY_NOTIFICATION Email Template
 * Sent when: Cart is about to expire
 */
const CART_EXPIRY_NOTIFICATION = ({
  username,
  cartId,
  itemCount,
  expiryDate,
  hoursRemaining,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `⚠️ Your Cart Expires Soon - ${hoursRemaining} Hours Left`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Your cart with ${itemCount} items will expire in ${hoursRemaining} hours.`,
      title: 'Cart Expiring Soon',
      headerBg: '#dc2626',
      headerText: '⏰ Cart Expiring Soon',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'Shopper'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your shopping cart with <strong>${itemCount}</strong> item${itemCount > 1 ? 's' : ''} will expire soon!
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#fee2e2;border-left:4px solid #dc2626;border-radius:4px;">
          <tr><td style="font-size:16px;line-height:24px;color:#7f1d1d;">
            <div style="font-size:18px;font-weight:700;margin-bottom:8px;">⏰ ${hoursRemaining} Hours Remaining</div>
            <div style="font-size:14px;">Your cart will expire on <strong>${new Date(expiryDate).toLocaleString()}</strong></div>
          </td></tr>
        </table>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#92400e;">
            <strong>🚨 Don't Lose Your Items!</strong><br/>
            After expiry, items may no longer be available or prices may change. Complete your purchase now!
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Complete your purchase before it's too late!
        </p>
      `,
      ctaButton: {
        url: ctaUrl || `${_appUrl}/cart/${cartId}`,
        text: 'Complete Purchase Now',
        color: '#dc2626'
      },
      footerNote: 'Hurry! Time is running out.'
    }),
    attachments: []
  };
};

// =====================================================================================
// 📦 ORDER & DELIVERY EMAIL TEMPLATES (13 Templates)
// =====================================================================================

/**
 * ORDER_CREATED Email Template
 * Sent when: A new order has been created
 */
const ORDER_CREATED = ({
  username,
  orderId,
  orderDate,
  items,
  totalAmount,
  shippingAddress,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  const itemsHTML =
    items && items.length > 0
      ? items
          .map(
            item => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
          <div style="font-size:14px;font-weight:600;color:#111827;">${item.name}</div>
          <div style="font-size:13px;color:#6b7280;">Qty: ${item.quantity}</div>
        </td>
        <td align="right" style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
          <div style="font-size:14px;font-weight:600;color:#111827;">${item.price}</div>
        </td>
      </tr>
    `
          )
          .join('')
      : '<tr><td colspan="2" style="padding:12px 0;color:#6b7280;">Order items</td></tr>';

  return {
    subject: `Order Created #${orderId}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Your order #${orderId} has been created successfully.`,
      title: 'Order Created',
      headerBg: '#8b5cf6',
      headerText: '📦 Order Created',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'Customer'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Thank you for your order! Your order <strong>#${orderId}</strong> has been created and is being processed.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="padding:16px;background:#f9fafb;">
              <strong style="font-size:16px;color:#111827;">Order #${orderId}</strong>
              <div style="font-size:13px;color:#6b7280;margin-top:4px;">${new Date(orderDate).toLocaleString()}</div>
            </td>
          </tr>
          ${itemsHTML}
          <tr>
            <td colspan="2" style="padding:16px;background:#f3f4f6;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="font-size:16px;font-weight:700;color:#111827;">Total:</td>
                  <td align="right" style="font-size:18px;font-weight:700;color:#8b5cf6;">${totalAmount}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        
        ${
          shippingAddress
            ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Shipping Address:</strong><br/>
            <div style="color:#4b5563;margin-top:8px;">${shippingAddress}</div>
          </td></tr>
        </table>
        `
            : ''
        }
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          We'll notify you when your order ships.
        </p>
      `,
      ctaButton: {
        url: ctaUrl || `${_appUrl}/orders/${orderId}`,
        text: 'View Order',
        color: '#8b5cf6'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * ORDER_CONFIRMED Email Template
 * Sent when: Order has been confirmed and payment verified
 */
const ORDER_CONFIRMED = ({
  username,
  orderId,
  estimatedDelivery,
  totalAmount,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `Order Confirmed #${orderId}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Your order #${orderId} has been confirmed.`,
      title: 'Order Confirmed',
      headerBg: '#10b981',
      headerText: '✅ Order Confirmed',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'Customer'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Great news! Your order <strong>#${orderId}</strong> has been confirmed and is being prepared for shipment.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#d1fae5;border-left:4px solid #10b981;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#065f46;">
            <strong>✓ Payment Confirmed</strong><br/>
            Amount: <strong>${totalAmount}</strong><br/>
            ${estimatedDelivery ? `Estimated Delivery: <strong>${new Date(estimatedDelivery).toLocaleDateString()}</strong>` : ''}
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          You'll receive another email when your order ships.
        </p>
      `,
      ctaButton: {
        url: ctaUrl || `${_appUrl}/orders/${orderId}`,
        text: 'Track Order',
        color: '#10b981'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * ORDER_SHIPPED Email Template
 * Sent when: Order has been shipped
 */
const ORDER_SHIPPED = ({
  username,
  orderId,
  trackingNumber,
  carrier,
  estimatedDelivery,
  trackingUrl,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `Order Shipped #${orderId} - Track Your Package`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Your order #${orderId} has shipped. Track it now!`,
      title: 'Order Shipped',
      headerBg: '#3b82f6',
      headerText: '🚚 Order Shipped',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'Customer'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Exciting news! Your order <strong>#${orderId}</strong> has been shipped and is on its way to you!
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Shipping Details:</strong><br/>
            <span style="color:#6b7280;">Carrier:</span> <strong style="color:#111827;">${carrier || 'Standard Shipping'}</strong><br/>
            <span style="color:#6b7280;">Tracking Number:</span> <strong style="color:#111827;font-family:monospace;">${trackingNumber}</strong><br/>
            ${estimatedDelivery ? `<span style="color:#6b7280;">Estimated Delivery:</span> <strong style="color:#111827;">${new Date(estimatedDelivery).toLocaleDateString()}</strong>` : ''}
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Use the tracking number above to monitor your shipment status.
        </p>
      `,
      ctaButton: {
        url: trackingUrl || ctaUrl || `${_appUrl}/orders/${orderId}/track`,
        text: 'Track Package',
        color: '#3b82f6'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * ORDER_DELIVERED Email Template
 * Sent when: Order has been delivered
 */
const ORDER_DELIVERED = ({
  username,
  orderId,
  deliveryDate,
  deliveryAddress,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `Order Delivered #${orderId}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Your order #${orderId} has been delivered!`,
      title: 'Order Delivered',
      headerBg: '#10b981',
      headerText: '📬 Order Delivered',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'Customer'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your order <strong>#${orderId}</strong> has been delivered successfully!
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#d1fae5;border-left:4px solid #10b981;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#065f46;">
            <strong>✓ Delivery Confirmed</strong><br/>
            Delivered: <strong>${new Date(deliveryDate).toLocaleString()}</strong><br/>
            ${deliveryAddress ? `Location: <strong>${deliveryAddress}</strong>` : ''}
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          We hope you love your purchase! Please let us know how we did by leaving a review.
        </p>
      `,
      ctaButton: {
        url: ctaUrl || `${_appUrl}/orders/${orderId}/review`,
        text: 'Leave a Review',
        color: '#10b981'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * ORDER_DELAYED Email Template
 * Sent when: Order delivery is delayed
 */
const ORDER_DELAYED = ({
  username,
  orderId,
  reason,
  newEstimatedDelivery,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `Order Delayed #${orderId} - Updated Delivery Date`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Your order #${orderId} has been delayed. New delivery date provided.`,
      title: 'Order Delayed',
      headerBg: '#f59e0b',
      headerText: '⏰ Delivery Delayed',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'Customer'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We're sorry to inform you that your order <strong>#${orderId}</strong> has been delayed.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#92400e;">
            <strong>⚠️ Delay Notice</strong><br/>
            ${reason ? `Reason: <strong>${reason}</strong><br/>` : ''}
            ${newEstimatedDelivery ? `New Estimated Delivery: <strong>${new Date(newEstimatedDelivery).toLocaleDateString()}</strong>` : "We're working to get your order to you as soon as possible."}
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          We apologize for any inconvenience and appreciate your patience.
        </p>
      `,
      ctaButton: {
        url: ctaUrl || `${_appUrl}/orders/${orderId}`,
        text: 'View Order Status',
        color: '#f59e0b'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * ORDER_CANCELLED Email Template
 * Sent when: Order has been cancelled
 */
const ORDER_CANCELLED = ({ username, orderId, cancelledBy, reason, refundAmount, cancelledAt }) => {
  return {
    subject: `Order Cancelled #${orderId}`,
    html: buildEmailHTML({
      preheader: `Your order #${orderId} has been cancelled.`,
      title: 'Order Cancelled',
      headerBg: '#dc2626',
      headerText: '❌ Order Cancelled',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'Customer'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your order <strong>#${orderId}</strong> has been cancelled.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fee2e2;border-left:4px solid #dc2626;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#7f1d1d;">
            <strong>Cancellation Details:</strong><br/>
            ${reason ? `Reason: <strong>${reason}</strong><br/>` : ''}
            Cancelled by: <strong>${cancelledBy || 'Customer'}</strong><br/>
            ${refundAmount ? `Refund Amount: <strong>${refundAmount}</strong><br/>` : ''}
            Date: <strong>${new Date(cancelledAt).toLocaleString()}</strong>
          </td></tr>
        </table>
        
        ${
          refundAmount
            ? `
        <p style="margin:24px 0 0 0;color:#4b5563;">
          A refund of <strong>${refundAmount}</strong> will be processed to your original payment method within 5-7 business days.
        </p>
        `
            : ''
        }
      `,
      ctaButton: null,
      footerNote: 'If you have questions, please contact our support team.'
    }),
    attachments: []
  };
};

/**
 * ORDER_RETURNED Email Template
 * Sent when: Order has been returned
 */
const ORDER_RETURNED = ({ username, orderId, returnReason, returnDate, refundAmount }) => {
  return {
    subject: `Order Return Processed #${orderId}`,
    html: buildEmailHTML({
      preheader: `Your return for order #${orderId} has been processed.`,
      title: 'Order Returned',
      headerBg: '#10b981',
      headerText: '↩️ Return Processed',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'Customer'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your return for order <strong>#${orderId}</strong> has been processed successfully.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Return Details:</strong><br/>
            ${returnReason ? `Reason: <strong>${returnReason}</strong><br/>` : ''}
            Return Date: <strong>${new Date(returnDate).toLocaleString()}</strong><br/>
            ${refundAmount ? `Refund Amount: <strong style="color:#10b981;">${refundAmount}</strong>` : ''}
          </td></tr>
        </table>
        
        ${
          refundAmount
            ? `
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Your refund will be credited to your original payment method within 5-7 business days.
        </p>
        `
            : ''
        }
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * ORDER_REFUNDED Email Template
 * Sent when: Order refund has been processed
 */
const ORDER_REFUNDED = ({
  username,
  orderId,
  refundAmount,
  refundMethod,
  refundDate,
  transactionId
}) => {
  return {
    subject: `Refund Processed #${orderId} - ${refundAmount}`,
    html: buildEmailHTML({
      preheader: `Your refund of ${refundAmount} has been processed.`,
      title: 'Refund Processed',
      headerBg: '#10b981',
      headerText: '💵 Refund Issued',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'Customer'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your refund for order <strong>#${orderId}</strong> has been processed.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#d1fae5;border-left:4px solid #10b981;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#065f46;">
            <strong>✓ Refund Details:</strong><br/>
            Amount: <strong style="font-size:18px;">${refundAmount}</strong><br/>
            Method: <strong>${refundMethod || 'Original Payment Method'}</strong><br/>
            ${transactionId ? `Transaction ID: <strong>${transactionId}</strong><br/>` : ''}
            Date: <strong>${new Date(refundDate).toLocaleString()}</strong>
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Please allow 5-7 business days for the refund to appear in your account.
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * ORDER_PAYMENT_PENDING Email Template
 * Sent when: Order payment is pending verification
 */
const ORDER_PAYMENT_PENDING = ({
  username,
  orderId,
  amount,
  paymentMethod,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `Payment Pending - Order #${orderId}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Payment for order #${orderId} is pending.`,
      title: 'Payment Pending',
      headerBg: '#f59e0b',
      headerText: '⏳ Payment Pending',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'Customer'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your payment of <strong>${amount}</strong> for order <strong>#${orderId}</strong> is currently pending verification.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#92400e;">
            <strong>⏰ Payment Processing</strong><br/>
            We're verifying your payment via ${paymentMethod || 'your selected payment method'}. This usually takes a few minutes.
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          You'll receive a confirmation email once payment is verified.
        </p>
      `,
      ctaButton: {
        url: ctaUrl || `${_appUrl}/orders/${orderId}`,
        text: 'View Order',
        color: '#f59e0b'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * ORDER_PAYMENT_FAILED Email Template
 * Sent when: Order payment has failed
 */
const ORDER_PAYMENT_FAILED = ({
  username,
  orderId,
  amount,
  paymentMethod,
  failureReason,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `Payment Failed - Order #${orderId}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Payment for order #${orderId} could not be processed.`,
      title: 'Payment Failed',
      headerBg: '#dc2626',
      headerText: '❌ Payment Failed',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'Customer'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Unfortunately, we were unable to process your payment of <strong>${amount}</strong> for order <strong>#${orderId}</strong>.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fee2e2;border-left:4px solid #dc2626;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#7f1d1d;">
            <strong>⚠️ Payment Issue:</strong><br/>
            ${failureReason ? `Reason: <strong>${failureReason}</strong><br/>` : ''}
            Payment Method: <strong>${paymentMethod || 'N/A'}</strong>
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Please update your payment information and try again to complete your order.
        </p>
      `,
      ctaButton: {
        url: ctaUrl || `${_appUrl}/orders/${orderId}/payment`,
        text: 'Update Payment',
        color: '#dc2626'
      },
      footerNote: 'Your order will be cancelled if payment is not received within 24 hours.'
    }),
    attachments: []
  };
};

/**
 * ORDER_PARTIALLY_SHIPPED Email Template
 * Sent when: Part of the order has been shipped
 */
const ORDER_PARTIALLY_SHIPPED = ({
  username,
  orderId,
  shippedItems,
  remainingItems,
  trackingNumber,
  carrier
}) => {
  const shippedHTML =
    shippedItems && shippedItems.length > 0
      ? shippedItems.map(item => `<li style="margin:4px 0;">✓ ${item}</li>`).join('')
      : '<li>Shipped items</li>';

  const remainingHTML =
    remainingItems && remainingItems.length > 0
      ? remainingItems.map(item => `<li style="margin:4px 0;">⏳ ${item}</li>`).join('')
      : '<li>Remaining items</li>';

  return {
    subject: `Partial Shipment - Order #${orderId}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Part of your order #${orderId} has shipped.`,
      title: 'Partial Shipment',
      headerBg: '#3b82f6',
      headerText: '📦 Partial Shipment',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'Customer'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Part of your order <strong>#${orderId}</strong> has been shipped!
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Shipped Items:</strong>
            <ul style="margin:8px 0;padding-left:20px;color:#065f46;">
              ${shippedHTML}
            </ul>
            <br/>
            <strong style="color:#111827;">Remaining Items:</strong>
            <ul style="margin:8px 0;padding-left:20px;color:#6b7280;">
              ${remainingHTML}
            </ul>
          </td></tr>
        </table>
        
        ${
          trackingNumber
            ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#dbeafe;border-left:4px solid #3b82f6;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#1e40af;">
            <strong>Tracking Information:</strong><br/>
            Carrier: <strong>${carrier || 'Standard'}</strong><br/>
            Tracking: <strong style="font-family:monospace;">${trackingNumber}</strong>
          </td></tr>
        </table>
        `
            : ''
        }
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          We'll notify you when the remaining items ship.
        </p>
      `,
      ctaButton: {
        url: ctaUrl || `${_appUrl}/orders/${orderId}/track`,
        text: 'Track Package',
        color: '#3b82f6'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * CUSTOM_ORDER_CONFIRMED Email Template
 * Sent when: A custom/special order has been confirmed
 */
const CUSTOM_ORDER_CONFIRMED = ({
  username,
  orderId,
  customDetails,
  estimatedCompletion,
  totalAmount,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `Custom Order Confirmed #${orderId}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Your custom order #${orderId} has been confirmed.`,
      title: 'Custom Order Confirmed',
      headerBg: '#8b5cf6',
      headerText: '⭐ Custom Order Confirmed',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'Customer'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your custom order <strong>#${orderId}</strong> has been confirmed and our team is working on it!
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Custom Order Details:</strong><br/>
            ${customDetails ? `<div style="color:#4b5563;margin:8px 0;">${customDetails}</div>` : ''}
            ${estimatedCompletion ? `<strong style="color:#6b7280;">Estimated Completion:</strong> <strong style="color:#111827;">${new Date(estimatedCompletion).toLocaleDateString()}</strong><br/>` : ''}
            ${totalAmount ? `<strong style="color:#6b7280;">Total:</strong> <strong style="color:#8b5cf6;font-size:18px;">${totalAmount}</strong>` : ''}
          </td></tr>
        </table>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#ede9fe;border-left:4px solid #8b5cf6;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#5b21b6;">
            <strong>✨ What's Next?</strong><br/>
            Our specialized team will carefully craft your custom order. We'll keep you updated throughout the process.
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you for choosing us for your custom needs!
        </p>
      `,
      ctaButton: {
        url: ctaUrl || `${_appUrl}/orders/${orderId}`,
        text: 'View Order Details',
        color: '#8b5cf6'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * ORDER_REVIEWED Email Template
 * Sent when: Customer has left a review for an order
 */
const ORDER_REVIEWED = ({ username, orderId, rating, reviewText }) => {
  const stars = '⭐'.repeat(rating || 5);

  return {
    subject: `Thank You for Your Review - Order #${orderId}`,
    html: buildEmailHTML({
      preheader: `Thank you for reviewing order #${orderId}!`,
      title: 'Review Received',
      headerBg: '#f59e0b',
      headerText: '⭐ Thanks for Your Review!',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'Customer'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Thank you for taking the time to review your order <strong>#${orderId}</strong>!
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#fffbeb;border-left:4px solid #f59e0b;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <div style="font-size:24px;margin-bottom:8px;">${stars}</div>
            <strong style="color:#111827;">Your Rating: ${rating}/5</strong>
            ${reviewText ? `<div style="color:#4b5563;margin-top:12px;font-style:italic;">"${reviewText}"</div>` : ''}
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Your feedback helps us improve and helps other customers make informed decisions. We appreciate you!
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

// =====================================================================================
// 🔁 RETURN & EXCHANGE EMAIL TEMPLATES (7 Templates)
// =====================================================================================

/**
 * RETURN_REQUEST_RECEIVED Email Template
 * Sent when: A return request has been received
 */
const RETURN_REQUEST_RECEIVED = ({
  username,
  orderId,
  returnId,
  requestedItems,
  returnReason,
  requestDate
}) => {
  const itemsHTML =
    requestedItems && requestedItems.length > 0
      ? requestedItems.map(item => `<li style="margin:4px 0;">${item}</li>`).join('')
      : '<li>Requested return items</li>';

  return {
    subject: `Return Request Received - Order #${orderId}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Your return request for order #${orderId} has been received.`,
      title: 'Return Request Received',
      headerBg: '#3b82f6',
      headerText: '📥 Return Request Received',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'Customer'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We've received your return request for order <strong>#${orderId}</strong>.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Return Request Details:</strong><br/>
            <span style="color:#6b7280;">Return ID:</span> <strong style="color:#111827;">${returnId}</strong><br/>
            <span style="color:#6b7280;">Order ID:</span> <strong style="color:#111827;">#${orderId}</strong><br/>
            <span style="color:#6b7280;">Request Date:</span> <strong style="color:#111827;">${new Date(requestDate).toLocaleString()}</strong><br/>
            ${returnReason ? `<span style="color:#6b7280;">Reason:</span> <strong style="color:#111827;">${returnReason}</strong><br/>` : ''}
            <br/>
            <strong style="color:#111827;">Items:</strong>
            <ul style="margin:8px 0;padding-left:20px;color:#4b5563;">
              ${itemsHTML}
            </ul>
          </td></tr>
        </table>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#dbeafe;border-left:4px solid #3b82f6;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#1e40af;">
            <strong>What's Next?</strong><br/>
            Our team will review your request within 24-48 hours. You'll receive an email once your return is approved or if we need more information.
          </td></tr>
        </table>
      `,
      ctaButton: {
        url: ctaUrl || `${_appUrl}/returns/${returnId}`,
        text: 'Track Return Status',
        color: '#3b82f6'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * RETURN_APPROVED Email Template
 * Sent when: Return request has been approved
 */
const RETURN_APPROVED = ({
  username,
  orderId,
  returnId,
  approvedItems,
  returnLabel,
  returnInstructions
}) => {
  const itemsHTML =
    approvedItems && approvedItems.length > 0
      ? approvedItems.map(item => `<li style="margin:4px 0;">✓ ${item}</li>`).join('')
      : '<li>Approved return items</li>';

  return {
    subject: `Return Approved - Order #${orderId}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Your return request for order #${orderId} has been approved.`,
      title: 'Return Approved',
      headerBg: '#10b981',
      headerText: '✅ Return Approved',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'Customer'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Great news! Your return request for order <strong>#${orderId}</strong> has been approved.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#d1fae5;border-left:4px solid #10b981;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#065f46;">
            <strong>✓ Approved Items:</strong>
            <ul style="margin:8px 0;padding-left:20px;">
              ${itemsHTML}
            </ul>
            <br/>
            <strong>Return ID:</strong> ${returnId}
          </td></tr>
        </table>
        
        ${
          returnInstructions
            ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Return Instructions:</strong><br/>
            <div style="color:#4b5563;margin-top:8px;">${returnInstructions}</div>
          </td></tr>
        </table>
        `
            : ''
        }
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          ${returnLabel ? 'Download your prepaid return label below and ship the items within 14 days.' : 'Please ship the items to the address provided in the return instructions.'}
        </p>
      `,
      ctaButton: returnLabel
        ? {
            url: returnLabel,
            text: 'Download Return Label',
            color: '#10b981'
          }
        : {
            url: ctaUrl || `${_appUrl}/returns/${returnId}`,
            text: 'View Return Details',
            color: '#10b981'
          },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * RETURN_REJECTED Email Template
 * Sent when: Return request has been rejected
 */
const RETURN_REJECTED = ({
  username,
  orderId,
  returnId,
  rejectionReason,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `Return Request Not Approved - Order #${orderId}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Your return request for order #${orderId} could not be approved.`,
      title: 'Return Not Approved',
      headerBg: '#dc2626',
      headerText: '❌ Return Not Approved',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'Customer'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We're sorry, but your return request for order <strong>#${orderId}</strong> could not be approved at this time.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fee2e2;border-left:4px solid #dc2626;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#7f1d1d;">
            <strong>Reason for Rejection:</strong><br/>
            ${rejectionReason || 'Your return request does not meet our return policy criteria.'}
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          If you have questions or believe this is an error, please contact our support team for assistance.
        </p>
      `,
      ctaButton: {
        url: ctaUrl || (ctaPath ? _appUrl + ctaPath : `${_appUrl}/support/returns`),
        text: 'Contact Support',
        color: '#dc2626'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * RETURN_COMPLETED Email Template
 * Sent when: Return has been completed and refund processed
 */
const RETURN_COMPLETED = ({
  username,
  orderId,
  returnId,
  refundAmount,
  refundMethod,
  completionDate
}) => {
  return {
    subject: `Return Completed - Order #${orderId}`,
    html: buildEmailHTML({
      preheader: `Your return for order #${orderId} is complete.`,
      title: 'Return Completed',
      headerBg: '#10b981',
      headerText: '✅ Return Completed',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'Customer'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your return for order <strong>#${orderId}</strong> has been completed successfully!
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#d1fae5;border-left:4px solid #10b981;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#065f46;">
            <strong>✓ Return Completed</strong><br/>
            Return ID: <strong>${returnId}</strong><br/>
            Completion Date: <strong>${new Date(completionDate).toLocaleString()}</strong><br/>
            ${refundAmount ? `Refund Amount: <strong style="font-size:18px;">${refundAmount}</strong><br/>` : ''}
            ${refundMethod ? `Refund Method: <strong>${refundMethod}</strong>` : ''}
          </td></tr>
        </table>
        
        ${
          refundAmount
            ? `
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Your refund will be credited to your ${refundMethod || 'original payment method'} within 5-7 business days.
        </p>
        `
            : ''
        }
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * EXCHANGE_REQUESTED Email Template
 * Sent when: Customer has requested an exchange
 */
const EXCHANGE_REQUESTED = ({
  username,
  orderId,
  exchangeId,
  originalItem,
  requestedItem,
  requestDate,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `Exchange Request Received - Order #${orderId}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Your exchange request for order #${orderId} has been received.`,
      title: 'Exchange Request Received',
      headerBg: '#3b82f6',
      headerText: '🔄 Exchange Request',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'Customer'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We've received your exchange request for order <strong>#${orderId}</strong>.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Exchange Details:</strong><br/>
            <span style="color:#6b7280;">Exchange ID:</span> <strong style="color:#111827;">${exchangeId}</strong><br/>
            <span style="color:#6b7280;">Request Date:</span> <strong style="color:#111827;">${new Date(requestDate).toLocaleString()}</strong><br/>
            <br/>
            <strong style="color:#111827;">Original Item:</strong> ${originalItem}<br/>
            <strong style="color:#10b981;">Requested Item:</strong> ${requestedItem}
          </td></tr>
        </table>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#dbeafe;border-left:4px solid #3b82f6;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#1e40af;">
            <strong>What's Next?</strong><br/>
            We'll review your exchange request and confirm availability. You'll receive an update within 24-48 hours.
          </td></tr>
        </table>
      `,
      ctaButton: {
        url: ctaUrl || `${_appUrl}/exchanges/${exchangeId}`,
        text: 'Track Exchange Status',
        color: '#3b82f6'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * EXCHANGE_APPROVED Email Template
 * Sent when: Exchange request has been approved
 */
const EXCHANGE_APPROVED = ({
  username,
  orderId,
  exchangeId,
  originalItem,
  newItem,
  returnLabel,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `Exchange Approved - Order #${orderId}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Your exchange request for order #${orderId} has been approved.`,
      title: 'Exchange Approved',
      headerBg: '#10b981',
      headerText: '✅ Exchange Approved',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'Customer'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Great news! Your exchange request for order <strong>#${orderId}</strong> has been approved.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#d1fae5;border-left:4px solid #10b981;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#065f46;">
            <strong>✓ Exchange Approved</strong><br/>
            Exchange ID: <strong>${exchangeId}</strong><br/>
            <br/>
            Returning: <strong>${originalItem}</strong><br/>
            Receiving: <strong style="color:#10b981;">${newItem}</strong>
          </td></tr>
        </table>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Next Steps:</strong><br/>
            1. Download your prepaid return label below<br/>
            2. Pack the original item securely<br/>
            3. Ship it back within 14 days<br/>
            4. We'll ship your new item once we receive the return
          </td></tr>
        </table>
      `,
      ctaButton: returnLabel
        ? {
            url: returnLabel,
            text: 'Download Return Label',
            color: '#10b981'
          }
        : {
            url: ctaUrl || `${_appUrl}/exchanges/${exchangeId}`,
            text: 'View Exchange Details',
            color: '#10b981'
          },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * EXCHANGE_REJECTED Email Template
 * Sent when: Exchange request has been rejected
 */
const EXCHANGE_REJECTED = ({
  username,
  orderId,
  exchangeId,
  rejectionReason,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `Exchange Request Not Approved - Order #${orderId}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Your exchange request for order #${orderId} could not be approved.`,
      title: 'Exchange Not Approved',
      headerBg: '#dc2626',
      headerText: '❌ Exchange Not Approved',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'Customer'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We're sorry, but your exchange request for order <strong>#${orderId}</strong> could not be approved.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fee2e2;border-left:4px solid #dc2626;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#7f1d1d;">
            <strong>Reason:</strong><br/>
            ${rejectionReason || 'The requested item is not available for exchange at this time.'}
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          You may request a return for a refund instead, or contact our support team for alternative options.
        </p>
      `,
      ctaButton: {
        url: ctaUrl || (ctaPath ? _appUrl + ctaPath : `${_appUrl}/support/exchanges`),
        text: 'Contact Support',
        color: '#dc2626'
      },
      footerNote: null
    }),
    attachments: []
  };
};

// =====================================================================================
// ⚙️ SYSTEM & INFRASTRUCTURE EMAIL TEMPLATES (14 Templates)
// =====================================================================================

/**
 * SYSTEM_ALERT Email Template
 * Sent when: Critical system alert is triggered
 */
const SYSTEM_ALERT = ({
  alertType,
  severity,
  message,
  affectedServices,
  detectedAt,
  actionRequired
}) => {
  const severityColor =
    severity === 'critical' ? '#dc2626' : severity === 'high' ? '#f59e0b' : '#3b82f6';
  const severityBg =
    severity === 'critical' ? '#fee2e2' : severity === 'high' ? '#fef3c7' : '#dbeafe';
  const severityIcon = severity === 'critical' ? '🚨' : severity === 'high' ? '⚠️' : 'ℹ️';

  const servicesHTML =
    affectedServices && affectedServices.length > 0
      ? affectedServices.map(service => `<li style="margin:4px 0;">• ${service}</li>`).join('')
      : '<li>All services</li>';

  return {
    subject: `${severityIcon} SYSTEM ALERT: ${alertType} [${severity.toUpperCase()}]`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `${severity.toUpperCase()} system alert detected: ${message}`,
      title: 'System Alert',
      headerBg: severityColor,
      headerText: `${severityIcon} System Alert`,
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          <strong>System Alert Notification</strong>
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:${severityBg};border-left:4px solid ${severityColor};border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <div style="font-size:16px;font-weight:700;margin-bottom:12px;text-transform:uppercase;color:${severityColor};">
              ${severityIcon} ${severity} SEVERITY
            </div>
            <strong style="color:#111827;">Alert Type:</strong> ${alertType}<br/>
            <strong style="color:#111827;">Message:</strong><br/>
            <div style="color:#4b5563;margin:8px 0;padding:12px;background:#ffffff;border-radius:4px;">${message}</div>
            <strong style="color:#111827;">Detected:</strong> ${new Date(detectedAt).toLocaleString()}
          </td></tr>
        </table>
        
        ${
          affectedServices && affectedServices.length > 0
            ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Affected Services:</strong>
            <ul style="margin:8px 0;padding-left:20px;color:#4b5563;">
              ${servicesHTML}
            </ul>
          </td></tr>
        </table>
        `
            : ''
        }
        
        ${
          actionRequired
            ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fee2e2;border-left:4px solid #dc2626;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#7f1d1d;">
            <strong>⚡ ACTION REQUIRED:</strong><br/>
            ${actionRequired}
          </td></tr>
        </table>
        `
            : ''
        }
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Our team has been notified and is investigating this issue.
        </p>
      `,
      ctaButton: {
        url: ctaUrl || (ctaPath ? _appUrl + ctaPath : `${_appUrl}/admin/system/alerts`),
        text: 'View Alert Details',
        color: severityColor
      },
      footerNote: 'This is an automated system notification.'
    }),
    attachments: []
  };
};

/**
 * MAINTENANCE_SCHEDULED Email Template
 * Sent when: Scheduled maintenance is planned
 */
const MAINTENANCE_SCHEDULED = ({
  maintenanceType,
  scheduledStart,
  scheduledEnd,
  duration,
  affectedServices,
  impact,
  reason
}) => {
  const servicesHTML =
    affectedServices && affectedServices.length > 0
      ? affectedServices.map(service => `<li style="margin:4px 0;">• ${service}</li>`).join('')
      : '<li>All services</li>';

  return {
    subject: `Scheduled Maintenance: ${new Date(scheduledStart).toLocaleDateString()}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Scheduled maintenance on ${new Date(scheduledStart).toLocaleDateString()} - ${duration}`,
      title: 'Maintenance Scheduled',
      headerBg: '#3b82f6',
      headerText: '🔧 Scheduled Maintenance',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We have scheduled system maintenance to improve our services.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#dbeafe;border-left:4px solid #3b82f6;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#1e40af;">
            <strong style="font-size:16px;">Maintenance Schedule</strong><br/><br/>
            <strong>Type:</strong> ${maintenanceType || 'System Maintenance'}<br/>
            <strong>Start:</strong> ${new Date(scheduledStart).toLocaleString()}<br/>
            <strong>End:</strong> ${new Date(scheduledEnd).toLocaleString()}<br/>
            <strong>Duration:</strong> ${duration}<br/>
            ${reason ? `<strong>Reason:</strong> ${reason}` : ''}
          </td></tr>
        </table>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Affected Services:</strong>
            <ul style="margin:8px 0;padding-left:20px;color:#4b5563;">
              ${servicesHTML}
            </ul>
            <br/>
            <strong style="color:#111827;">Expected Impact:</strong><br/>
            <div style="color:#4b5563;margin-top:8px;">${impact || 'Services may be temporarily unavailable during the maintenance window.'}</div>
          </td></tr>
        </table>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#92400e;">
            <strong>⏰ Please Note:</strong> We recommend completing any critical tasks before the maintenance window begins.
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you for your patience as we improve our systems.
        </p>
      `,
      ctaButton: {
        url: ctaUrl || (ctaPath ? _appUrl + ctaPath : `${_appUrl}/system/status`),
        text: 'View System Status',
        color: '#3b82f6'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * MAINTENANCE_STARTED Email Template
 * Sent when: Scheduled maintenance has begun
 */
const MAINTENANCE_STARTED = ({
  maintenanceType,
  startedAt,
  estimatedEnd,
  affectedServices,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  const servicesHTML =
    affectedServices && affectedServices.length > 0
      ? affectedServices.map(service => `<li style="margin:4px 0;">• ${service}</li>`).join('')
      : '<li>All services</li>';

  return {
    subject: `Maintenance In Progress - ${maintenanceType}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `System maintenance is currently in progress.`,
      title: 'Maintenance In Progress',
      headerBg: '#f59e0b',
      headerText: '🔧 Maintenance Started',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          System maintenance is now in progress.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#92400e;">
            <strong>🔧 Maintenance Active</strong><br/>
            Type: <strong>${maintenanceType}</strong><br/>
            Started: <strong>${new Date(startedAt).toLocaleString()}</strong><br/>
            Estimated Completion: <strong>${new Date(estimatedEnd).toLocaleString()}</strong>
          </td></tr>
        </table>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Currently Affected:</strong>
            <ul style="margin:8px 0;padding-left:20px;color:#4b5563;">
              ${servicesHTML}
            </ul>
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          We'll notify you once maintenance is complete and all services are restored.
        </p>
      `,
      ctaButton: {
        url: ctaUrl || (ctaPath ? _appUrl + ctaPath : `${_appUrl}/system/status`),
        text: 'Check Status',
        color: '#f59e0b'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * MAINTENANCE_COMPLETED Email Template
 * Sent when: Scheduled maintenance has been completed
 */
const MAINTENANCE_COMPLETED = ({ maintenanceType, completedAt, duration, improvements }) => {
  const improvementsHTML =
    improvements && improvements.length > 0
      ? improvements.map(item => `<li style="margin:4px 0;">✓ ${item}</li>`).join('')
      : '';

  return {
    subject: `Maintenance Complete - All Systems Operational`,
    html: buildEmailHTML({
      preheader: `System maintenance has been completed successfully.`,
      title: 'Maintenance Complete',
      headerBg: '#10b981',
      headerText: '✅ Maintenance Complete',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We're pleased to inform you that our scheduled maintenance has been completed successfully!
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#d1fae5;border-left:4px solid #10b981;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#065f46;">
            <strong style="font-size:16px;">✓ All Systems Operational</strong><br/><br/>
            <strong>Type:</strong> ${maintenanceType}<br/>
            <strong>Completed:</strong> ${new Date(completedAt).toLocaleString()}<br/>
            <strong>Duration:</strong> ${duration}
          </td></tr>
        </table>
        
        ${
          improvements && improvements.length > 0
            ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">What's New:</strong>
            <ul style="margin:8px 0;padding-left:20px;color:#065f46;">
              ${improvementsHTML}
            </ul>
          </td></tr>
        </table>
        `
            : ''
        }
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you for your patience. All services are now fully operational.
        </p>
      `,
      ctaButton: {
        url: `${appUrl}`,
        text: 'Access Services',
        color: '#10b981'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * DATA_BACKUP_COMPLETED Email Template
 * Sent when: Scheduled data backup has completed
 */
const DATA_BACKUP_COMPLETED = ({
  backupType,
  completedAt,
  backupSize,
  status,
  nextScheduledBackup
}) => {
  const statusColor =
    status === 'success' ? '#10b981' : status === 'warning' ? '#f59e0b' : '#dc2626';
  const statusBg = status === 'success' ? '#d1fae5' : status === 'warning' ? '#fef3c7' : '#fee2e2';
  const statusIcon = status === 'success' ? '✓' : status === 'warning' ? '⚠️' : '✗';

  return {
    subject: `Backup Completed: ${backupType} [${status.toUpperCase()}]`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `${backupType} backup completed with status: ${status}`,
      title: 'Backup Complete',
      headerBg: statusColor,
      headerText: '💾 Backup Complete',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          <strong>Backup Notification</strong>
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:${statusBg};border-left:4px solid ${statusColor};border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <div style="font-size:16px;font-weight:700;margin-bottom:12px;color:${statusColor};">
              ${statusIcon} ${status.toUpperCase()}
            </div>
            <strong style="color:#111827;">Backup Type:</strong> ${backupType}<br/>
            <strong style="color:#111827;">Completed:</strong> ${new Date(completedAt).toLocaleString()}<br/>
            ${backupSize ? `<strong style="color:#111827;">Size:</strong> ${backupSize}<br/>` : ''}
            ${nextScheduledBackup ? `<strong style="color:#111827;">Next Backup:</strong> ${new Date(nextScheduledBackup).toLocaleString()}` : ''}
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          ${status === 'success' ? 'Your data has been backed up successfully.' : 'Please review the backup logs for details.'}
        </p>
      `,
      ctaButton: {
        url: ctaUrl || (ctaPath ? _appUrl + ctaPath : `${_appUrl}/admin/backups`),
        text: 'View Backup Details',
        color: statusColor
      },
      footerNote: 'This is an automated backup notification.'
    }),
    attachments: []
  };
};

/**
 * SERVER_RESTARTED Email Template
 * Sent when: Server has been restarted
 */
const SERVER_RESTARTED = ({
  serverName,
  restartReason,
  restartedAt,
  uptime,
  services,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  const servicesHTML =
    services && services.length > 0
      ? services.map(service => `<li style="margin:4px 0;">✓ ${service}</li>`).join('')
      : '<li>All services</li>';

  return {
    subject: `Server Restarted: ${serverName}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `${serverName} has been restarted.`,
      title: 'Server Restarted',
      headerBg: '#3b82f6',
      headerText: '🔄 Server Restarted',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          <strong>Server Restart Notification</strong>
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#dbeafe;border-left:4px solid #3b82f6;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#1e40af;">
            <strong style="font-size:16px;">Server Details</strong><br/><br/>
            <strong>Server:</strong> ${serverName}<br/>
            <strong>Restarted:</strong> ${new Date(restartedAt).toLocaleString()}<br/>
            ${uptime ? `<strong>Current Uptime:</strong> ${uptime}<br/>` : ''}
            ${restartReason ? `<strong>Reason:</strong> ${restartReason}` : ''}
          </td></tr>
        </table>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Services Status:</strong>
            <ul style="margin:8px 0;padding-left:20px;color:#065f46;">
              ${servicesHTML}
            </ul>
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          All services are operational. Monitor system performance for any issues.
        </p>
      `,
      ctaButton: {
        url: ctaUrl || `${_appUrl}/admin/servers/${serverName}`,
        text: 'View Server Status',
        color: '#3b82f6'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * SERVER_OVERLOADED Email Template
 * Sent when: Server load exceeds threshold
 */
const SERVER_OVERLOADED = ({
  serverName,
  cpuUsage,
  memoryUsage,
  diskUsage,
  detectedAt,
  threshold,
  recommendation,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `⚠️ Server Overload Alert: ${serverName}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `${serverName} is experiencing high load.`,
      title: 'Server Overload',
      headerBg: '#f59e0b',
      headerText: '⚠️ Server Overload',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          <strong>Server Performance Alert</strong>
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#92400e;">
            <strong>⚠️ HIGH LOAD DETECTED</strong><br/>
            Server: <strong>${serverName}</strong><br/>
            Detected: <strong>${new Date(detectedAt).toLocaleString()}</strong><br/>
            Threshold: <strong>${threshold}</strong>
          </td></tr>
        </table>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Resource Usage:</strong><br/><br/>
            ${cpuUsage ? `<strong>CPU:</strong> <span style="color:#f59e0b;font-size:16px;font-weight:700;">${cpuUsage}</span><br/>` : ''}
            ${memoryUsage ? `<strong>Memory:</strong> <span style="color:#f59e0b;font-size:16px;font-weight:700;">${memoryUsage}</span><br/>` : ''}
            ${diskUsage ? `<strong>Disk:</strong> <span style="color:#f59e0b;font-size:16px;font-weight:700;">${diskUsage}</span>` : ''}
          </td></tr>
        </table>
        
        ${
          recommendation
            ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fee2e2;border-left:4px solid #dc2626;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#7f1d1d;">
            <strong>⚡ RECOMMENDED ACTION:</strong><br/>
            ${recommendation}
          </td></tr>
        </table>
        `
            : ''
        }
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Immediate attention required to prevent service degradation.
        </p>
      `,
      ctaButton: {
        url: ctaUrl || `${_appUrl}/admin/servers/${serverName}/metrics`,
        text: 'View Server Metrics',
        color: '#f59e0b'
      },
      footerNote: 'This is an automated performance alert.'
    }),
    attachments: []
  };
};

/**
 * DEPLOYMENT_STARTED Email Template
 * Sent when: Deployment process has started
 */
const DEPLOYMENT_STARTED = ({
  version,
  environment,
  deployedBy,
  startedAt,
  estimatedDuration,
  changes
}) => {
  const changesHTML =
    changes && changes.length > 0
      ? changes.map(change => `<li style="margin:4px 0;">• ${change}</li>`).join('')
      : '';

  return {
    subject: `Deployment Started: ${version} → ${environment}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Deployment of version ${version} to ${environment} has started.`,
      title: 'Deployment Started',
      headerBg: '#3b82f6',
      headerText: '🚀 Deployment Started',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          <strong>Deployment Notification</strong>
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#dbeafe;border-left:4px solid #3b82f6;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#1e40af;">
            <strong style="font-size:16px;">🚀 Deployment In Progress</strong><br/><br/>
            <strong>Version:</strong> ${version}<br/>
            <strong>Environment:</strong> <span style="text-transform:uppercase;">${environment}</span><br/>
            <strong>Deployed By:</strong> ${deployedBy}<br/>
            <strong>Started:</strong> ${new Date(startedAt).toLocaleString()}<br/>
            ${estimatedDuration ? `<strong>Estimated Duration:</strong> ${estimatedDuration}` : ''}
          </td></tr>
        </table>
        
        ${
          changes && changes.length > 0
            ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Changes in This Release:</strong>
            <ul style="margin:8px 0;padding-left:20px;color:#4b5563;">
              ${changesHTML}
            </ul>
          </td></tr>
        </table>
        `
            : ''
        }
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          You'll be notified once the deployment is complete.
        </p>
      `,
      ctaButton: {
        url: ctaUrl || (ctaPath ? _appUrl + ctaPath : `${_appUrl}/admin/deployments`),
        text: 'View Deployment Status',
        color: '#3b82f6'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * DEPLOYMENT_COMPLETED Email Template
 * Sent when: Deployment has completed successfully
 */
const DEPLOYMENT_COMPLETED = ({
  version,
  environment,
  deployedBy,
  completedAt,
  duration,
  newFeatures
}) => {
  const featuresHTML =
    newFeatures && newFeatures.length > 0
      ? newFeatures.map(feature => `<li style="margin:4px 0;">✓ ${feature}</li>`).join('')
      : '';

  return {
    subject: `✅ Deployment Complete: ${version} → ${environment}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Version ${version} deployed successfully to ${environment}.`,
      title: 'Deployment Complete',
      headerBg: '#10b981',
      headerText: '✅ Deployment Complete',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          <strong>Deployment Successful</strong>
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#d1fae5;border-left:4px solid #10b981;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#065f46;">
            <strong style="font-size:16px;">✓ Deployment Successful</strong><br/><br/>
            <strong>Version:</strong> ${version}<br/>
            <strong>Environment:</strong> <span style="text-transform:uppercase;">${environment}</span><br/>
            <strong>Deployed By:</strong> ${deployedBy}<br/>
            <strong>Completed:</strong> ${new Date(completedAt).toLocaleString()}<br/>
            <strong>Duration:</strong> ${duration}
          </td></tr>
        </table>
        
        ${
          newFeatures && newFeatures.length > 0
            ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">🎉 What's New:</strong>
            <ul style="margin:8px 0;padding-left:20px;color:#065f46;">
              ${featuresHTML}
            </ul>
          </td></tr>
        </table>
        `
            : ''
        }
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          All systems are operational with the new version.
        </p>
      `,
      ctaButton: {
        url: ctaUrl || (ctaPath ? _appUrl + ctaPath : `${_appUrl}/admin/deployments`),
        text: 'View Deployment Details',
        color: '#10b981'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * DEPLOYMENT_FAILED Email Template
 * Sent when: Deployment has failed
 */
const DEPLOYMENT_FAILED = ({
  version,
  environment,
  deployedBy,
  failedAt,
  errorMessage,
  rollbackStatus,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `❌ Deployment Failed: ${version} → ${environment}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Deployment of version ${version} to ${environment} has failed.`,
      title: 'Deployment Failed',
      headerBg: '#dc2626',
      headerText: '❌ Deployment Failed',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          <strong>Deployment Failure Alert</strong>
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fee2e2;border-left:4px solid #dc2626;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#7f1d1d;">
            <strong style="font-size:16px;">❌ DEPLOYMENT FAILED</strong><br/><br/>
            <strong>Version:</strong> ${version}<br/>
            <strong>Environment:</strong> <span style="text-transform:uppercase;">${environment}</span><br/>
            <strong>Deployed By:</strong> ${deployedBy}<br/>
            <strong>Failed At:</strong> ${new Date(failedAt).toLocaleString()}
          </td></tr>
        </table>
        
        ${
          errorMessage
            ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Error Details:</strong><br/>
            <div style="color:#dc2626;margin-top:8px;padding:12px;background:#ffffff;border-radius:4px;font-family:monospace;font-size:13px;overflow-wrap:break-word;">${errorMessage}</div>
          </td></tr>
        </table>
        `
            : ''
        }
        
        ${
          rollbackStatus
            ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#92400e;">
            <strong>Rollback Status:</strong><br/>
            ${rollbackStatus}
          </td></tr>
        </table>
        `
            : ''
        }
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Immediate investigation required. Check deployment logs for details.
        </p>
      `,
      ctaButton: {
        url: ctaUrl || (ctaPath ? _appUrl + ctaPath : `${_appUrl}/admin/deployments/logs`),
        text: 'View Deployment Logs',
        color: '#dc2626'
      },
      footerNote: 'This is a critical deployment failure notification.'
    }),
    attachments: []
  };
};

/**
 * CONFIGURATION_CHANGED Email Template
 * Sent when: System configuration has been changed
 */
const CONFIGURATION_CHANGED = ({
  configType,
  changedBy,
  changedAt,
  changes,
  environment,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  const changesHTML =
    changes && changes.length > 0
      ? changes.map(change => `<li style="margin:4px 0;">• ${change}</li>`).join('')
      : '<li>Configuration updated</li>';

  return {
    subject: `Configuration Changed: ${configType}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `System configuration has been modified.`,
      title: 'Configuration Changed',
      headerBg: '#8b5cf6',
      headerText: '⚙️ Configuration Changed',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          <strong>Configuration Change Notification</strong>
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#ede9fe;border-left:4px solid #8b5cf6;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#5b21b6;">
            <strong style="font-size:16px;">Configuration Update</strong><br/><br/>
            <strong>Type:</strong> ${configType}<br/>
            ${environment ? `<strong>Environment:</strong> <span style="text-transform:uppercase;">${environment}</span><br/>` : ''}
            <strong>Changed By:</strong> ${changedBy}<br/>
            <strong>Changed At:</strong> ${new Date(changedAt).toLocaleString()}
          </td></tr>
        </table>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Changes Made:</strong>
            <ul style="margin:8px 0;padding-left:20px;color:#4b5563;">
              ${changesHTML}
            </ul>
          </td></tr>
        </table>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#92400e;">
            <strong>⚠️ Note:</strong> Please verify that all systems are functioning correctly after this configuration change.
          </td></tr>
        </table>
      `,
      ctaButton: {
        url: ctaUrl || (ctaPath ? _appUrl + ctaPath : `${_appUrl}/admin/config`),
        text: 'View Configuration',
        color: '#8b5cf6'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * SERVICE_OUTAGE_DETECTED Email Template
 * Sent when: Service outage is detected
 */
const SERVICE_OUTAGE_DETECTED = ({
  serviceName,
  detectedAt,
  affectedUsers,
  errorDetails,
  estimatedResolution,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `🚨 SERVICE OUTAGE: ${serviceName}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `${serviceName} is currently experiencing an outage.`,
      title: 'Service Outage',
      headerBg: '#dc2626',
      headerText: '🚨 Service Outage',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          <strong>Critical Service Outage</strong>
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#fee2e2;border-left:4px solid #dc2626;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#7f1d1d;">
            <strong style="font-size:18px;">🚨 OUTAGE DETECTED</strong><br/><br/>
            <strong>Service:</strong> ${serviceName}<br/>
            <strong>Detected:</strong> ${new Date(detectedAt).toLocaleString()}<br/>
            ${affectedUsers ? `<strong>Affected Users:</strong> ~${affectedUsers}<br/>` : ''}
            ${estimatedResolution ? `<strong>Estimated Resolution:</strong> ${estimatedResolution}` : ''}
          </td></tr>
        </table>
        
        ${
          errorDetails
            ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Error Details:</strong><br/>
            <div style="color:#4b5563;margin-top:8px;padding:12px;background:#ffffff;border-radius:4px;font-family:monospace;font-size:13px;overflow-wrap:break-word;">${errorDetails}</div>
          </td></tr>
        </table>
        `
            : ''
        }
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#92400e;">
            <strong>⚡ ACTION:</strong> Our engineering team has been alerted and is working to restore service immediately.
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          We'll provide updates as we work to resolve this issue.
        </p>
      `,
      ctaButton: {
        url: ctaUrl || (ctaPath ? _appUrl + ctaPath : `${_appUrl}/status`),
        text: 'View Status Page',
        color: '#dc2626'
      },
      footerNote: 'This is a critical outage notification.'
    }),
    attachments: []
  };
};

/**
 * SERVICE_RECOVERED Email Template
 * Sent when: Service has been restored after an outage
 */
const SERVICE_RECOVERED = ({
  serviceName,
  recoveredAt,
  outageDuration,
  rootCause,
  preventiveMeasures
}) => {
  return {
    subject: `✅ Service Restored: ${serviceName}`,
    html: buildEmailHTML({
      preheader: `${serviceName} has been fully restored.`,
      title: 'Service Restored',
      headerBg: '#10b981',
      headerText: '✅ Service Restored',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          <strong>Service Recovery Notification</strong>
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#d1fae5;border-left:4px solid #10b981;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#065f46;">
            <strong style="font-size:18px;">✅ SERVICE RESTORED</strong><br/><br/>
            <strong>Service:</strong> ${serviceName}<br/>
            <strong>Restored:</strong> ${new Date(recoveredAt).toLocaleString()}<br/>
            ${outageDuration ? `<strong>Total Outage Duration:</strong> ${outageDuration}` : ''}
          </td></tr>
        </table>
        
        ${
          rootCause
            ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Root Cause:</strong><br/>
            <div style="color:#4b5563;margin-top:8px;">${rootCause}</div>
          </td></tr>
        </table>
        `
            : ''
        }
        
        ${
          preventiveMeasures
            ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Preventive Measures:</strong><br/>
            <div style="color:#4b5563;margin-top:8px;">${preventiveMeasures}</div>
          </td></tr>
        </table>
        `
            : ''
        }
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          We apologize for any inconvenience. All services are now fully operational. Thank you for your patience.
        </p>
      `,
      ctaButton: {
        url: `${appUrl}`,
        text: 'Access Service',
        color: '#10b981'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * NEW_FEATURE_RELEASED Email Template
 * Sent when: A new feature has been released
 */
const NEW_FEATURE_RELEASED = ({
  featureName,
  releaseDate,
  description,
  benefits,
  learnMoreUrl
}) => {
  const benefitsHTML =
    benefits && benefits.length > 0
      ? benefits.map(benefit => `<li style="margin:4px 0;">✨ ${benefit}</li>`).join('')
      : '';

  return {
    subject: `🎉 New Feature Released: ${featureName}`,
    html: buildEmailHTML({
      preheader: `Introducing ${featureName} - Available now!`,
      title: 'New Feature',
      headerBg: '#8b5cf6',
      headerText: '🎉 New Feature Released',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We're excited to announce a new feature: <strong style="color:#8b5cf6;font-size:18px;">${featureName}</strong>!
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#ede9fe;border-left:4px solid #8b5cf6;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#5b21b6;">
            <strong style="font-size:16px;">🎉 ${featureName}</strong><br/><br/>
            ${description ? `<div style="color:#4b5563;margin:12px 0;">${description}</div>` : ''}
            <strong>Released:</strong> ${new Date(releaseDate).toLocaleDateString()}
          </td></tr>
        </table>
        
        ${
          benefits && benefits.length > 0
            ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">✨ What You Get:</strong>
            <ul style="margin:8px 0;padding-left:20px;color:#4b5563;">
              ${benefitsHTML}
            </ul>
          </td></tr>
        </table>
        `
            : ''
        }
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Start using this feature today and let us know what you think!
        </p>
      `,
      ctaButton: learnMoreUrl
        ? {
            url: learnMoreUrl,
            text: 'Learn More',
            color: '#8b5cf6'
          }
        : {
            url: `${appUrl}`,
            text: 'Try It Now',
            color: '#8b5cf6'
          },
      footerNote: null
    }),
    attachments: []
  };
};

// =====================================================================================
// 🚚 SHIPPING & LOGISTICS EMAIL TEMPLATES (8 Templates)
// =====================================================================================

/**
 * PACKAGE_DISPATCHED Email Template
 * Sent when: Package has been dispatched from warehouse
 */
const PACKAGE_DISPATCHED = ({
  username,
  orderId,
  trackingNumber,
  items,
  dispatchedAt,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  const itemsHTML =
    items && items.length > 0
      ? items.map(item => `<li style="margin:4px 0;">📦 ${item}</li>`).join('')
      : '<li>Your order items</li>';

  return {
    subject: `Package Dispatched - Order #${orderId}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Your package is on its way! Tracking: ${trackingNumber}`,
      title: 'Package Dispatched',
      headerBg: '#3b82f6',
      headerText: '📦 Package Dispatched',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'Customer'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your package for order <strong>#${orderId}</strong> has been dispatched from our warehouse!
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#dbeafe;border-left:4px solid #3b82f6;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#1e40af;">
            <strong style="font-size:16px;">📦 Dispatch Details</strong><br/><br/>
            <strong>Tracking Number:</strong> <span style="font-family:monospace;">${trackingNumber}</span><br/>
            <strong>Dispatched:</strong> ${new Date(dispatchedAt).toLocaleString()}
          </td></tr>
        </table>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Items in This Package:</strong>
            <ul style="margin:8px 0;padding-left:20px;color:#4b5563;">
              ${itemsHTML}
            </ul>
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Your package will soon be in transit. You'll receive another update when it's out for delivery.
        </p>
      `,
      ctaButton: {
        url: ctaUrl || `${_appUrl}/orders/${orderId}/track`,
        text: 'Track Package',
        color: '#3b82f6'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * PACKAGE_IN_TRANSIT Email Template
 * Sent when: Package is in transit
 */
const PACKAGE_IN_TRANSIT = ({
  username,
  orderId,
  trackingNumber,
  currentLocation,
  estimatedDelivery,
  carrier,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `Package In Transit - Order #${orderId}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Your package is in transit and on schedule.`,
      title: 'Package In Transit',
      headerBg: '#3b82f6',
      headerText: '🚚 In Transit',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'Customer'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your package is currently in transit!
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#dbeafe;border-left:4px solid #3b82f6;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#1e40af;">
            <strong>📍 Current Location:</strong> ${currentLocation || 'In transit'}<br/>
            <strong>Tracking:</strong> <span style="font-family:monospace;">${trackingNumber}</span><br/>
            <strong>Carrier:</strong> ${carrier || 'Standard Carrier'}<br/>
            ${estimatedDelivery ? `<strong>📅 Est. Delivery:</strong> ${new Date(estimatedDelivery).toLocaleDateString()}` : ''}
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Your package is on schedule for delivery. Check back soon for delivery updates!
        </p>
      `,
      ctaButton: {
        url: ctaUrl || `${_appUrl}/orders/${orderId}/track`,
        text: 'Track In Real-Time',
        color: '#3b82f6'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * PACKAGE_OUT_FOR_DELIVERY Email Template
 * Sent when: Package is out for delivery
 */
const PACKAGE_OUT_FOR_DELIVERY = ({
  username,
  orderId,
  trackingNumber,
  estimatedDelivery,
  deliveryAddress,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `🎉 Out for Delivery Today - Order #${orderId}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Your package is out for delivery today!`,
      title: 'Out for Delivery',
      headerBg: '#10b981',
      headerText: '🎉 Out for Delivery!',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'Customer'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Great news! Your package is out for delivery today!
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#d1fae5;border-left:4px solid #10b981;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#065f46;">
            <strong style="font-size:16px;">🎉 Out for Delivery</strong><br/><br/>
            <strong>Tracking:</strong> <span style="font-family:monospace;">${trackingNumber}</span><br/>
            ${estimatedDelivery ? `<strong>📅 Expected:</strong> ${new Date(estimatedDelivery).toLocaleString()}<br/>` : ''}
            ${deliveryAddress ? `<strong>📍 Delivery To:</strong> ${deliveryAddress}` : ''}
          </td></tr>
        </table>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#92400e;">
            <strong>💡 Tip:</strong> Be available to receive your package. If you're not home, the driver may leave it in a safe place or require a signature.
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you for your order!
        </p>
      `,
      ctaButton: {
        url: ctaUrl || `${_appUrl}/orders/${orderId}/track`,
        text: 'Live Tracking',
        color: '#10b981'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * PACKAGE_DELIVERED Email Template
 * Sent when: Package has been delivered
 */
const PACKAGE_DELIVERED = ({
  username,
  orderId,
  deliveredAt,
  signedBy,
  deliveryAddress,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `📬 Package Delivered - Order #${orderId}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Your package has been delivered!`,
      title: 'Package Delivered',
      headerBg: '#10b981',
      headerText: '📬 Delivered!',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'Customer'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your package has been delivered successfully!
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#d1fae5;border-left:4px solid #10b981;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#065f46;">
            <strong style="font-size:16px;">✓ Delivered</strong><br/><br/>
            <strong>Delivered:</strong> ${new Date(deliveredAt).toLocaleString()}<br/>
            ${deliveryAddress ? `<strong>Location:</strong> ${deliveryAddress}<br/>` : ''}
            ${signedBy ? `<strong>Signed By:</strong> ${signedBy}` : ''}
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          We hope you love your purchase! Please take a moment to review your order and leave feedback.
        </p>
      `,
      ctaButton: {
        url: ctaUrl || `${_appUrl}/orders/${orderId}/review`,
        text: 'Leave a Review',
        color: '#10b981'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * PACKAGE_DELAYED Email Template
 * Sent when: Package delivery is delayed
 */
const PACKAGE_DELAYED = ({
  username,
  orderId,
  trackingNumber,
  originalDelivery,
  newDelivery,
  reason,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `⏰ Delivery Delayed - Order #${orderId}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Your package delivery has been delayed.`,
      title: 'Delivery Delayed',
      headerBg: '#f59e0b',
      headerText: '⏰ Delivery Delayed',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'Customer'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We regret to inform you that your package delivery has been delayed.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#92400e;">
            <strong>⏰ Delay Notice</strong><br/>
            <strong>Tracking:</strong> <span style="font-family:monospace;">${trackingNumber}</span><br/>
            ${reason ? `<strong>Reason:</strong> ${reason}<br/>` : ''}
            ${originalDelivery ? `<strong>Originally:</strong> ${new Date(originalDelivery).toLocaleDateString()}<br/>` : ''}
            ${newDelivery ? `<strong>New Delivery:</strong> ${new Date(newDelivery).toLocaleDateString()}` : ''}
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          We apologize for the inconvenience and appreciate your patience.
        </p>
      `,
      ctaButton: {
        url: ctaUrl || `${_appUrl}/orders/${orderId}/track`,
        text: 'Track Package',
        color: '#f59e0b'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * PACKAGE_LOST Email Template
 * Sent when: Package has been lost
 */
const PACKAGE_LOST = ({
  username,
  orderId,
  trackingNumber,
  lastLocation,
  reportedAt,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `Package Lost - Order #${orderId}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Your package could not be located.`,
      title: 'Package Lost',
      headerBg: '#dc2626',
      headerText: '⚠️ Package Lost',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'Customer'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Unfortunately, we have been unable to locate your package for order <strong>#${orderId}</strong>.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fee2e2;border-left:4px solid #dc2626;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#7f1d1d;">
            <strong>❌ Package Lost</strong><br/>
            <strong>Tracking:</strong> <span style="font-family:monospace;">${trackingNumber}</span><br/>
            ${lastLocation ? `<strong>Last Location:</strong> ${lastLocation}<br/>` : ''}
            <strong>Reported:</strong> ${new Date(reportedAt).toLocaleString()}
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          We will file a claim and arrange a replacement or refund immediately. Please contact our support team for assistance.
        </p>
      `,
      ctaButton: {
        url: ctaUrl || (ctaPath ? _appUrl + ctaPath : `${_appUrl}/support/lost-package`),
        text: 'Report Issue',
        color: '#dc2626'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * DELIVERY_EXCEPTION Email Template
 * Sent when: Delivery exception occurs
 */
const DELIVERY_EXCEPTION = ({
  username,
  orderId,
  trackingNumber,
  exceptionType,
  details,
  nextStep,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `Delivery Exception - Order #${orderId}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `There's an issue with your package delivery.`,
      title: 'Delivery Exception',
      headerBg: '#f59e0b',
      headerText: '⚠️ Delivery Exception',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'Customer'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          There's an issue with your package delivery for order <strong>#${orderId}</strong>.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#92400e;">
            <strong>⚠️ Exception Details</strong><br/>
            <strong>Tracking:</strong> <span style="font-family:monospace;">${trackingNumber}</span><br/>
            <strong>Exception:</strong> ${exceptionType || 'Delivery exception'}<br/>
            ${details ? `<strong>Details:</strong> ${details}` : ''}
          </td></tr>
        </table>
        
        ${
          nextStep
            ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fee2e2;border-left:4px solid #dc2626;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#7f1d1d;">
            <strong>🔔 Action Needed:</strong><br/>
            ${nextStep}
          </td></tr>
        </table>
        `
            : ''
        }
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Please contact support for immediate assistance.
        </p>
      `,
      ctaButton: {
        url: ctaUrl || (ctaPath ? _appUrl + ctaPath : `${_appUrl}/support`),
        text: 'Contact Support',
        color: '#f59e0b'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * CUSTOMS_HOLD Email Template
 * Sent when: Package is held in customs
 */
const CUSTOMS_HOLD = ({
  username,
  orderId,
  trackingNumber,
  holdReason,
  estimatedClearing,
  requiredActions,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `Customs Hold - Order #${orderId}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Your package is held in customs.`,
      title: 'Customs Hold',
      headerBg: '#f59e0b',
      headerText: '🛂 Customs Hold',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'Customer'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your package for order <strong>#${orderId}</strong> is being held in customs for inspection.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#92400e;">
            <strong>🛂 Customs Details</strong><br/>
            <strong>Tracking:</strong> <span style="font-family:monospace;">${trackingNumber}</span><br/>
            ${holdReason ? `<strong>Reason:</strong> ${holdReason}<br/>` : ''}
            ${estimatedClearing ? `<strong>Est. Clearing:</strong> ${new Date(estimatedClearing).toLocaleDateString()}` : ''}
          </td></tr>
        </table>
        
        ${
          requiredActions
            ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fee2e2;border-left:4px solid #dc2626;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#7f1d1d;">
            <strong>⚠️ Action Required:</strong><br/>
            ${requiredActions}
          </td></tr>
        </table>
        `
            : ''
        }
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          This is normal for international shipments. Your package will be delivered once customs inspection is complete.
        </p>
      `,
      ctaButton: {
        url: ctaUrl || `${_appUrl}/orders/${orderId}/track`,
        text: 'Track Package',
        color: '#f59e0b'
      },
      footerNote: null
    }),
    attachments: []
  };
};

// =====================================================================================
// 🎯 MARKETING & PROMOTIONS EMAIL TEMPLATES (10 Templates)
// =====================================================================================

/**
 * PROMOTION_LAUNCHED Email Template
 * Sent when: A new promotion has been launched
 */
const PROMOTION_LAUNCHED = ({
  username,
  promotionName,
  description,
  discountPercentage,
  validFrom,
  validTo,
  exclusions,
  promoCode,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `🎉 New Promotion: ${promotionName} - ${discountPercentage}% Off!`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `${discountPercentage}% off on ${promotionName}. Limited time only!`,
      title: 'New Promotion',
      headerBg: '#ec4899',
      headerText: '🎉 New Promotion',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'Valued Customer'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We're excited to announce our new promotion: <strong style="font-size:18px;color:#ec4899;">${promotionName}</strong>!
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#fce7f3;border-left:4px solid #ec4899;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#831843;">
            <div style="font-size:24px;font-weight:700;margin-bottom:12px;color:#ec4899;">${discountPercentage}% OFF</div>
            ${description ? `<div style="color:#4b5563;margin:12px 0;">${description}</div>` : ''}
            <br/>
            <strong>Valid:</strong> ${new Date(validFrom).toLocaleDateString()} - ${new Date(validTo).toLocaleDateString()}<br/>
            ${promoCode ? `<div style="background:#ffffff;border:2px dashed #ec4899;padding:12px;margin-top:12px;text-align:center;"><strong>Promo Code:</strong> <span style="font-family:monospace;font-size:16px;font-weight:700;">${promoCode}</span></div>` : ''}
          </td></tr>
        </table>
        
        ${
          exclusions
            ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:13px;color:#6b7280;">
            <strong>Exclusions:</strong> ${exclusions}
          </td></tr>
        </table>
        `
            : ''
        }
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Don't miss out! Offer valid for a limited time only.
        </p>
      `,
      ctaButton: {
        url: ctaUrl || (ctaPath ? _appUrl + ctaPath : `${_appUrl}/shop`),
        text: 'Shop Now',
        color: '#ec4899'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * DISCOUNT_APPLIED Email Template
 * Sent when: Discount has been applied to customer account
 */
const DISCOUNT_APPLIED = ({
  username,
  discountAmount,
  discountType,
  expiryDate,
  terms,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `✨ Discount Applied: ${discountAmount} Off!`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `You have ${discountAmount} in credits!`,
      title: 'Discount Applied',
      headerBg: '#10b981',
      headerText: '✨ Discount Applied',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'Valued Customer'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Great news! A discount has been applied to your account.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#d1fae5;border-left:4px solid #10b981;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#065f46;">
            <div style="font-size:28px;font-weight:700;margin-bottom:12px;color:#10b981;">${discountAmount}</div>
            <strong>Type:</strong> ${discountType || 'Discount'}<br/>
            ${expiryDate ? `<strong>Expires:</strong> ${new Date(expiryDate).toLocaleDateString()}` : ''}
          </td></tr>
        </table>
        
        ${
          terms
            ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:13px;color:#6b7280;">
            <strong>Terms:</strong> ${terms}
          </td></tr>
        </table>
        `
            : ''
        }
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Use this discount on your next purchase!
        </p>
      `,
      ctaButton: {
        url: ctaUrl || (ctaPath ? _appUrl + ctaPath : `${_appUrl}/shop`),
        text: 'Start Shopping',
        color: '#10b981'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * FLASH_SALE_ANNOUNCEMENT Email Template
 * Sent when: Flash sale is announced
 */
const FLASH_SALE_ANNOUNCEMENT = ({
  saleName,
  startsAt,
  endsAt,
  featured,
  discount,
  urgency,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  const itemsHTML =
    featured && featured.length > 0
      ? featured.map(item => `<li style="margin:4px 0;">🔥 ${item}</li>`).join('')
      : '';

  return {
    subject: `🔥 FLASH SALE: ${discount}% Off - Starts Now!`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `${discount}% off flash sale for limited time!`,
      title: 'Flash Sale',
      headerBg: '#dc2626',
      headerText: '🔥 FLASH SALE',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          ⚡ <strong style="font-size:18px;">FLASH SALE HAPPENING NOW!</strong> ⚡
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#fee2e2;border-left:4px solid #dc2626;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#7f1d1d;">
            <div style="font-size:28px;font-weight:700;margin-bottom:12px;">${discount}% OFF</div>
            <strong>Sale:</strong> ${saleName}<br/>
            <strong>⏰ Starts:</strong> ${new Date(startsAt).toLocaleString()}<br/>
            <strong>⏳ Ends:</strong> ${new Date(endsAt).toLocaleString()}
          </td></tr>
        </table>
        
        ${
          featured && featured.length > 0
            ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">🔥 Featured Items:</strong>
            <ul style="margin:8px 0;padding-left:20px;color:#4b5563;">
              ${itemsHTML}
            </ul>
          </td></tr>
        </table>
        `
            : ''
        }
        
        ${
          urgency
            ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#92400e;">
            <strong>⚡ ${urgency}</strong>
          </td></tr>
        </table>
        `
            : ''
        }
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          This is a LIMITED TIME offer. Shop now before items sell out!
        </p>
      `,
      ctaButton: {
        url: ctaUrl || (ctaPath ? _appUrl + ctaPath : `${_appUrl}/flash-sale`),
        text: 'Shop Flash Sale',
        color: '#dc2626'
      },
      footerNote: 'Hurry! Limited stock available!'
    }),
    attachments: []
  };
};

/**
 * LOYALTY_POINTS_EARNED Email Template
 * Sent when: Customer has earned loyalty points
 */
const LOYALTY_POINTS_EARNED = ({
  username,
  pointsEarned,
  totalPoints,
  reason,
  redeemValue,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `⭐ You Earned ${pointsEarned} Loyalty Points!`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `${pointsEarned} points added to your loyalty account!`,
      title: 'Points Earned',
      headerBg: '#f59e0b',
      headerText: '⭐ Points Earned',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'Valued Customer'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Congratulations! You've earned loyalty points.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#92400e;">
            <div style="font-size:28px;font-weight:700;margin-bottom:12px;color:#f59e0b;">+${pointsEarned} Points</div>
            <strong>Total Points:</strong> ${totalPoints}<br/>
            ${reason ? `<strong>Reason:</strong> ${reason}<br/>` : ''}
            ${redeemValue ? `<strong>Redeem Value:</strong> ${redeemValue}` : ''}
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Keep earning points with every purchase and redeem them for rewards!
        </p>
      `,
      ctaButton: {
        url: ctaUrl || (ctaPath ? _appUrl + ctaPath : `${_appUrl}/loyalty`),
        text: 'View Rewards',
        color: '#f59e0b'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * LOYALTY_POINTS_REDEEMED Email Template
 * Sent when: Customer has redeemed loyalty points
 */
const LOYALTY_POINTS_REDEEMED = ({
  username,
  pointsRedeemed,
  remainingPoints,
  redemptionValue,
  rewardDescription,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `✅ Loyalty Points Redeemed!`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `You've redeemed ${pointsRedeemed} points for rewards!`,
      title: 'Points Redeemed',
      headerBg: '#10b981',
      headerText: '✅ Points Redeemed',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'Valued Customer'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your loyalty points have been successfully redeemed!
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#d1fae5;border-left:4px solid #10b981;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#065f46;">
            <strong>Redemption Summary:</strong><br/>
            <strong>Points Redeemed:</strong> -${pointsRedeemed}<br/>
            <strong>Reward Value:</strong> ${redemptionValue}<br/>
            <strong>Remaining Points:</strong> ${remainingPoints}<br/>
            ${rewardDescription ? `<strong>Reward:</strong> ${rewardDescription}` : ''}
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Your reward is being processed. You'll receive another email with redemption details soon!
        </p>
      `,
      ctaButton: {
        url: ctaUrl || (ctaPath ? _appUrl + ctaPath : `${_appUrl}/loyalty`),
        text: 'View Account',
        color: '#10b981'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * NEW_PRODUCT_LAUNCH Email Template
 * Sent when: A new product is launched
 */
const NEW_PRODUCT_LAUNCH = ({
  username,
  productName,
  productImage,
  description,
  launchDate,
  specialOffer,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `🚀 New Product Launch: ${productName}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Introducing ${productName} - Available now!`,
      title: 'New Product Launch',
      headerBg: '#8b5cf6',
      headerText: '🚀 New Product',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'Valued Customer'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We're thrilled to announce the launch of our latest innovation!
        </p>
        
        ${
          productImage
            ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;text-align:center;">
          <tr>
            <td>
              <img src="${productImage}" alt="${productName}" style="max-width:300px;border-radius:8px;" />
            </td>
          </tr>
        </table>
        `
            : ''
        }
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#ede9fe;border-left:4px solid #8b5cf6;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#5b21b6;">
            <strong style="font-size:18px;">🚀 ${productName}</strong><br/><br/>
            ${description ? `<div style="color:#4b5563;margin:12px 0;">${description}</div>` : ''}
            <strong>Launch Date:</strong> ${new Date(launchDate).toLocaleDateString()}<br/>
            ${specialOffer ? `<strong>Launch Offer:</strong> ${specialOffer}` : ''}
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Be among the first to experience this amazing product!
        </p>
      `,
      ctaButton: {
        url: ctaUrl || `${_appUrl}/products/${productName.toLowerCase().replace(/\s+/g, '-')}`,
        text: 'Shop Now',
        color: '#8b5cf6'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * CUSTOMER_MILESTONE Email Template
 * Sent when: Customer reaches milestone (1st order, 100th day, etc.)
 */
const CUSTOMER_MILESTONE = ({
  username,
  milestoneType,
  milestoneValue,
  bonus,
  celebrationMessage,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `🎉 Congratulations ${username}! ${milestoneType} Milestone Reached!`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `You've reached a milestone with us!`,
      title: 'Milestone Reached',
      headerBg: '#ec4899',
      headerText: '🎉 Milestone Reached!',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'Valued Customer'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          🎉 Congratulations! You've reached a special milestone with us!
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#fce7f3;border-left:4px solid #ec4899;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#831843;">
            <div style="font-size:24px;font-weight:700;margin-bottom:8px;">${milestoneValue}</div>
            <strong>${milestoneType}</strong><br/><br/>
            ${celebrationMessage ? `<div style="color:#4b5563;margin-top:12px;">${celebrationMessage}</div>` : ''}
          </td></tr>
        </table>
        
        ${
          bonus
            ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">🎁 Special Bonus:</strong><br/>
            <div style="color:#4b5563;margin-top:8px;">${bonus}</div>
          </td></tr>
        </table>
        `
            : ''
        }
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you for being such a valued customer!
        </p>
      `,
      ctaButton: {
        url: ctaUrl || (ctaPath ? _appUrl + ctaPath : `${_appUrl}/shop`),
        text: 'Continue Shopping',
        color: '#ec4899'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * REVIEW_REMINDER Email Template
 * Sent when: Reminding customer to leave a review
 */
const REVIEW_REMINDER = ({
  username,
  productName,
  orderId,
  purchaseDate,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `How did you like your ${productName}?`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Share your experience with ${productName}!`,
      title: 'Review Reminder',
      headerBg: '#3b82f6',
      headerText: '⭐ Leave a Review',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'Valued Customer'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We'd love to hear what you think about your recent purchase: <strong>${productName}</strong>!
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#dbeafe;border-left:4px solid #3b82f6;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#1e40af;">
            <strong>⭐ Your Review Matters</strong><br/><br/>
            Your feedback helps us improve and helps other customers make informed decisions.<br/>
            <strong>Order #${orderId}</strong><br/>
            Purchased: ${new Date(purchaseDate).toLocaleDateString()}
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          It only takes a minute to share your thoughts!
        </p>
      `,
      ctaButton: {
        url: ctaUrl || `${_appUrl}/orders/${orderId}/review`,
        text: 'Write a Review',
        color: '#3b82f6'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * EVENT_INVITATION Email Template
 * Sent when: Inviting customer to event
 */
const EVENT_INVITATION = ({
  username,
  eventName,
  eventDate,
  eventTime,
  location,
  description,
  rsvpUrl,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `You're Invited: ${eventName}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Join us for ${eventName}!`,
      title: 'Event Invitation',
      headerBg: '#ec4899',
      headerText: "📅 You're Invited!",
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'Valued Customer'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We'd love for you to join us at our upcoming event!
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#fce7f3;border-left:4px solid #ec4899;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#831843;">
            <strong style="font-size:18px;">📅 ${eventName}</strong><br/><br/>
            <strong>📆 Date:</strong> ${new Date(eventDate).toLocaleDateString()}<br/>
            <strong>🕐 Time:</strong> ${eventTime}<br/>
            ${location ? `<strong>📍 Location:</strong> ${location}<br/>` : ''}
            ${description ? `<div style="margin-top:12px;color:#4b5563;">${description}</div>` : ''}
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Save the date and let us know if you can make it!
        </p>
      `,
      ctaButton: {
        url: rsvpUrl || ctaUrl || `${_appUrl}/events`,
        text: 'RSVP Now',
        color: '#ec4899'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * HOLIDAY_GREETINGS Email Template
 * Sent when: Sending holiday greetings
 */
const HOLIDAY_GREETINGS = ({
  username,
  holidayName,
  greeting,
  specialOffer,
  endDate,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `Happy ${holidayName}! Special Offer Inside 🎉`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Happy ${holidayName}! Enjoy a special offer just for you.`,
      title: 'Holiday Greetings',
      headerBg: '#dc2626',
      headerText: '🎄 Happy Holidays!',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'Valued Customer'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          ${greeting || `Wishing you joy and happiness this ${holidayName}!`}
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#fee2e2;border-left:4px solid #dc2626;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#7f1d1d;text-align:center;">
            <div style="font-size:32px;margin-bottom:12px;">🎉🎄✨</div>
            <strong style="font-size:18px;">${holidayName}</strong><br/>
            ${specialOffer ? `<div style="margin-top:12px;font-size:18px;font-weight:700;">${specialOffer}</div>` : ''}
            ${endDate ? `<div style="font-size:12px;margin-top:8px;">Valid until ${new Date(endDate).toLocaleDateString()}</div>` : ''}
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Spread the joy and share this offer with friends and family!
        </p>
      `,
      ctaButton: {
        url: ctaUrl || (ctaPath ? _appUrl + ctaPath : `${_appUrl}/shop`),
        text: 'Shop Holiday Deals',
        color: '#dc2626'
      },
      footerNote: null
    }),
    attachments: []
  };
};

// =====================================================================================
// 🧾 PRODUCT & INVENTORY EMAIL TEMPLATES (15 Templates)
// =====================================================================================

/**
 * PRODUCT_CREATED Email Template
 * Sent when: New product is created in inventory
 */
const PRODUCT_CREATED = ({
  productName,
  productId,
  sku,
  category,
  pricing,
  createdAt,
  createdBy,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `Product Created: ${productName}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `New product ${productName} has been added to inventory.`,
      title: 'Product Created',
      headerBg: '#8b5cf6',
      headerText: '📝 Product Created',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          <strong>Product Creation Notification</strong>
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#ede9fe;border-left:4px solid #8b5cf6;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#5b21b6;">
            <strong style="font-size:16px;">📝 ${productName}</strong><br/><br/>
            <strong>Product ID:</strong> ${productId}<br/>
            <strong>SKU:</strong> ${sku}<br/>
            <strong>Category:</strong> ${category}<br/>
            ${pricing ? `<strong>Pricing:</strong> ${pricing}<br/>` : ''}
            <strong>Created By:</strong> ${createdBy}<br/>
            <strong>Date:</strong> ${new Date(createdAt).toLocaleString()}
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Product is now in the system and ready for listing.
        </p>
      `,
      ctaButton: {
        url: ctaUrl || `${_appUrl}/admin/products/${productId}`,
        text: 'View Product',
        color: '#8b5cf6'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * PRODUCT_UPDATED Email Template
 * Sent when: Product details are updated
 */
const PRODUCT_UPDATED = ({
  productName,
  productId,
  updatedFields,
  updatedBy,
  updatedAt,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  const fieldsHTML =
    updatedFields && updatedFields.length > 0
      ? updatedFields.map(field => `<li style="margin:4px 0;">• ${field}</li>`).join('')
      : '';

  return {
    subject: `Product Updated: ${productName}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `${productName} product details have been updated.`,
      title: 'Product Updated',
      headerBg: '#3b82f6',
      headerText: '✏️ Product Updated',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          <strong>Product Update Notification</strong>
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#dbeafe;border-left:4px solid #3b82f6;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#1e40af;">
            <strong>✏️ ${productName}</strong><br/><br/>
            <strong>Product ID:</strong> ${productId}<br/>
            <strong>Updated By:</strong> ${updatedBy}<br/>
            <strong>Date:</strong> ${new Date(updatedAt).toLocaleString()}
          </td></tr>
        </table>
        
        ${
          fieldsHTML
            ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Updated Fields:</strong>
            <ul style="margin:8px 0;padding-left:20px;color:#4b5563;">
              ${fieldsHTML}
            </ul>
          </td></tr>
        </table>
        `
            : ''
        }
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Changes have been applied to the product.
        </p>
      `,
      ctaButton: {
        url: ctaUrl || `${_appUrl}/admin/products/${productId}`,
        text: 'View Product',
        color: '#3b82f6'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * PRODUCT_DELETED Email Template
 * Sent when: Product is deleted
 */
const PRODUCT_DELETED = ({ productName, productId, deletedBy, reason, deletedAt }) => {
  return {
    subject: `Product Deleted: ${productName}`,
    html: buildEmailHTML({
      preheader: `${productName} has been deleted from inventory.`,
      title: 'Product Deleted',
      headerBg: '#6b7280',
      headerText: '🗑️ Product Deleted',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          <strong>Product Deletion Notification</strong>
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#e5e7eb;border-left:4px solid #6b7280;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#374151;">
            <strong>🗑️ ${productName}</strong><br/><br/>
            <strong>Product ID:</strong> ${productId}<br/>
            ${reason ? `<strong>Reason:</strong> ${reason}<br/>` : ''}
            <strong>Deleted By:</strong> ${deletedBy}<br/>
            <strong>Date:</strong> ${new Date(deletedAt).toLocaleString()}
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          The product has been permanently removed from the system.
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * PRODUCT_FEATURED Email Template
 * Sent when: Product is featured
 */
const PRODUCT_FEATURED = ({
  productName,
  productId,
  featureType,
  startDate,
  endDate,
  placement,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `🌟 Product Featured: ${productName}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `${productName} is now featured!`,
      title: 'Product Featured',
      headerBg: '#f59e0b',
      headerText: '🌟 Product Featured',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          <strong>Product Feature Notification</strong>
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#92400e;">
            <strong style="font-size:16px;">🌟 ${productName}</strong><br/><br/>
            <strong>Feature Type:</strong> ${featureType}<br/>
            <strong>Placement:</strong> ${placement}<br/>
            <strong>Start Date:</strong> ${new Date(startDate).toLocaleDateString()}<br/>
            <strong>End Date:</strong> ${new Date(endDate).toLocaleDateString()}
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Your product is getting premium visibility. Monitor sales for this period!
        </p>
      `,
      ctaButton: {
        url: ctaUrl || `${_appUrl}/admin/products/${productId}`,
        text: 'View Product',
        color: '#f59e0b'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * PRODUCT_BACK_IN_STOCK Email Template
 * Sent when: Out-of-stock product is back in stock
 */
const PRODUCT_BACK_IN_STOCK = ({
  username,
  productName,
  productId,
  quantityRestocked,
  restockDate,
  productUrl,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `✅ Back in Stock: ${productName}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `${productName} is back in stock!`,
      title: 'Back in Stock',
      headerBg: '#10b981',
      headerText: '✅ Back in Stock',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'Valued Customer'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Great news! <strong>${productName}</strong> is back in stock!
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#d1fae5;border-left:4px solid #10b981;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#065f46;">
            <strong style="font-size:16px;">✓ In Stock</strong><br/><br/>
            <strong>Product:</strong> ${productName}<br/>
            <strong>Quantity Available:</strong> ${quantityRestocked}<br/>
            <strong>Restocked:</strong> ${new Date(restockDate).toLocaleString()}
          </td></tr>
        </table>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#92400e;">
            <strong>⚡ Act Fast!</strong> Popular items sell quickly!
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Don't miss out this time!
        </p>
      `,
      ctaButton: {
        url: productUrl || ctaUrl || `${_appUrl}/products/${productId}`,
        text: 'Shop Now',
        color: '#10b981'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * PRODUCT_REVIEWED Email Template
 * Sent when: Product receives a review
 */
const PRODUCT_REVIEWED = ({
  productName,
  productId,
  reviewerName,
  rating,
  reviewText,
  approvalStatus
}) => {
  const stars = '⭐'.repeat(rating || 5);

  return {
    subject: `New Review for ${productName}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `${reviewerName} left a ${rating}-star review for ${productName}.`,
      title: 'Product Reviewed',
      headerBg: '#f59e0b',
      headerText: '⭐ Product Review',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          <strong>Product Review Notification</strong>
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#fffbeb;border-left:4px solid #f59e0b;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="font-size:16px;">⭐ ${productName}</strong><br/><br/>
            <div style="font-size:20px;margin:8px 0;">${stars}</div>
            <strong>Reviewer:</strong> ${reviewerName}<br/>
            <strong>Rating:</strong> ${rating}/5<br/>
            <strong>Status:</strong> ${approvalStatus || 'Pending Review'}
          </td></tr>
        </table>
        
        ${
          reviewText
            ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Review:</strong><br/>
            <div style="color:#4b5563;margin-top:8px;font-style:italic;">"${reviewText}"</div>
          </td></tr>
        </table>
        `
            : ''
        }
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          ${approvalStatus === 'pending' ? 'Please review and approve this submission.' : 'Review has been published.'}
        </p>
      `,
      ctaButton: {
        url: ctaUrl || `${_appUrl}/admin/products/${productId}/reviews`,
        text: 'Manage Reviews',
        color: '#f59e0b'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * PRODUCT_OUT_OF_STOCK Email Template
 * Sent when: Product goes out of stock
 */
const PRODUCT_OUT_OF_STOCK = ({
  productName,
  productId,
  lastInStock,
  expectedRestock,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `Out of Stock: ${productName}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `${productName} is now out of stock.`,
      title: 'Out of Stock',
      headerBg: '#6b7280',
      headerText: '🔄 Out of Stock',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          <strong>Stock Alert Notification</strong>
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#e5e7eb;border-left:4px solid #6b7280;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#374151;">
            <strong>🔄 ${productName}</strong><br/><br/>
            <strong>Last In Stock:</strong> ${new Date(lastInStock).toLocaleString()}<br/>
            ${expectedRestock ? `<strong>Expected Restock:</strong> ${new Date(expectedRestock).toLocaleDateString()}` : 'Expected restock date: TBD'}
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Monitor inventory levels and schedule replenishment as needed.
        </p>
      `,
      ctaButton: {
        url: ctaUrl || `${_appUrl}/admin/inventory/${productId}`,
        text: 'View Inventory',
        color: '#6b7280'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * PRODUCT_ARCHIVED Email Template
 * Sent when: Product is archived
 */
const PRODUCT_ARCHIVED = ({
  productName,
  productId,
  archivedBy,
  reason,
  archivedAt,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `Product Archived: ${productName}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `${productName} has been archived.`,
      title: 'Product Archived',
      headerBg: '#6b7280',
      headerText: '📦 Product Archived',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          <strong>Product Archive Notification</strong>
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#e5e7eb;border-left:4px solid #6b7280;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#374151;">
            <strong>📦 ${productName}</strong><br/><br/>
            <strong>Product ID:</strong> ${productId}<br/>
            ${reason ? `<strong>Reason:</strong> ${reason}<br/>` : ''}
            <strong>Archived By:</strong> ${archivedBy}<br/>
            <strong>Date:</strong> ${new Date(archivedAt).toLocaleString()}
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          The product is now archived and no longer visible to customers.
        </p>
      `,
      ctaButton: {
        url: ctaUrl || `${_appUrl}/admin/products/${productId}`,
        text: 'View Product',
        color: '#6b7280'
      },
      footerNote: null
    }),
    attachments: []
  };
};

// =====================================================================================
// 📊 INVENTORY EMAIL TEMPLATES (7 Templates)
// =====================================================================================

/**
 * STOCK_LOW Email Template
 * Sent when: Stock level is low
 */
const STOCK_LOW = ({
  productName,
  currentStock,
  minimumThreshold,
  recommendedAction,
  productId,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `Low Stock Alert: ${productName}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Stock for ${productName} is running low.`,
      title: 'Low Stock',
      headerBg: '#f59e0b',
      headerText: '⚠️ Low Stock',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          <strong>Inventory Alert</strong>
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#92400e;">
            <strong>⚠️ Low Stock Alert</strong><br/>
            <strong>Product:</strong> ${productName}<br/>
            <strong>Current Stock:</strong> ${currentStock}<br/>
            <strong>Minimum Threshold:</strong> ${minimumThreshold}
          </td></tr>
        </table>
        
        ${
          recommendedAction
            ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fee2e2;border-left:4px solid #dc2626;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#7f1d1d;">
            <strong>📋 Recommended Action:</strong><br/>
            ${recommendedAction}
          </td></tr>
        </table>
        `
            : ''
        }
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Consider placing a replenishment order soon.
        </p>
      `,
      ctaButton: {
        url: ctaUrl || `${_appUrl}/admin/inventory/${productId}`,
        text: 'Manage Inventory',
        color: '#f59e0b'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * STOCK_CRITICAL Email Template
 * Sent when: Stock level is critical
 */
const STOCK_CRITICAL = ({
  productName,
  currentStock,
  criticalThreshold,
  urgentAction,
  productId,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `🚨 CRITICAL: Stock Almost Gone - ${productName}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `URGENT: ${productName} stock is critical!`,
      title: 'Critical Stock',
      headerBg: '#dc2626',
      headerText: '🚨 Critical Stock',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          <strong>URGENT Inventory Alert</strong>
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fee2e2;border-left:4px solid #dc2626;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#7f1d1d;">
            <strong style="font-size:16px;">🚨 CRITICAL STOCK LEVEL</strong><br/><br/>
            <strong>Product:</strong> ${productName}<br/>
            <strong>Current Stock:</strong> ${currentStock}<br/>
            <strong>Critical Threshold:</strong> ${criticalThreshold}
          </td></tr>
        </table>
        
        ${
          urgentAction
            ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#92400e;">
            <strong>⚡ URGENT ACTION REQUIRED:</strong><br/>
            ${urgentAction}
          </td></tr>
        </table>
        `
            : ''
        }
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Take immediate action to prevent stockouts!
        </p>
      `,
      ctaButton: {
        url: ctaUrl || `${_appUrl}/admin/inventory/${productId}`,
        text: 'Replenish Now',
        color: '#dc2626'
      },
      footerNote: 'Urgent attention required!'
    }),
    attachments: []
  };
};

/**
 * STOCK_REPLENISHED Email Template
 * Sent when: Stock has been replenished
 */
const STOCK_REPLENISHED = ({
  productName,
  quantityAdded,
  newStock,
  supplier,
  expectedDelivery,
  productId,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `Stock Replenished: ${productName}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `${productName} stock has been replenished.`,
      title: 'Stock Replenished',
      headerBg: '#10b981',
      headerText: '✅ Stock Replenished',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          <strong>Inventory Update</strong>
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#d1fae5;border-left:4px solid #10b981;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#065f46;">
            <strong style="font-size:16px;">✅ Stock Replenished</strong><br/><br/>
            <strong>Product:</strong> ${productName}<br/>
            <strong>Quantity Added:</strong> +${quantityAdded}<br/>
            <strong>New Stock Level:</strong> ${newStock}<br/>
            ${supplier ? `<strong>Supplier:</strong> ${supplier}<br/>` : ''}
            ${expectedDelivery ? `<strong>Expected Delivery:</strong> ${new Date(expectedDelivery).toLocaleDateString()}` : ''}
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Stock levels are now healthy. Product is ready for orders.
        </p>
      `,
      ctaButton: {
        url: ctaUrl || `${_appUrl}/admin/inventory/${productId}`,
        text: 'View Inventory',
        color: '#10b981'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * INVENTORY_AUDIT_COMPLETED Email Template
 * Sent when: Inventory audit is completed
 */
const INVENTORY_AUDIT_COMPLETED = ({
  auditType,
  completedAt,
  discrepancies,
  variance,
  actionItems,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `Inventory Audit Completed`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `${auditType} inventory audit has been completed.`,
      title: 'Audit Completed',
      headerBg: '#8b5cf6',
      headerText: '📋 Audit Complete',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          <strong>Inventory Audit Report</strong>
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#ede9fe;border-left:4px solid #8b5cf6;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#5b21b6;">
            <strong style="font-size:16px;">📋 Audit Results</strong><br/><br/>
            <strong>Audit Type:</strong> ${auditType}<br/>
            <strong>Completed:</strong> ${new Date(completedAt).toLocaleString()}<br/>
            ${variance !== undefined ? `<strong>Variance:</strong> ${variance}%<br/>` : ''}
            ${discrepancies ? `<strong>Discrepancies Found:</strong> ${discrepancies}` : 'No major discrepancies found.'}
          </td></tr>
        </table>
        
        ${
          actionItems
            ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Action Items:</strong><br/>
            <div style="color:#4b5563;margin-top:8px;">${actionItems}</div>
          </td></tr>
        </table>
        `
            : ''
        }
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Review the audit report and take necessary actions.
        </p>
      `,
      ctaButton: {
        url: ctaUrl || (ctaPath ? _appUrl + ctaPath : `${_appUrl}/admin/audit-reports`),
        text: 'View Full Report',
        color: '#8b5cf6'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * SUPPLIER_DELAY Email Template
 * Sent when: Supplier delivery is delayed
 */
const SUPPLIER_DELAY = ({
  supplierName,
  orderId,
  originalDelivery,
  newDelivery,
  affectedProducts,
  reason
}) => {
  const productsHTML =
    affectedProducts && affectedProducts.length > 0
      ? affectedProducts.map(product => `<li style="margin:4px 0;">• ${product}</li>`).join('')
      : '';

  return {
    subject: `Supplier Delay - Order #${orderId}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Supplier delivery has been delayed for order #${orderId}.`,
      title: 'Supplier Delay',
      headerBg: '#f59e0b',
      headerText: '⏰ Supplier Delay',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          <strong>Supplier Delay Notification</strong>
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#92400e;">
            <strong>⏰ Supplier Delay</strong><br/>
            <strong>Supplier:</strong> ${supplierName}<br/>
            <strong>Order #${orderId}</strong><br/>
            ${reason ? `<strong>Reason:</strong> ${reason}<br/>` : ''}
            <strong>Originally:</strong> ${new Date(originalDelivery).toLocaleDateString()}<br/>
            <strong>New Delivery:</strong> ${new Date(newDelivery).toLocaleDateString()}
          </td></tr>
        </table>
        
        ${
          productsHTML
            ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Affected Products:</strong>
            <ul style="margin:8px 0;padding-left:20px;color:#4b5563;">
              ${productsHTML}
            </ul>
          </td></tr>
        </table>
        `
            : ''
        }
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Update your inventory forecasts and customer communication accordingly.
        </p>
      `,
      ctaButton: {
        url: ctaUrl || `${_appUrl}/admin/orders/${orderId}`,
        text: 'View Order',
        color: '#f59e0b'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * BATCH_EXPIRING_SOON Email Template
 * Sent when: Batch/SKU is expiring soon
 */
const BATCH_EXPIRING_SOON = ({
  productName,
  batchNumber,
  expiryDate,
  daysRemaining,
  currentStock,
  recommendation,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `⏰ Batch Expiring Soon: ${productName}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Batch ${batchNumber} of ${productName} expires in ${daysRemaining} days.`,
      title: 'Batch Expiring',
      headerBg: '#f59e0b',
      headerText: '⏰ Batch Expiring',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          <strong>Expiry Alert</strong>
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#92400e;">
            <strong>⏰ Batch Expiring</strong><br/>
            <strong>Product:</strong> ${productName}<br/>
            <strong>Batch #:</strong> ${batchNumber}<br/>
            <strong>Expiry Date:</strong> ${new Date(expiryDate).toLocaleDateString()}<br/>
            <strong>Days Remaining:</strong> <span style="font-weight:700;color:#dc2626;">${daysRemaining}</span><br/>
            <strong>Current Stock:</strong> ${currentStock}
          </td></tr>
        </table>
        
        ${
          recommendation
            ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fee2e2;border-left:4px solid #dc2626;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#7f1d1d;">
            <strong>📋 Recommendation:</strong><br/>
            ${recommendation}
          </td></tr>
        </table>
        `
            : ''
        }
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Plan for clearance or disposal of this batch.
        </p>
      `,
      ctaButton: {
        url: ctaUrl || (ctaPath ? _appUrl + ctaPath : `${_appUrl}/admin/inventory`),
        text: 'View Inventory',
        color: '#f59e0b'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * WAREHOUSE_TRANSFER_INITIATED Email Template
 * Sent when: Warehouse transfer is initiated
 */
const WAREHOUSE_TRANSFER_INITIATED = ({
  transferId,
  fromWarehouse,
  toWarehouse,
  items,
  initiatedBy,
  estimatedArrival
}) => {
  const itemsHTML =
    items && items.length > 0
      ? items.map(item => `<li style="margin:4px 0;">• ${item}</li>`).join('')
      : '';

  return {
    subject: `Warehouse Transfer Initiated - #${transferId}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Transfer from ${fromWarehouse} to ${toWarehouse} has been initiated.`,
      title: 'Transfer Initiated',
      headerBg: '#3b82f6',
      headerText: '📦 Transfer Initiated',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          <strong>Warehouse Transfer Notification</strong>
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#dbeafe;border-left:4px solid #3b82f6;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#1e40af;">
            <strong>📦 Transfer #${transferId}</strong><br/><br/>
            <strong>From:</strong> ${fromWarehouse}<br/>
            <strong>To:</strong> ${toWarehouse}<br/>
            <strong>Initiated By:</strong> ${initiatedBy}<br/>
            ${estimatedArrival ? `<strong>Est. Arrival:</strong> ${new Date(estimatedArrival).toLocaleDateString()}` : ''}
          </td></tr>
        </table>
        
        ${
          itemsHTML
            ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Items in Transfer:</strong>
            <ul style="margin:8px 0;padding-left:20px;color:#4b5563;">
              ${itemsHTML}
            </ul>
          </td></tr>
        </table>
        `
            : ''
        }
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Monitor this transfer and confirm receipt upon arrival.
        </p>
      `,
      ctaButton: {
        url: ctaUrl || `${_appUrl}/admin/warehouse/transfers/${transferId}`,
        text: 'Track Transfer',
        color: '#3b82f6'
      },
      footerNote: null
    }),
    attachments: []
  };
};

// =====================================================================================
// 💬 COMMUNICATION EMAIL TEMPLATES (11 Templates)
// =====================================================================================

/**
 * MESSAGE_SENT Email Template
 * Sent when: User sends a message to another user
 */
const MESSAGE_SENT = ({ senderName, recipientName, messagePreview, sentAt, messageId }) => {
  return {
    subject: `Message Sent to ${recipientName}`,
    html: buildEmailHTML({
      preheader: `Your message has been sent to ${recipientName}.`,
      title: 'Message Sent',
      headerBg: '#3b82f6',
      headerText: '✉️ Message Sent',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${senderName || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your message has been successfully sent to <strong>${recipientName}</strong>.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#dbeafe;border-left:4px solid #3b82f6;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#1e40af;">
            <strong>✉️ Message Details</strong><br/><br/>
            <strong>Recipient:</strong> ${recipientName}<br/>
            <strong>Sent:</strong> ${new Date(sentAt).toLocaleString()}<br/>
            <strong>Message ID:</strong> ${messageId}
          </td></tr>
        </table>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;color:#4b5563;">
            <strong style="color:#111827;">Message Preview:</strong><br/>
            <div style="margin-top:12px;padding:12px;background:#ffffff;border-radius:4px;border-left:3px solid #3b82f6;">
              ${messagePreview || 'Message content'}
            </div>
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          You'll receive a notification when they read your message.
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * MESSAGE_RECEIVED Email Template
 * Sent when: User receives a message from another user
 */
const MESSAGE_RECEIVED = ({
  recipientName,
  senderName,
  messagePreview,
  receivedAt,
  replyUrl,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `New Message from ${senderName}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `${senderName} sent you a message.`,
      title: 'New Message',
      headerBg: '#3b82f6',
      headerText: '💬 New Message',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${recipientName || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          You have a new message from <strong>${senderName}</strong>.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#dbeafe;border-left:4px solid #3b82f6;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#1e40af;">
            <strong style="font-size:16px;">💬 From ${senderName}</strong><br/><br/>
            <strong>Received:</strong> ${new Date(receivedAt).toLocaleString()}
          </td></tr>
        </table>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Message:</strong><br/>
            <div style="margin-top:12px;padding:12px;background:#ffffff;border-radius:4px;border-left:3px solid #3b82f6;line-height:1.6;">
              ${messagePreview || 'Message content'}
            </div>
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Reply to continue the conversation.
        </p>
      `,
      ctaButton: {
        url: replyUrl || ctaUrl || `${_appUrl}/messages`,
        text: 'Reply Now',
        color: '#3b82f6'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * MESSAGE_READ Email Template
 * Sent when: Message is read by recipient
 */
const MESSAGE_READ = ({ senderName, recipientName, readAt, messageId }) => {
  return {
    subject: `Message Read by ${recipientName}`,
    html: buildEmailHTML({
      preheader: `${recipientName} has read your message.`,
      title: 'Message Read',
      headerBg: '#10b981',
      headerText: '✅ Message Read',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${senderName || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          <strong>${recipientName}</strong> has read your message.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#d1fae5;border-left:4px solid #10b981;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#065f46;">
            <strong style="font-size:16px;">✅ Read by ${recipientName}</strong><br/><br/>
            <strong>Read At:</strong> ${new Date(readAt).toLocaleString()}<br/>
            <strong>Message ID:</strong> ${messageId}
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          You may see a reply soon!
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * MENTION_RECEIVED Email Template
 * Sent when: User is mentioned in a comment or post
 */
const MENTION_RECEIVED = ({
  username,
  mentionedBy,
  context,
  contextType,
  contentPreview,
  mentionUrl
}) => {
  const contextLabel =
    contextType === 'post' ? 'Post' : contextType === 'comment' ? 'Comment' : 'Item';

  return {
    subject: `🔔 You were mentioned by ${mentionedBy}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `${mentionedBy} mentioned you in a ${contextType || 'post'}.`,
      title: 'Mention Received',
      headerBg: '#8b5cf6',
      headerText: "🔔 You're Mentioned!",
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          <strong>${mentionedBy}</strong> mentioned you in a ${contextType || 'post'}.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#ede9fe;border-left:4px solid #8b5cf6;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#5b21b6;">
            <strong style="font-size:16px;">🔔 Mentioned by ${mentionedBy}</strong><br/><br/>
            <strong>Type:</strong> ${contextLabel}<br/>
            ${context ? `<strong>Context:</strong> ${context}` : ''}
          </td></tr>
        </table>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Content:</strong><br/>
            <div style="margin-top:12px;padding:12px;background:#ffffff;border-radius:4px;border-left:3px solid #8b5cf6;line-height:1.6;color:#4b5563;">
              ${contentPreview || 'Content preview'}
            </div>
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Check it out and reply if needed!
        </p>
      `,
      ctaButton: {
        url: mentionUrl || ctaUrl || `${_appUrl}/messages`,
        text: 'View Mention',
        color: '#8b5cf6'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * COMMENT_POSTED Email Template
 * Sent when: A comment is posted on user's content
 */
const COMMENT_POSTED = ({
  username,
  commenterName,
  contentType,
  commentPreview,
  postedAt,
  commentUrl,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `💬 New Comment from ${commenterName}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `${commenterName} commented on your ${contentType || 'post'}.`,
      title: 'Comment Posted',
      headerBg: '#10b981',
      headerText: '💬 New Comment',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          <strong>${commenterName}</strong> commented on your ${contentType || 'post'}.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#d1fae5;border-left:4px solid #10b981;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#065f46;">
            <strong style="font-size:16px;">💬 Comment by ${commenterName}</strong><br/><br/>
            <strong>Posted:</strong> ${new Date(postedAt).toLocaleString()}
          </td></tr>
        </table>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Comment:</strong><br/>
            <div style="margin-top:12px;padding:12px;background:#ffffff;border-radius:4px;border-left:3px solid #10b981;line-height:1.6;color:#4b5563;">
              ${commentPreview || 'Comment content'}
            </div>
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Reply to engage with your community!
        </p>
      `,
      ctaButton: {
        url: commentUrl || ctaUrl || `${_appUrl}/comments`,
        text: 'View Comment',
        color: '#10b981'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * COMMENT_REPLIED Email Template
 * Sent when: Someone replies to user's comment
 */
const COMMENT_REPLIED = ({
  username,
  replyName,
  originalComment,
  replyContent,
  repliedAt,
  replyUrl,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `↩️ Reply to Your Comment`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `${replyName} replied to your comment.`,
      title: 'Comment Reply',
      headerBg: '#3b82f6',
      headerText: '↩️ You Got a Reply!',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          <strong>${replyName}</strong> replied to your comment.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#dbeafe;border-left:4px solid #3b82f6;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#1e40af;">
            <strong>Your Comment:</strong><br/>
            <div style="margin:8px 0;padding:8px;background:#ffffff;border-radius:4px;font-style:italic;color:#4b5563;">
              "${originalComment || 'Original comment'}"
            </div>
          </td></tr>
        </table>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">↩️ Reply from ${replyName}:</strong><br/>
            <div style="margin-top:12px;padding:12px;background:#ffffff;border-radius:4px;border-left:3px solid #3b82f6;line-height:1.6;color:#4b5563;">
              ${replyContent || 'Reply content'}
            </div>
            <div style="margin-top:8px;font-size:13px;color:#6b7280;">
              Replied: ${new Date(repliedAt).toLocaleString()}
            </div>
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Continue the conversation!
        </p>
      `,
      ctaButton: {
        url: replyUrl || ctaUrl || `${_appUrl}/comments`,
        text: 'View Reply',
        color: '#3b82f6'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * EMAIL_DELIVERED Email Template
 * Sent when: Email successfully delivered
 */
const EMAIL_DELIVERED = ({ emailAddress, messageSubject, deliveredAt, deliveryStatus }) => {
  return {
    subject: `Email Delivered Successfully`,
    html: buildEmailHTML({
      preheader: `Your email has been delivered successfully.`,
      title: 'Email Delivered',
      headerBg: '#10b981',
      headerText: '✅ Email Delivered',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          <strong>Email Delivery Confirmation</strong>
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#d1fae5;border-left:4px solid #10b981;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#065f46;">
            <strong style="font-size:16px;">✅ Email Delivered</strong><br/><br/>
            <strong>Recipient:</strong> ${emailAddress}<br/>
            <strong>Subject:</strong> ${messageSubject}<br/>
            <strong>Delivered:</strong> ${new Date(deliveredAt).toLocaleString()}<br/>
            <strong>Status:</strong> ${deliveryStatus || 'Successfully Delivered'}
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Email has been delivered to the recipient's mailbox.
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * EMAIL_FAILED Email Template
 * Sent when: Email delivery fails
 */
const EMAIL_FAILED = ({ emailAddress, messageSubject, failureReason, failedAt, retryStatus }) => {
  return {
    subject: `⚠️ Email Delivery Failed`,
    html: buildEmailHTML({
      preheader: `Email delivery to ${emailAddress} failed.`,
      title: 'Email Failed',
      headerBg: '#dc2626',
      headerText: '❌ Delivery Failed',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          <strong>Email Delivery Failure</strong>
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fee2e2;border-left:4px solid #dc2626;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#7f1d1d;">
            <strong style="font-size:16px;">❌ Delivery Failed</strong><br/><br/>
            <strong>Recipient:</strong> ${emailAddress}<br/>
            <strong>Subject:</strong> ${messageSubject}<br/>
            ${failureReason ? `<strong>Reason:</strong> ${failureReason}<br/>` : ''}
            <strong>Failed:</strong> ${new Date(failedAt).toLocaleString()}
          </td></tr>
        </table>
        
        ${
          retryStatus
            ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#92400e;">
            <strong>Retry Status:</strong><br/>
            ${retryStatus}
          </td></tr>
        </table>
        `
            : ''
        }
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Please check the email address and try again.
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * PUSH_NOTIFICATION_SENT Email Template
 * Sent when: Push notification is sent
 */
const PUSH_NOTIFICATION_SENT = ({
  deviceType,
  notificationTitle,
  notificationBody,
  sentAt,
  targetAudience
}) => {
  return {
    subject: `Push Notification Sent`,
    html: buildEmailHTML({
      preheader: `Push notification has been sent to ${targetAudience}.`,
      title: 'Notification Sent',
      headerBg: '#3b82f6',
      headerText: '📲 Notification Sent',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          <strong>Push Notification Delivery Report</strong>
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#dbeafe;border-left:4px solid #3b82f6;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#1e40af;">
            <strong style="font-size:16px;">📲 Notification Sent</strong><br/><br/>
            <strong>Device Type:</strong> ${deviceType || 'Mobile'}<br/>
            <strong>Target Audience:</strong> ${targetAudience}<br/>
            <strong>Sent:</strong> ${new Date(sentAt).toLocaleString()}
          </td></tr>
        </table>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Notification Content:</strong><br/>
            <div style="margin-top:12px;padding:12px;background:#ffffff;border-radius:4px;border-left:3px solid #3b82f6;">
              <div style="font-weight:700;color:#111827;margin-bottom:8px;">${notificationTitle}</div>
              <div style="color:#4b5563;line-height:1.6;">${notificationBody}</div>
            </div>
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Notification has been delivered to users' devices.
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * CHAT_STARTED Email Template
 * Sent when: Chat session is initiated
 */
const CHAT_STARTED = ({
  username,
  chatInitiator,
  topic,
  chatId,
  startedAt,
  joinUrl,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `💬 Chat Session Started - ${topic}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `${chatInitiator} started a chat about ${topic}.`,
      title: 'Chat Started',
      headerBg: '#3b82f6',
      headerText: '💬 Chat Started',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          <strong>${chatInitiator}</strong> has started a chat with you.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#dbeafe;border-left:4px solid #3b82f6;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#1e40af;">
            <strong style="font-size:16px;">💬 Chat Details</strong><br/><br/>
            <strong>Initiated By:</strong> ${chatInitiator}<br/>
            <strong>Topic:</strong> ${topic}<br/>
            <strong>Chat ID:</strong> ${chatId}<br/>
            <strong>Started:</strong> ${new Date(startedAt).toLocaleString()}
          </td></tr>
        </table>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#92400e;">
            <strong>💡 Tip:</strong> Join the chat to see full details and respond in real-time.
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Join now to participate in the conversation!
        </p>
      `,
      ctaButton: {
        url: joinUrl || ctaUrl || `${_appUrl}/chat/${chatId}`,
        text: 'Join Chat',
        color: '#3b82f6'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * CHAT_ENDED Email Template
 * Sent when: Chat session has ended
 */
const CHAT_ENDED = ({ username, chatWith, topic, chatId, endedAt, duration, summary }) => {
  return {
    subject: `Chat Session Ended - ${topic}`,
    html: buildEmailHTML({
      preheader: `Your chat session has ended.`,
      title: 'Chat Ended',
      headerBg: '#6b7280',
      headerText: '👋 Chat Ended',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your chat session has ended.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#e5e7eb;border-left:4px solid #6b7280;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#374151;">
            <strong style="font-size:16px;">👋 Chat Summary</strong><br/><br/>
            <strong>Chat With:</strong> ${chatWith}<br/>
            <strong>Topic:</strong> ${topic}<br/>
            <strong>Duration:</strong> ${duration || 'N/A'}<br/>
            <strong>Ended:</strong> ${new Date(endedAt).toLocaleString()}<br/>
            <strong>Chat ID:</strong> ${chatId}
          </td></tr>
        </table>
        
        ${
          summary
            ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Session Summary:</strong><br/>
            <div style="margin-top:12px;color:#4b5563;line-height:1.6;">
              ${summary}
            </div>
          </td></tr>
        </table>
        `
            : ''
        }
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Thank you for using our chat service!
        </p>
      `,
      ctaButton: null,
      footerNote: null
    }),
    attachments: []
  };
};

// =====================================================================================
// 📊 ANALYTICS & INSIGHTS EMAIL TEMPLATES (8 Templates)
// =====================================================================================

/**
 * DAILY_REPORT_READY Email Template
 * Sent when: Daily analytics report is ready
 */
const DAILY_REPORT_READY = ({
  username,
  reportDate,
  metrics,
  highlights,
  reportUrl,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  const metricsHTML =
    metrics && metrics.length > 0
      ? metrics.map(metric => `<li style="margin:6px 0;">${metric}</li>`).join('')
      : '<li>View detailed metrics in the report</li>';

  const highlightsHTML =
    highlights && highlights.length > 0
      ? highlights.map(highlight => `<li style="margin:6px 0;">✓ ${highlight}</li>`).join('')
      : '';

  return {
    subject: `📊 Daily Report Ready - ${new Date(reportDate).toLocaleDateString()}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Your daily analytics report for ${new Date(reportDate).toLocaleDateString()} is ready.`,
      title: 'Daily Report Ready',
      headerBg: '#8b5cf6',
      headerText: '📊 Daily Report',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your daily analytics report for <strong>${new Date(reportDate).toLocaleDateString()}</strong> is now ready to view.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#ede9fe;border-left:4px solid #8b5cf6;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#5b21b6;">
            <strong style="font-size:16px;">📊 Report Date</strong><br/><br/>
            <strong>Date:</strong> ${new Date(reportDate).toLocaleDateString()}<br/>
            <strong>Generated:</strong> ${new Date().toLocaleString()}
          </td></tr>
        </table>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Key Metrics:</strong>
            <ul style="margin:8px 0;padding-left:20px;color:#4b5563;">
              ${metricsHTML}
            </ul>
          </td></tr>
        </table>
        
        ${
          highlightsHTML
            ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#d1fae5;border-left:4px solid #10b981;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#065f46;">
            <strong style="font-size:15px;">✨ Highlights</strong>
            <ul style="margin:8px 0;padding-left:20px;">
              ${highlightsHTML}
            </ul>
          </td></tr>
        </table>
        `
            : ''
        }
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Click the button below to view the complete report with detailed insights.
        </p>
      `,
      ctaButton: {
        url: reportUrl || ctaUrl || `${_appUrl}/reports/daily`,
        text: 'View Full Report',
        color: '#8b5cf6'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * WEEKLY_REPORT_READY Email Template
 * Sent when: Weekly analytics report is ready
 */
const WEEKLY_REPORT_READY = ({
  username,
  weekStart,
  weekEnd,
  metrics,
  topPerformer,
  keyInsights,
  reportUrl
}) => {
  const metricsHTML =
    metrics && metrics.length > 0
      ? metrics.map(metric => `<li style="margin:6px 0;">${metric}</li>`).join('')
      : '<li>View detailed metrics in the report</li>';

  const insightsHTML =
    keyInsights && keyInsights.length > 0
      ? keyInsights.map(insight => `<li style="margin:6px 0;">💡 ${insight}</li>`).join('')
      : '';

  return {
    subject: `📊 Weekly Report - ${new Date(weekStart).toLocaleDateString()} to ${new Date(weekEnd).toLocaleDateString()}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Your weekly analytics report is ready.`,
      title: 'Weekly Report Ready',
      headerBg: '#8b5cf6',
      headerText: '📊 Weekly Report',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your weekly analytics report is now ready to view.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#ede9fe;border-left:4px solid #8b5cf6;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#5b21b6;">
            <strong style="font-size:16px;">📊 Week Overview</strong><br/><br/>
            <strong>Period:</strong> ${new Date(weekStart).toLocaleDateString()} - ${new Date(weekEnd).toLocaleDateString()}<br/>
            ${topPerformer ? `<strong>Top Performer:</strong> ${topPerformer}` : ''}
          </td></tr>
        </table>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Weekly Metrics:</strong>
            <ul style="margin:8px 0;padding-left:20px;color:#4b5563;">
              ${metricsHTML}
            </ul>
          </td></tr>
        </table>
        
        ${
          insightsHTML
            ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#dbeafe;border-left:4px solid #3b82f6;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#1e40af;">
            <strong style="font-size:15px;">💡 Key Insights</strong>
            <ul style="margin:8px 0;padding-left:20px;">
              ${insightsHTML}
            </ul>
          </td></tr>
        </table>
        `
            : ''
        }
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Review the complete weekly analysis to understand performance trends.
        </p>
      `,
      ctaButton: {
        url: reportUrl || ctaUrl || `${_appUrl}/reports/weekly`,
        text: 'View Weekly Report',
        color: '#8b5cf6'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * MONTHLY_REPORT_READY Email Template
 * Sent when: Monthly analytics report is ready
 */
const MONTHLY_REPORT_READY = ({
  username,
  month,
  year,
  metrics,
  goalComparison,
  achievements,
  reportUrl
}) => {
  const metricsHTML =
    metrics && metrics.length > 0
      ? metrics.map(metric => `<li style="margin:6px 0;">${metric}</li>`).join('')
      : '<li>View detailed metrics in the report</li>';

  const achievementsHTML =
    achievements && achievements.length > 0
      ? achievements.map(achievement => `<li style="margin:6px 0;">🏆 ${achievement}</li>`).join('')
      : '';

  return {
    subject: `📊 Monthly Report - ${month} ${year}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Your monthly analytics report for ${month} ${year} is ready.`,
      title: 'Monthly Report Ready',
      headerBg: '#8b5cf6',
      headerText: '📊 Monthly Report',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Your comprehensive monthly analytics report for <strong>${month} ${year}</strong> is now available.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#ede9fe;border-left:4px solid #8b5cf6;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#5b21b6;">
            <strong style="font-size:16px;">📊 Monthly Summary</strong><br/><br/>
            <strong>Period:</strong> ${month} ${year}<br/>
            ${goalComparison ? `<strong>Goal Progress:</strong> ${goalComparison}` : ''}
          </td></tr>
        </table>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Monthly Performance:</strong>
            <ul style="margin:8px 0;padding-left:20px;color:#4b5563;">
              ${metricsHTML}
            </ul>
          </td></tr>
        </table>
        
        ${
          achievementsHTML
            ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#d1fae5;border-left:4px solid #10b981;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#065f46;">
            <strong style="font-size:15px;">🏆 Achievements</strong>
            <ul style="margin:8px 0;padding-left:20px;">
              ${achievementsHTML}
            </ul>
          </td></tr>
        </table>
        `
            : ''
        }
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Dive deep into the data to identify growth opportunities for next month.
        </p>
      `,
      ctaButton: {
        url: reportUrl || ctaUrl || `${_appUrl}/reports/monthly`,
        text: 'View Monthly Report',
        color: '#8b5cf6'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * DATA_TREND_ALERT Email Template
 * Sent when: Significant data trend is detected
 */
const DATA_TREND_ALERT = ({
  username,
  trendType,
  metric,
  change,
  percentageChange,
  period,
  recommendation
}) => {
  const trendColor = change === 'up' || change === 'positive' ? '#10b981' : '#dc2626';
  const trendBg = change === 'up' || change === 'positive' ? '#d1fae5' : '#fee2e2';
  const trendIcon = change === 'up' || change === 'positive' ? '📈' : '📉';

  return {
    subject: `${trendIcon} ${trendType} Alert - ${metric}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `A significant trend detected in ${metric}.`,
      title: 'Trend Alert',
      headerBg: trendColor,
      headerText: `${trendIcon} Trend Alert`,
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We've detected a significant trend in your analytics data.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:${trendBg};border-left:4px solid ${trendColor};border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <div style="font-size:28px;font-weight:700;margin-bottom:12px;color:${trendColor};">
              ${trendIcon} ${percentageChange || 'Notable'} Change
            </div>
            <strong style="color:#111827;">Metric:</strong> <span style="font-size:16px;font-weight:700;color:${trendColor};">${metric}</span><br/>
            <strong style="color:#111827;">Trend Type:</strong> ${trendType}<br/>
            ${period ? `<strong style="color:#111827;">Period:</strong> ${period}` : ''}
          </td></tr>
        </table>
        
        ${
          recommendation
            ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">💡 Recommendation:</strong><br/>
            <div style="color:#4b5563;margin-top:8px;">${recommendation}</div>
          </td></tr>
        </table>
        `
            : ''
        }
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Monitor this metric closely and adjust your strategy if needed.
        </p>
      `,
      ctaButton: {
        url: ctaUrl || (ctaPath ? _appUrl + ctaPath : `${_appUrl}/analytics/trends`),
        text: 'View Detailed Analysis',
        color: trendColor
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * TRAFFIC_SPIKE Email Template
 * Sent when: Significant traffic spike is detected
 */
const TRAFFIC_SPIKE = ({
  username,
  spikePercentage,
  currentTraffic,
  normalTraffic,
  cause,
  duration,
  actionUrl,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `📈 Traffic Spike Detected! +${spikePercentage}%`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Your traffic has spiked by ${spikePercentage}%!`,
      title: 'Traffic Spike',
      headerBg: '#10b981',
      headerText: '📈 Traffic Spike!',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Great news! Your traffic has spiked significantly!
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#d1fae5;border-left:4px solid #10b981;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#065f46;">
            <div style="font-size:32px;font-weight:700;margin-bottom:12px;color:#10b981;">
              +${spikePercentage}%
            </div>
            <strong>Current Traffic:</strong> ${currentTraffic}<br/>
            <strong>Normal Traffic:</strong> ${normalTraffic}<br/>
            ${duration ? `<strong>Duration:</strong> ${duration}` : ''}
          </td></tr>
        </table>
        
        ${
          cause
            ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Possible Causes:</strong><br/>
            <div style="color:#4b5563;margin-top:8px;">${cause}</div>
          </td></tr>
        </table>
        `
            : ''
        }
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#dbeafe;border-left:4px solid #3b82f6;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#1e40af;">
            <strong>💡 Action:</strong> Monitor your infrastructure to handle the increased traffic smoothly.
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Make sure your systems can handle the load!
        </p>
      `,
      ctaButton: {
        url: actionUrl || ctaUrl || `${_appUrl}/analytics/traffic`,
        text: 'View Traffic Details',
        color: '#10b981'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * CONVERSION_RATE_DROP Email Template
 * Sent when: Conversion rate drops significantly
 */
const CONVERSION_RATE_DROP = ({
  username,
  currentRate,
  previousRate,
  percentageDrop,
  impact,
  possibleCauses,
  actionUrl,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `⚠️ Conversion Rate Drop Alert - ${percentageDrop}% Decrease`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Your conversion rate has dropped ${percentageDrop}%.`,
      title: 'Conversion Drop',
      headerBg: '#dc2626',
      headerText: '⚠️ Conversion Rate Drop',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We've detected a significant drop in your conversion rate.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fee2e2;border-left:4px solid #dc2626;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#7f1d1d;">
            <div style="font-size:28px;font-weight:700;margin-bottom:12px;color:#dc2626;">
              -${percentageDrop}%
            </div>
            <strong>Current Rate:</strong> ${currentRate}<br/>
            <strong>Previous Rate:</strong> ${previousRate}<br/>
            ${impact ? `<strong>Potential Impact:</strong> ${impact}` : ''}
          </td></tr>
        </table>
        
        ${
          possibleCauses
            ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">Possible Causes:</strong>
            <ul style="margin:8px 0;padding-left:20px;color:#4b5563;">
              ${possibleCauses.map(cause => `<li style="margin:4px 0;">• ${cause}</li>`).join('')}
            </ul>
          </td></tr>
        </table>
        `
            : ''
        }
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#92400e;">
            <strong>⚡ Urgent:</strong> Investigate immediately to identify and resolve the issue.
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Review your recent changes and customer feedback.
        </p>
      `,
      ctaButton: {
        url: actionUrl || ctaUrl || `${_appUrl}/analytics/conversions`,
        text: 'Investigate',
        color: '#dc2626'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * ENGAGEMENT_INCREASED Email Template
 * Sent when: User engagement metrics increase
 */
const ENGAGEMENT_INCREASED = ({
  username,
  engagementMetric,
  increasePercentage,
  currentValue,
  previousValue,
  highlights,
  celebrationUrl
}) => {
  const highlightsHTML =
    highlights && highlights.length > 0
      ? highlights.map(highlight => `<li style="margin:4px 0;">✓ ${highlight}</li>`).join('')
      : '';

  return {
    subject: `🎉 Engagement Up! +${increasePercentage}% Increase`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Your ${engagementMetric} has increased by ${increasePercentage}%!`,
      title: 'Engagement Increased',
      headerBg: '#10b981',
      headerText: '🎉 Engagement Increased!',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Congratulations! Your user engagement has increased significantly!
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#d1fae5;border-left:4px solid #10b981;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#065f46;">
            <div style="font-size:32px;font-weight:700;margin-bottom:12px;color:#10b981;">
              +${increasePercentage}%
            </div>
            <strong>Metric:</strong> ${engagementMetric}<br/>
            <strong>Current Value:</strong> ${currentValue}<br/>
            <strong>Previous Value:</strong> ${previousValue}
          </td></tr>
        </table>
        
        ${
          highlightsHTML
            ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">✨ Key Highlights:</strong>
            <ul style="margin:8px 0;padding-left:20px;color:#4b5563;">
              ${highlightsHTML}
            </ul>
          </td></tr>
        </table>
        `
            : ''
        }
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px;background:#dbeafe;border-left:4px solid #3b82f6;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;color:#1e40af;">
            <strong>💡 Keep Up the Momentum:</strong> Continue with what's working and explore new opportunities to maintain this growth!
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Well done! Your efforts are paying off!
        </p>
      `,
      ctaButton: {
        url: celebrationUrl || ctaUrl || `${_appUrl}/analytics/engagement`,
        text: 'View Engagement Metrics',
        color: '#10b981'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * KPI_THRESHOLD_BREACHED Email Template
 * Sent when: KPI threshold is breached (can be positive or negative)
 */
const KPI_THRESHOLD_BREACHED = ({
  username,
  kpiName,
  currentValue,
  threshold,
  direction,
  severity,
  recommendations
}) => {
  const breachColor = direction === 'above' ? '#10b981' : '#dc2626';
  const breachBg = direction === 'above' ? '#d1fae5' : '#fee2e2';
  const breachIcon = direction === 'above' ? '✅' : '⚠️';
  const severityColor =
    severity === 'critical' ? '#dc2626' : severity === 'warning' ? '#f59e0b' : '#10b981';

  return {
    subject: `${breachIcon} KPI Threshold Breached: ${kpiName}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `${kpiName} has breached its threshold.`,
      title: 'KPI Threshold Breached',
      headerBg: breachColor,
      headerText: `${breachIcon} KPI Alert`,
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${username || 'User'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          A KPI threshold has been breached. Here are the details:
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:${breachBg};border-left:4px solid ${breachColor};border-radius:4px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <div style="font-size:20px;font-weight:700;margin-bottom:12px;color:${breachColor};">
              ${breachIcon} ${kpiName}
            </div>
            <strong>Current Value:</strong> <span style="font-size:18px;font-weight:700;color:${breachColor};">${currentValue}</span><br/>
            <strong>Threshold:</strong> ${threshold}<br/>
            <strong>Direction:</strong> ${direction === 'above' ? 'Above Threshold (Good)' : 'Below Threshold (Concerning)'}<br/>
            <strong>Severity:</strong> <span style="color:${severityColor};font-weight:700;text-transform:uppercase;">${severity || 'normal'}</span>
          </td></tr>
        </table>
        
        ${
          recommendations
            ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#111827;">📋 Recommendations:</strong><br/>
            <div style="color:#4b5563;margin-top:8px;">${recommendations}</div>
          </td></tr>
        </table>
        `
            : ''
        }
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          ${direction === 'above' ? 'Keep maintaining this performance!' : 'Take action to bring this KPI back into target range.'}
        </p>
      `,
      ctaButton: {
        url: ctaUrl || (ctaPath ? _appUrl + ctaPath : `${_appUrl}/analytics/kpis`),
        text: 'View KPI Dashboard',
        color: breachColor
      },
      footerNote: null
    }),
    attachments: []
  };
};
const CONTACT_REPLY = ({
  name,
  email,
  phone,
  company,
  subject,
  message,
  submittedAt,
  contactId
}) => {
  return {
    subject: `Re: ${subject || 'Your inquiry'}`,
    html: buildEmailHTML({
      preheader: `Thank you for contacting us about ${subject || 'your inquiry'}.`,
      title: 'We received your message',
      headerBg: '#10b981',
      headerText: '✅ Message Received',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${name || 'User'}</strong>,
        </p>

        <p style="margin:0 0 16px 0;color:#4b5563;">
          Thank you for reaching out! We received your contact form submission.
        </p>

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:20px;">
            <strong style="color:#065f46;">Your submission details:</strong><br/>
            <span style="color:#047857;">Subject:</span>
            <strong style="color:#065f46;">${subject || 'Not provided'}</strong><br/>
            <span style="color:#047857;">Submitted:</span>
            <strong style="color:#065f46;">${submittedAt}</strong><br/>
            <span style="color:#047857;">Ticket ID:</span>
            <strong style="color:#065f46;">${contactId}</strong>
          </td></tr>
        </table>

        <p style="margin:0 0 16px 0;color:#4b5563;">
          Our team will review your message and get back to you within 24-48 hours.
        </p>

        <p style="margin:0 0 16px 0;color:#4b5563;">
          In the meantime, you can track your inquiry or add more details here:
        </p>
      `,

      footerNote:
        'You received this confirmation because you submitted a contact form on our website.'
    }),
    attachments: []
  };
};

const INQUIRY_NOTIFICATION = ({
  name,
  email,
  phone,
  company,
  projectType,
  budget,
  timeline,
  description,
  requirements,
  submittedAt,
  inquiryId,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `🚀 NEW PROJECT: ${projectType || 'Custom Project'} | ${name || company}`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `New ${projectType} inquiry #${inquiryId.slice(-6)} from ${name || email}`,
      title: 'New Project Inquiry',
      headerBg: '#059669',
      headerText: '💼 NEW PROJECT LEAD',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          <strong>New project inquiry received!</strong>
        </p>

        <p style="margin:0 0 24px 0;color:#4b5563;">
          Priority: <strong>${budget && budget !== 'Not provided' ? 'Budget Confirmed' : 'TBD'}</strong> | 
          ${submittedAt}
        </p>

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:24px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;">
          <tr>
            <td style="font-size:14px;line-height:20px;">
              <strong style="color:#065f46;">Client Information:</strong><br/>
              <span style="color:#047857;">👤 Name:</span>
              <strong style="color:#065f46;">${name || 'Not provided'}</strong><br/>
              <span style="color:#047857;">📧 Email:</span>
              <strong style="color:#065f46;">${email}</strong><br/>
              <span style="color:#047857;">📱 Phone:</span>
              <strong style="color:#065f46;">${phone || 'Not provided'}</strong><br/>
              <span style="color:#047857;">🏢 Company:</span>
              <strong style="color:#065f46;">${company || 'Not provided'}</strong>
            </td>
          </tr>
        </table>

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:16px 0;padding:20px;background:#ecfdf5;border:1px solid #6ee7b7;border-radius:8px;">
          <tr>
            <td style="font-size:14px;line-height:20px;">
              <strong style="color:#065f46;">Project Details:</strong><br/>
              <span style="color:#047857;">🎯 Type:</span>
              <strong style="color:#065f46;">${projectType || 'Custom'}</strong><br/>
              <span style="color:#047857;">💰 Budget:</span>
              <strong style="color:#065f46;">${budget || 'Not specified'}</strong><br/>
              <span style="color:#047857;">⏱️ Timeline:</span>
              <strong style="color:#065f46;">${timeline || 'Not specified'}</strong><br/>
              <span style="color:#047857;">🆔 Inquiry ID:</span>
              <strong style="color:#065f46;">${inquiryId}</strong>
            </td>
          </tr>
        </table>

        ${
          description
            ? `
              <p style="margin:0 0 8px 0;color:#4b5563;">
                <strong style="color:#111827;">Project Description:</strong>
              </p>
              <div style="margin:0 0 24px 0;padding:20px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;font-size:15px;line-height:22px;color:#0369a1;white-space:pre-wrap;">
                ${description}
              </div>
            `
            : ''
        }

        ${
          requirements && requirements.length > 0
            ? `
              <p style="margin:0 0 8px 0;color:#4b5563;">
                <strong style="color:#111827;">Requirements:</strong>
              </p>
              <div style="margin:0 0 24px 0;">
                ${requirements
                  .map(
                    (req, i) => `
                  <div style="padding:12px;margin-bottom:8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;font-size:14px;">
                    ${i + 1}. ${req}
                  </div>
                `
                  )
                  .join('')}
              </div>
            `
            : ''
        }
      `,
      ctaButton: {
        url: ctaUrl || _appUrl,
        text: 'View Project Lead →',
        color: '#059669'
      },
      secondaryCta: {
        url: ctaUrl || (ctaPath ? _appUrl + ctaPath : _appUrl),
        text: 'All Inquiries'
      },
      footerNote: `Project Lead #${inquiryId.slice(-6)} • High priority - respond ASAP`
    }),
    attachments: []
  };
};
const CONTACT_CONFIRMATION = ({
  name,
  subject,
  companyName,
  contactId,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `✅ ${companyName}: We received your "${subject || 'inquiry'}"`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Thank you for contacting ${companyName}! Your message has been received.`,
      title: 'Your Message is Confirmed',
      headerBg: '#10b981',
      headerText: '✅ Received!',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${name || 'there'}</strong>,
        </p>

        <p style="margin:0 0 24px 0;color:#4b5563;">
          Thank you for reaching out to <strong>${companyName}</strong>! 
          We've successfully received your inquiry and it will be reviewed by our team shortly.
        </p>

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:24px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;">
          <tr>
            <td style="font-size:14px;line-height:20px;text-align:center;">
              <strong style="color:#065f46;">Confirmation Details:</strong><br/>
              <span style="color:#047857;">📋 Subject:</span>
              <strong style="color:#065f46;">${subject || 'General inquiry'}</strong><br/>
              <span style="color:#047857;">🆔 Reference ID:</span>
              <strong style="color:#065f46;">${contactId}</strong><br/>
              <span style="color:#047857;">🏢 Company:</span>
              <strong style="color:#065f46;">${companyName}</strong>
            </td>
          </tr>
        </table>

        <p style="margin:24px 0 0 0;color:#4b5563;">
          <strong>What happens next:</strong>
        </p>

        <div style="margin:24px 0;">
          <div style="padding:16px;margin-bottom:12px;background:#f8fafc;border-left:4px solid #10b981;border-radius:0 8px 8px 0;">
            <strong>📋 Review</strong><br/>
            <span style="color:#64748b;font-size:14px;">Our team reviews within 24 hours</span>
          </div>
          <div style="padding:16px;margin-bottom:12px;background:#f8fafc;border-left:4px solid #10b981;border-radius:0 8px 8px 0;">
            <strong>💬 Response</strong><br/>
            <span style="color:#64748b;font-size:14px;">Detailed reply sent to you</span>
          </div>
          <div style="padding:16px;background:#f8fafc;border-left:4px solid #10b981;border-radius:0 8px 8px 0;">
            <strong>🚀 Action</strong><br/>
            <span style="color:#64748b;font-size:14px;">Next steps & scheduling</span>
          </div>
        </div>
      `,
      ctaButton: {
        url: ctaUrl || `${_appUrl}/support/ticket/${contactId}`,
        text: 'Track Status',
        color: '#10b981'
      },
      secondaryCta: {
        url: ctaUrl || (ctaPath ? _appUrl + ctaPath : `${_appUrl}/support`),
        text: 'Help Center'
      },
      footerNote: `Ref: ${contactId.slice(-6)} • Reply to this email if you have questions.`
    }),
    attachments: []
  };
};
const INQUIRY_CONFIRMATION = ({
  name,
  projectType,
  budget,
  timeline,
  companyName,
  inquiryId,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `✅ ${companyName}: ${projectType || 'Project'} Inquiry Confirmed`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Your ${projectType || 'project'} inquiry has been received & queued for review`,
      title: 'Project Inquiry Confirmed',
      headerBg: '#059669',
      headerText: '✅ Inquiry Received!',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${name || 'there'}</strong>,
        </p>

        <p style="margin:0 0 24px 0;color:#4b5563;">
          Thank you for your project inquiry with <strong>${companyName}</strong>! 
          We've received your details and our team will review and respond within <strong>24 hours</strong>.
        </p>

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:24px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;">
          <tr>
            <td style="font-size:14px;line-height:20px;text-align:center;">
              <strong style="color:#065f46;">Your Project Summary:</strong><br/>
              <span style="color:#047857;">🎯 Project Type:</span>
              <strong style="color:#065f46;">${projectType || 'Custom Development'}</strong><br/>
              <span style="color:#047857;">💰 Budget Range:</span>
              <strong style="color:#065f46;">${budget || 'To be discussed'}</strong><br/>
              <span style="color:#047857;">⏱️ Timeline:</span>
              <strong style="color:#065f46;">${timeline || 'Flexible'}</strong><br/>
              <span style="color:#047857;">🆔 Inquiry ID:</span>
              <strong style="color:#065f46;">${inquiryId}</strong>
            </td>
          </tr>
        </table>

        <p style="margin:24px 0 0 0;color:#4b5563;font-size:15px;line-height:22px;">
          <strong>Next steps:</strong>
        </p>

        <div style="margin:24px 0;">
          <div style="padding:16px;margin-bottom:12px;background:#f8fafc;border-left:4px solid #059669;border-radius:0 8px 8px 0;">
            <strong>👥 Team Assignment</strong><br/>
            <span style="color:#64748b;font-size:14px;">Project manager assigned within 24hrs</span>
          </div>
          <div style="padding:16px;margin-bottom:12px;background:#f8fafc;border-left:4px solid #059669;border-radius:0 8px 8px 0;">
            <strong>📋 Proposal</strong><br/>
            <span style="color:#64748b;font-size:14px;">Detailed scope & pricing sent</span>
          </div>
          <div style="padding:16px;background:#f8fafc;border-left:4px solid #059669;border-radius:0 8px 8px 0;">
            <strong>📞 Kickoff Call</strong><br/>
            <span style="color:#64748b;font-size:14px;">Schedule discovery meeting</span>
          </div>
        </div>

        <p style="margin:24px 0 0 0;color:#4b5563;">
          Questions? Reply to this email anytime.
        </p>
      `,
      ctaButton: {
        url: ctaUrl || _appUrl,
        text: 'Track Your Project',
        color: '#059669'
      },
      secondaryCta: {
        url: ctaUrl || (ctaPath ? _appUrl + ctaPath : _appUrl),
        text: 'View Our Services'
      },
      footerNote: `Project Ref: ${inquiryId.slice(-6)} • ${companyName} Team`
    }),
    attachments: []
  };
};

// =====================================================================================
// 📤 MODULE EXPORTS
// =====================================================================================

// =====================================================================================
// ✨ NEW MODERN TEMPLATES
// =====================================================================================

/** MAGIC_LINK — Passwordless one-click sign-in */
const MAGIC_LINK = ({ username, magicUrl, expiryMinutes = 15 }) => ({
  subject: 'Your Secure Sign-In Link',
  html: buildEmailHTML({
    preheader: `Click to sign in instantly. Expires in ${expiryMinutes} minutes.`,
    title: 'Your Sign-In Link',
    headerBg: '#2563eb',
    headerText: '✨ One-Click Sign In',
    bodyHTML: `
      <p style="margin:0 0 16px 0;">Hello <strong>${username || 'User'}</strong>,</p>
      <p style="margin:0 0 16px 0;color:#4b5563;">
        Click below to sign in instantly — no password needed.
        Valid for <strong>${expiryMinutes} minutes</strong>, single use only.
      </p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:16px 0;padding:14px 18px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:6px;">
        <tr><td style="font-size:13px;color:#92400e;">⚠️ Never share this link — it grants immediate access to your account.</td></tr>
      </table>
      <p style="margin:20px 0 0 0;color:#9ca3af;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
    `,
    primaryCTA: { url: magicUrl, text: 'Sign In Securely →', color: '#2563eb' },
    footerNote: 'This sign-in link is single-use and expires automatically.'
  }),
  attachments: []
});

/** TRIAL_EXPIRING — Trial period ending soon */
const TRIAL_EXPIRING = ({
  username,
  daysLeft = 3,
  planName = 'Pro',
  upgradeUrl,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => ({
  subject: `⏰ Your free trial ends in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
  html: buildEmailHTML({
    appUrl: _appUrl,
    applicationName: _appName,
    preheader: `Your ${planName} trial is ending soon. Upgrade to keep your features.`,
    title: 'Trial Ending Soon',
    headerBg: '#f59e0b',
    headerText: '⏰ Trial Ending Soon',
    bodyHTML: `
      <p style="margin:0 0 16px 0;">Hello <strong>${username || 'User'}</strong>,</p>
      <p style="margin:0 0 16px 0;color:#4b5563;">
        Your <strong>${planName}</strong> trial expires in <strong>${daysLeft} day${daysLeft !== 1 ? 's' : ''}</strong>. Upgrade now to keep all features.
      </p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;">
        <tr><td style="font-size:14px;line-height:24px;color:#92400e;">
          <strong>🌟 What you keep with a paid plan:</strong><br/>
          ✔ All premium features &amp; integrations<br/>
          ✔ Priority support<br/>
          ✔ No data loss — everything carries over
        </td></tr>
      </table>
    `,
    primaryCTA: {
      url: upgradeUrl || ctaUrl || `${_appUrl}/billing/upgrade`,
      text: 'Upgrade Now →',
      color: '#f59e0b'
    },
    secondaryCTA: {
      url: ctaUrl || (ctaPath ? _appUrl + ctaPath : `${_appUrl}/pricing`),
      text: 'View Plans'
    },
    footerNote: 'You can cancel anytime. No hidden fees.'
  }),
  attachments: []
});

/** DATA_EXPORT_READY — GDPR data export download ready */
const DATA_EXPORT_READY = ({
  username,
  downloadUrl,
  expiryHours = 24,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => ({
  subject: 'Your Data Export Is Ready to Download',
  html: buildEmailHTML({
    appUrl: _appUrl,
    applicationName: _appName,
    preheader: `Your account data export is ready. Download link expires in ${expiryHours}h.`,
    title: 'Data Export Ready',
    headerBg: '#0891b2',
    headerText: '📦 Your Data Is Ready',
    bodyHTML: `
      <p style="margin:0 0 16px 0;">Hello <strong>${username || 'User'}</strong>,</p>
      <p style="margin:0 0 16px 0;color:#4b5563;">Your data export has been processed and is ready to download.</p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:14px 18px;background:#ecfeff;border-left:4px solid #06b6d4;border-radius:6px;">
        <tr><td style="font-size:13px;color:#155e75;">
          ⏳ This link expires in <strong>${expiryHours} hours</strong>. Please download your data before it expires.
        </td></tr>
      </table>
      <p style="margin:16px 0 0 0;color:#4b5563;font-size:14px;">The export includes your profile, activity, and all associated account data.</p>
    `,
    primaryCTA: {
      url: downloadUrl || ctaUrl || `${_appUrl}/account/export`,
      text: '⬇ Download My Data',
      color: '#0891b2'
    },
    footerNote: 'Store your exported data securely. This link is single-use.'
  }),
  attachments: []
});

/** BIRTHDAY_GREETING — Birthday celebration with special discount */
const BIRTHDAY_GREETING = ({
  username,
  discountCode,
  discountPercent = 20,
  offerUrl,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => ({
  subject: `🎂 Happy Birthday, ${username || 'there'}! A gift from us`,
  html: buildEmailHTML({
    appUrl: _appUrl,
    applicationName: _appName,
    preheader: `Happy birthday! Enjoy ${discountPercent}% off as our gift to you.`,
    title: 'Happy Birthday!',
    headerBg: '#ec4899',
    headerText: '🎂 Happy Birthday!',
    bodyHTML: `
      <p style="margin:0 0 16px 0;">Hello <strong>${username || 'there'}</strong>, 🎉</p>
      <p style="margin:0 0 20px 0;color:#4b5563;">From all of us — happy birthday! Here's a little gift to celebrate.</p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:28px 0;">
        <tr><td align="center">
          <div style="display:inline-block;background:linear-gradient(135deg,#ec4899,#a855f7);padding:24px 56px;border-radius:16px;text-align:center;">
            <div style="color:rgba(255,255,255,0.85);font-size:12px;margin-bottom:4px;letter-spacing:2px;text-transform:uppercase;">Your Birthday Gift</div>
            <div style="color:#fff;font-size:52px;font-weight:800;line-height:1;">${discountPercent}%</div>
            <div style="color:rgba(255,255,255,0.85);font-size:12px;margin-top:4px;text-transform:uppercase;">Off Your Next Order</div>
            ${discountCode ? `<div style="color:#fff;font-size:16px;font-weight:700;font-family:monospace;margin-top:14px;background:rgba(255,255,255,0.2);padding:8px 20px;border-radius:8px;letter-spacing:4px;">${discountCode}</div>` : ''}
          </div>
        </td></tr>
      </table>
      <p style="margin:0;color:#9ca3af;font-size:13px;text-align:center;">Valid for 7 days. Single use only.</p>
    `,
    primaryCTA: {
      url: offerUrl || ctaUrl || `${_appUrl}/shop`,
      text: '🎁 Claim My Birthday Gift',
      color: '#ec4899'
    },
    footerNote: 'Valid 7 days from your birthday. Cannot be combined with other offers.'
  }),
  attachments: []
});

/** TEAM_INVITE — General team/workspace invitation */
const TEAM_INVITE = ({
  inviteeEmail,
  inviteeName,
  invitedBy,
  teamName,
  role,
  inviteUrl,
  expiresAt
}) => ({
  subject: `${invitedBy} invited you to join ${teamName}`,
  html: buildEmailHTML({
    appUrl: _appUrl,
    applicationName: _appName,
    preheader: `You've been invited to join ${teamName} as ${role || 'a member'}.`,
    title: `Join ${teamName}`,
    headerBg: '#10b981',
    headerText: '🤝 You Have an Invitation',
    bodyHTML: `
      <p style="margin:0 0 16px 0;">Hello <strong>${inviteeName || inviteeEmail}</strong>,</p>
      <p style="margin:0 0 16px 0;color:#4b5563;">
        <strong>${invitedBy}</strong> has invited you to join <strong>${teamName}</strong>.
      </p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
        <tr><td style="font-size:14px;line-height:24px;">
          <span style="color:#6b7280;">Team:</span> <strong style="color:#111827;">${teamName}</strong><br/>
          <span style="color:#6b7280;">Role:</span> <strong style="color:#10b981;">${role || 'Member'}</strong><br/>
          <span style="color:#6b7280;">Invited By:</span> <strong style="color:#111827;">${invitedBy}</strong><br/>
          ${expiresAt ? `<span style="color:#6b7280;">Expires:</span> <strong style="color:#dc2626;">${new Date(expiresAt).toLocaleString()}</strong>` : ''}
        </td></tr>
      </table>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:16px 0;padding:14px 18px;background:#d1fae5;border-left:4px solid #10b981;border-radius:6px;">
        <tr><td style="font-size:13px;color:#065f46;">✔ Click <strong>Accept Invitation</strong> to join and start collaborating.</td></tr>
      </table>
    `,
    primaryCTA: {
      url: inviteUrl || ctaUrl || `${_appUrl}/invite/accept`,
      text: 'Accept Invitation →',
      color: '#10b981'
    },
    footerNote: 'This invitation is unique to you. Do not share this link.'
  }),
  attachments: []
});

// =====================================================================================
// 🎯 LEAD & CONTACT MICROSERVICE EMAIL TEMPLATES (5 Templates)
// =====================================================================================

/**
 * LEAD_RECEIVED Email Template
 * Sent when: A new lead/contact inquiry is submitted (auto-reply to the lead)
 */
const LEAD_RECEIVED = ({
  firstName,
  lastName,
  leadNumber,
  subject,
  projectType,
  budget,
  timeline,
  companyName = 'Our Team',
  supportEmail = 'kishor81160@gmail.com',
  baseUrl = appUrl
}) => {
  return {
    subject: `✅ We received your inquiry – #${leadNumber || 'New'}`,
    html: buildEmailHTML({
      preheader: `Thank you for reaching out, ${firstName}! We'll be in touch shortly.`,
      title: 'Inquiry Received',
      headerBg: '#2563eb',
      headerText: '📬 Inquiry Received',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${firstName || 'there'}${lastName ? ' ' + lastName : ''}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Thank you for contacting us! We have received your inquiry and our team will review it shortly.
          You can expect to hear back from us within <strong>1–2 business days</strong>.
        </p>

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f0f9ff;border-left:4px solid #2563eb;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:22px;">
            <strong style="color:#1e40af;">Inquiry Reference:</strong> <span style="font-weight:700;color:#2563eb;">#${leadNumber || 'Pending'}</span><br/>
            ${subject ? `<strong>Subject:</strong> ${subject}<br/>` : ''}
            ${projectType ? `<strong>Project Type:</strong> ${projectType}<br/>` : ''}
            ${budget ? `<strong>Budget:</strong> ${budget}<br/>` : ''}
            ${timeline ? `<strong>Timeline:</strong> ${timeline}<br/>` : ''}
          </td></tr>
        </table>

        <p style="margin:0 0 16px 0;color:#4b5563;">
          Please keep your reference number handy for any future correspondence. 
          If you have urgent questions, feel free to reach us at 
          <a href="mailto:${supportEmail}" style="color:#2563eb;">${supportEmail}</a>.
        </p>

        <p style="margin:0;color:#4b5563;">
          Warm regards,<br/>
          <strong>${companyName}</strong>
        </p>
      `,
      ctaButton: { url: `${baseUrl}/contact`, text: 'Visit Our Website', color: '#2563eb' },
      footerNote: `Inquiry #${leadNumber || 'New'} — Thank you for reaching out.`
    }),
    attachments: []
  };
};

/**
 * LEAD_ADMIN_NOTIFICATION Email Template
 * Sent when: A new lead is submitted — notifies the admin/sales team
 */
const LEAD_ADMIN_NOTIFICATION = ({
  leadNumber,
  firstName,
  lastName,
  email,
  phone,
  company,
  subject,
  message,
  projectType,
  budget,
  timeline,
  source,
  priority,
  score,
  ipAddress,
  submittedAt,
  reviewUrl,
  assignedTo
}) => {
  const priorityColor =
    priority === 'urgent'
      ? '#dc2626'
      : priority === 'high'
        ? '#f59e0b'
        : priority === 'medium'
          ? '#2563eb'
          : '#10b981';

  return {
    subject: `🔔 New Lead #${leadNumber || 'New'}: ${firstName || ''} ${lastName || ''} — ${priority ? priority.toUpperCase() : 'MEDIUM'} Priority`,
    html: buildEmailHTML({
      preheader: `New lead from ${firstName} ${lastName} — ${company || 'Individual'}. Priority: ${priority || 'medium'}.`,
      title: 'New Lead Notification',
      headerBg: priorityColor,
      headerText: `🔔 New Lead — ${priority ? priority.charAt(0).toUpperCase() + priority.slice(1) : 'Medium'} Priority`,
      bodyHTML: `
        <p style="margin:0 0 16px 0;color:#4b5563;">
          A new lead has been submitted and is ready for follow-up.
        </p>

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 24px 0;border-collapse:collapse;">
          <tr style="background:#f9fafb;">
            <td colspan="2" style="padding:10px 16px;font-weight:700;color:#111827;font-size:14px;border-bottom:2px solid #e5e7eb;">
              👤 Contact Information
            </td>
          </tr>
          <tr><td style="padding:8px 16px;font-size:13px;color:#6b7280;width:40%;border-bottom:1px solid #f3f4f6;">Name</td><td style="padding:8px 16px;font-size:13px;color:#111827;font-weight:600;border-bottom:1px solid #f3f4f6;">${firstName || ''} ${lastName || ''}</td></tr>
          <tr style="background:#f9fafb;"><td style="padding:8px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Email</td><td style="padding:8px 16px;font-size:13px;border-bottom:1px solid #f3f4f6;"><a href="mailto:${email}" style="color:#2563eb;">${email || 'N/A'}</a></td></tr>
          <tr><td style="padding:8px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Phone</td><td style="padding:8px 16px;font-size:13px;color:#111827;border-bottom:1px solid #f3f4f6;">${phone || 'Not provided'}</td></tr>
          <tr style="background:#f9fafb;"><td style="padding:8px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Company</td><td style="padding:8px 16px;font-size:13px;color:#111827;border-bottom:1px solid #f3f4f6;">${company || 'Not provided'}</td></tr>
          <tr>
            <td colspan="2" style="padding:10px 16px;font-weight:700;color:#111827;font-size:14px;border-bottom:2px solid #e5e7eb;border-top:8px solid #f3f4f6;">
              📋 Lead Details
            </td>
          </tr>
          <tr><td style="padding:8px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Reference</td><td style="padding:8px 16px;font-size:13px;font-weight:700;color:#2563eb;border-bottom:1px solid #f3f4f6;">#${leadNumber || 'Pending'}</td></tr>
          <tr style="background:#f9fafb;"><td style="padding:8px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Subject</td><td style="padding:8px 16px;font-size:13px;color:#111827;border-bottom:1px solid #f3f4f6;">${subject || 'N/A'}</td></tr>
          <tr><td style="padding:8px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Project Type</td><td style="padding:8px 16px;font-size:13px;color:#111827;border-bottom:1px solid #f3f4f6;">${projectType || 'Not specified'}</td></tr>
          <tr style="background:#f9fafb;"><td style="padding:8px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Budget</td><td style="padding:8px 16px;font-size:13px;color:#111827;border-bottom:1px solid #f3f4f6;">${budget || 'Not specified'}</td></tr>
          <tr><td style="padding:8px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Timeline</td><td style="padding:8px 16px;font-size:13px;color:#111827;border-bottom:1px solid #f3f4f6;">${timeline || 'Not specified'}</td></tr>
          <tr style="background:#f9fafb;"><td style="padding:8px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Priority</td><td style="padding:8px 16px;font-size:13px;font-weight:700;color:${priorityColor};text-transform:uppercase;border-bottom:1px solid #f3f4f6;">${priority || 'medium'}</td></tr>
          <tr><td style="padding:8px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Lead Score</td><td style="padding:8px 16px;font-size:13px;font-weight:700;color:#111827;border-bottom:1px solid #f3f4f6;">${score !== undefined ? score + '/100' : 'N/A'}</td></tr>
          <tr style="background:#f9fafb;"><td style="padding:8px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Source</td><td style="padding:8px 16px;font-size:13px;color:#111827;border-bottom:1px solid #f3f4f6;">${source || 'website'}</td></tr>
          <tr><td style="padding:8px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Assigned To</td><td style="padding:8px 16px;font-size:13px;color:#111827;border-bottom:1px solid #f3f4f6;">${assignedTo || 'Unassigned'}</td></tr>
          <tr style="background:#f9fafb;"><td style="padding:8px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Submitted At</td><td style="padding:8px 16px;font-size:13px;color:#111827;border-bottom:1px solid #f3f4f6;">${submittedAt ? new Date(submittedAt).toLocaleString() : new Date().toLocaleString()}</td></tr>
          <tr><td style="padding:8px 16px;font-size:13px;color:#6b7280;">IP Address</td><td style="padding:8px 16px;font-size:13px;color:#111827;">${ipAddress || 'N/A'}</td></tr>
        </table>

        ${
          message
            ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 24px 0;padding:16px;background:#f9fafb;border-radius:8px;border-left:3px solid #d1d5db;">
          <tr><td>
            <strong style="font-size:13px;color:#374151;">Message:</strong>
            <p style="margin:8px 0 0 0;font-size:13px;color:#4b5563;line-height:1.6;">${message}</p>
          </td></tr>
        </table>
        `
            : ''
        }
      `,
      ctaButton: reviewUrl ? { url: reviewUrl, text: 'Review Lead', color: priorityColor } : null,
      footerNote: `Lead #${leadNumber || 'New'} — Internal admin notification. Do not forward.`
    }),
    attachments: []
  };
};

/**
 * LEAD_CONTACT_REPLY Email Template
 * Sent when: An agent sends a follow-up message to a lead
 */
const LEAD_CONTACT_REPLY = ({
  firstName,
  lastName,
  leadNumber,
  subject,
  message,
  agentName,
  agentEmail,
  agentTitle,
  companyName = 'Our Team',
  replyUrl
}) => {
  return {
    subject: subject || `Re: Your inquiry #${leadNumber || ''} — ${companyName}`,
    html: buildEmailHTML({
      preheader: `${agentName || 'Our team'} has sent you a reply regarding your inquiry.`,
      title: 'Reply to Your Inquiry',
      headerBg: '#0f766e',
      headerText: '💬 Reply to Your Inquiry',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${firstName || 'there'}${lastName ? ' ' + lastName : ''}</strong>,
        </p>

        ${
          leadNumber
            ? `
        <p style="margin:0 0 12px 0;font-size:13px;color:#6b7280;">
          Re: Inquiry <strong style="color:#0f766e;">#${leadNumber}</strong>
        </p>
        `
            : ''
        }

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 24px 0;padding:20px;background:#f0fdfa;border-left:4px solid #0f766e;border-radius:4px;">
          <tr><td style="font-size:14px;line-height:22px;color:#134e4a;">
            ${message || 'Thank you for your interest. We will be in touch shortly.'}
          </td></tr>
        </table>

        ${
          agentName
            ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0 0 0;padding:16px;background:#f9fafb;border-radius:8px;">
          <tr><td style="font-size:13px;color:#374151;line-height:20px;">
            <strong>${agentName}</strong><br/>
            ${agentTitle ? `<span style="color:#6b7280;">${agentTitle}</span><br/>` : ''}
            <strong>${companyName}</strong><br/>
            ${agentEmail ? `<a href="mailto:${agentEmail}" style="color:#0f766e;">${agentEmail}</a>` : ''}
          </td></tr>
        </table>
        `
            : ''
        }
      `,
      ctaButton: replyUrl
        ? { url: replyUrl, text: 'Reply to This Message', color: '#0f766e' }
        : null,
      footerNote: `Inquiry #${leadNumber || ''} — ${companyName}`
    }),
    attachments: []
  };
};

/**
 * LEAD_STATUS_CHANGED Email Template
 * Sent when: A lead's status changes — notifies the lead (e.g., Won / Qualified)
 */
const LEAD_STATUS_CHANGED = ({
  firstName,
  lastName,
  leadNumber,
  oldStatus,
  newStatus,
  note,
  agentName,
  companyName = 'Our Team',
  ctaUrl,
  ctaText
}) => {
  const isPositive = ['won', 'qualified', 'proposal_sent'].includes(
    (newStatus || '').toLowerCase()
  );
  const headerBg = isPositive ? '#16a34a' : newStatus === 'lost' ? '#dc2626' : '#2563eb';
  const statusLabel = (newStatus || 'updated')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

  return {
    subject: `📋 Update on your inquiry #${leadNumber || ''} — Status: ${statusLabel}`,
    html: buildEmailHTML({
      preheader: `Your inquiry status has been updated to: ${statusLabel}.`,
      title: 'Inquiry Status Update',
      headerBg,
      headerText: `📋 Inquiry Status Update`,
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${firstName || 'there'}${lastName ? ' ' + lastName : ''}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We wanted to update you on the status of your inquiry 
          <strong style="color:${headerBg};">#${leadNumber || ''}</strong>.
        </p>

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f9fafb;border-radius:8px;text-align:center;">
          <tr><td>
            ${oldStatus ? `<p style="margin:0 0 8px 0;font-size:13px;color:#6b7280;">Previous Status: <span style="text-decoration:line-through;">${oldStatus.replace(/_/g, ' ')}</span></p>` : ''}
            <p style="margin:0;font-size:22px;font-weight:700;color:${headerBg};">
              ${statusLabel}
            </p>
          </td></tr>
        </table>

        ${
          note
            ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 24px 0;padding:16px;background:#f0f9ff;border-left:4px solid ${headerBg};border-radius:4px;">
          <tr><td style="font-size:14px;line-height:22px;color:#1e40af;">
            ${note}
          </td></tr>
        </table>
        `
            : ''
        }

        <p style="margin:0 0 0 0;color:#4b5563;">
          ${isPositive ? 'We look forward to working with you!' : 'Thank you for your time and interest.'}<br/>
          ${agentName ? `<br/>Best regards,<br/><strong>${agentName}</strong><br/><strong>${companyName}</strong>` : `<br/><strong>${companyName}</strong>`}
        </p>
      `,
      ctaButton: ctaUrl ? { url: ctaUrl, text: ctaText || 'View Details', color: headerBg } : null,
      footerNote: `Inquiry #${leadNumber || ''} — ${companyName}`
    }),
    attachments: []
  };
};

/**
 * LEAD_FOLLOW_UP_REMINDER Email Template
 * Sent when: An agent has a follow-up task due for a lead (internal reminder)
 */
const LEAD_FOLLOW_UP_REMINDER = ({
  agentName,
  leadNumber,
  leadFirstName,
  leadLastName,
  leadEmail,
  leadCompany,
  priority,
  followUpDate,
  daysSinceLastContact,
  notes,
  reviewUrl
}) => {
  const priorityColor =
    priority === 'urgent' ? '#dc2626' : priority === 'high' ? '#f59e0b' : '#2563eb';

  return {
    subject: `⏰ Follow-up Reminder: ${leadFirstName || ''} ${leadLastName || ''} — Lead #${leadNumber || ''}`,
    html: buildEmailHTML({
      preheader: `You have a follow-up due for lead #${leadNumber} — ${leadFirstName} ${leadLastName || ''}.`,
      title: 'Follow-Up Reminder',
      headerBg: priorityColor,
      headerText: '⏰ Follow-Up Reminder',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${agentName || 'Team'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          This is a reminder that you have a follow-up due for the following lead.
        </p>

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 24px 0;border-collapse:collapse;">
          <tr style="background:#f9fafb;">
            <td colspan="2" style="padding:10px 16px;font-weight:700;color:#111827;font-size:14px;border-bottom:2px solid #e5e7eb;">
              Lead Details
            </td>
          </tr>
          <tr><td style="padding:8px 16px;font-size:13px;color:#6b7280;width:40%;border-bottom:1px solid #f3f4f6;">Reference</td><td style="padding:8px 16px;font-size:13px;font-weight:700;color:${priorityColor};border-bottom:1px solid #f3f4f6;">#${leadNumber || 'N/A'}</td></tr>
          <tr style="background:#f9fafb;"><td style="padding:8px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Name</td><td style="padding:8px 16px;font-size:13px;color:#111827;font-weight:600;border-bottom:1px solid #f3f4f6;">${leadFirstName || ''} ${leadLastName || ''}</td></tr>
          <tr><td style="padding:8px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Email</td><td style="padding:8px 16px;font-size:13px;border-bottom:1px solid #f3f4f6;"><a href="mailto:${leadEmail}" style="color:#2563eb;">${leadEmail || 'N/A'}</a></td></tr>
          <tr style="background:#f9fafb;"><td style="padding:8px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Company</td><td style="padding:8px 16px;font-size:13px;color:#111827;border-bottom:1px solid #f3f4f6;">${leadCompany || 'Individual'}</td></tr>
          <tr><td style="padding:8px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Priority</td><td style="padding:8px 16px;font-size:13px;font-weight:700;color:${priorityColor};text-transform:uppercase;border-bottom:1px solid #f3f4f6;">${priority || 'medium'}</td></tr>
          <tr style="background:#f9fafb;"><td style="padding:8px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Follow-up Date</td><td style="padding:8px 16px;font-size:13px;color:#111827;border-bottom:1px solid #f3f4f6;">${followUpDate ? new Date(followUpDate).toLocaleDateString() : 'Today'}</td></tr>
          <tr><td style="padding:8px 16px;font-size:13px;color:#6b7280;">Last Contacted</td><td style="padding:8px 16px;font-size:13px;color:#111827;">${daysSinceLastContact !== undefined ? daysSinceLastContact + ' days ago' : 'Not yet contacted'}</td></tr>
        </table>

        ${
          notes
            ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 24px 0;padding:16px;background:#fffbeb;border-left:4px solid #f59e0b;border-radius:4px;">
          <tr><td style="font-size:13px;color:#92400e;line-height:1.6;">
            <strong>Notes:</strong><br/>${notes}
          </td></tr>
        </table>
        `
            : ''
        }
      `,
      ctaButton: reviewUrl ? { url: reviewUrl, text: 'Open Lead', color: priorityColor } : null,
      footerNote: `Internal reminder — Lead #${leadNumber || ''} • Do not forward.`
    }),
    attachments: []
  };
};

// -----------------------------------------------------------------------------
// Project proposal email with attachment and download button
// -----------------------------------------------------------------------------
const PROJECT_PROPOSAL_EMAIL = ({
  clientName,
  projectName,
  proposalUrl,
  proposalNumber,
  issueDate,
  validUntil,
  companyName = 'Your Company',
  contactEmail = 'kishor81160@gmail.com',
  contactPhone = '',
  attachmentName = 'proposal.pdf',
  message = '',
  baseUrl = appUrl
}) => {
  const downloadLink = proposalUrl || '#';

  return {
    subject: `📄 Proposal #${proposalNumber || ''} for ${projectName}`,
    html: buildEmailHTML({
      preheader: `Your project proposal for ${projectName} is ready`,
      title: 'Project Proposal',
      headerBg: '#2563eb',
      headerText: 'Proposal Ready',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${clientName || 'Valued Client'}</strong>,
        </p>

        <p style="margin:0 0 16px 0;color:#4b5563;">
          Thank you for the opportunity to collaborate with us on 
          <strong>${projectName}</strong>. We have prepared a detailed proposal 
          outlining the scope, timeline, and estimated investment for this project.
        </p>

        <div style="background:#f9fafb;padding:16px;border-radius:8px;margin:20px 0;">
          <p style="margin:4px 0;"><strong>Proposal Number:</strong> ${proposalNumber || 'N/A'}</p>
          <p style="margin:4px 0;"><strong>Project:</strong> ${projectName}</p>
          <p style="margin:4px 0;"><strong>Issue Date:</strong> ${issueDate || 'N/A'}</p>
          <p style="margin:4px 0;"><strong>Valid Until:</strong> ${validUntil || 'N/A'}</p>
        </div>

        <p style="margin:0 0 16px 0;color:#4b5563;">
          ${
            message ||
            'Please review the attached proposal document which includes project deliverables, timeline, and pricing structure.'
          }
        </p>

        <div style="text-align:center;margin:28px 0;">
          <a href="${downloadLink}"
             style="display:inline-block;padding:14px 26px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;"
             target="_blank" rel="noopener">
            Download Full Proposal
          </a>
        </div>

        <p style="margin:16px 0;color:#4b5563;">
          If you have any questions or would like to discuss adjustments to the scope or timeline, 
          please feel free to reach out. We would also be happy to schedule a call to walk you through the proposal.
        </p>

        <p style="margin:16px 0;color:#4b5563;">
          <strong>Next Steps:</strong>
        </p>

        <ul style="color:#4b5563;padding-left:20px;">
          <li>Review the attached proposal document</li>
          <li>Share your feedback or requested modifications</li>
          <li>Confirm approval so we can initiate the project kickoff</li>
        </ul>

        <p style="margin:20px 0;color:#4b5563;">
          You may also access the proposal using the link below:
        </p>

        <p style="word-break:break-all;">
          <a href="${downloadLink}" style="color:#2563eb;text-decoration:none;">
            ${downloadLink}
          </a>
        </p>

        <p style="margin:24px 0 0 0;color:#4b5563;">
          We appreciate your time and look forward to the possibility of working together.
        </p>

        <p style="margin:20px 0 0 0;color:#4b5563;">
          Best regards,<br/>
          <strong>${companyName}</strong><br/>
          ${contactEmail ? `Email: ${contactEmail}<br/>` : ''}
          ${contactPhone ? `Phone: ${contactPhone}` : ''}
        </p>
      `,
      footerNote: `Proposal ${proposalNumber || ''} • ${projectName}`
    }),
    attachments: [{ filename: attachmentName, path: downloadLink }]
  };
};

// =====================================================================================
// 🏆 PROPOSAL & CONTRACT LIFECYCLE TEMPLATES

/**
 * LEAD_PROPOSAL_ACCEPTED — Sent to the lead when they accept a proposal
 */
const LEAD_PROPOSAL_ACCEPTED = ({
  firstName,
  leadNumber,
  projectName,
  quotedAmount,
  quotedCurrency = 'USD',
  agentName,
  nextStep,
  companyName = 'Your Company'
}) => ({
  subject: `🎉 Proposal Accepted — ${projectName || `Lead #${leadNumber}`}`,
  html: buildEmailHTML({
    preheader: `Great news! Your acceptance of the proposal for ${projectName} has been confirmed.`,
    title: 'Proposal Accepted',
    headerBg: '#16a34a',
    headerText: '✅ Proposal Accepted',
    bodyHTML: `
      <p style="margin:0 0 16px 0;">Hello <strong>${firstName || 'Valued Client'}</strong>,</p>
      <p style="margin:0 0 16px 0;color:#4b5563;">
        Thank you! We have received your acceptance of the proposal for <strong>${projectName}</strong>.
        We are excited to move forward with you.
      </p>
      ${
        quotedAmount
          ? `
      <div style="background:#f0fdf4;padding:16px;border-radius:8px;margin:20px 0;border-left:4px solid #16a34a;">
        <p style="margin:4px 0;"><strong>Lead Reference:</strong> #${leadNumber || 'N/A'}</p>
        <p style="margin:4px 0;"><strong>Project:</strong> ${projectName}</p>
        <p style="margin:4px 0;"><strong>Agreed Amount:</strong> ${quotedCurrency} ${Number(quotedAmount).toLocaleString()}</p>
      </div>`
          : ''
      }
      ${nextStep ? `<p style="margin:16px 0;color:#4b5563;"><strong>Next Step:</strong> ${nextStep}</p>` : ''}
      <p style="margin:20px 0 0 0;color:#4b5563;">Best regards,<br/><strong>${agentName || companyName}</strong></p>
    `,
    footerNote: `Lead #${leadNumber || ''} • ${companyName}`
  }),
  attachments: []
});

/**
 * LEAD_ADMIN_PROPOSAL_ACCEPTED — Sent to admin team when a lead accepts a proposal
 */
const LEAD_ADMIN_PROPOSAL_ACCEPTED = ({
  leadNumber,
  firstName,
  lastName,
  email,
  company,
  projectName,
  quotedAmount,
  quotedCurrency = 'USD',
  reviewUrl
}) => ({
  subject: `✅ Proposal Accepted — #${leadNumber} ${firstName || ''} ${lastName || ''}`,
  html: buildEmailHTML({
    preheader: `${firstName} ${lastName || ''} has accepted the proposal for ${projectName}.`,
    title: 'Proposal Accepted — Admin Alert',
    headerBg: '#16a34a',
    headerText: '✅ Proposal Accepted',
    bodyHTML: `
      <p style="margin:0 0 16px 0;color:#4b5563;">A lead has accepted the proposal. Review and send the contract.</p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse:collapse;margin:0 0 24px 0;">
        <tr><td style="padding:8px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Reference</td><td style="padding:8px 16px;font-size:13px;font-weight:700;color:#16a34a;border-bottom:1px solid #f3f4f6;">#${leadNumber}</td></tr>
        <tr style="background:#f9fafb;"><td style="padding:8px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Lead</td><td style="padding:8px 16px;font-size:13px;color:#111827;border-bottom:1px solid #f3f4f6;">${firstName || ''} ${lastName || ''}</td></tr>
        <tr><td style="padding:8px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Email</td><td style="padding:8px 16px;font-size:13px;border-bottom:1px solid #f3f4f6;"><a href="mailto:${email}" style="color:#2563eb;">${email || ''}</a></td></tr>
        <tr style="background:#f9fafb;"><td style="padding:8px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Company</td><td style="padding:8px 16px;font-size:13px;color:#111827;border-bottom:1px solid #f3f4f6;">${company || 'N/A'}</td></tr>
        <tr><td style="padding:8px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Project</td><td style="padding:8px 16px;font-size:13px;color:#111827;border-bottom:1px solid #f3f4f6;">${projectName || 'N/A'}</td></tr>
        <tr style="background:#f9fafb;"><td style="padding:8px 16px;font-size:13px;color:#6b7280;">Agreed Amount</td><td style="padding:8px 16px;font-size:13px;font-weight:700;color:#16a34a;">${quotedCurrency} ${quotedAmount ? Number(quotedAmount).toLocaleString() : 'N/A'}</td></tr>
      </table>
    `,
    ctaButton: reviewUrl
      ? { url: reviewUrl, text: 'Open Lead & Send Contract', color: '#16a34a' }
      : null,
    footerNote: `Admin alert — Lead #${leadNumber || ''} accepted proposal.`
  }),
  attachments: []
});

/**
 * LEAD_PROPOSAL_DECLINED_ACK — Sent to the lead acknowledging they declined; keeps door open
 */
const LEAD_PROPOSAL_DECLINED_ACK = ({
  firstName,
  leadNumber,
  projectName,
  agentName,
  companyName = 'Your Company',
  supportEmail
}) => ({
  subject: `Re: Proposal for ${projectName || `Lead #${leadNumber}`}`,
  html: buildEmailHTML({
    preheader: `Thank you for your feedback on the proposal for ${projectName}.`,
    title: 'Thank You for Your Feedback',
    headerBg: '#6b7280',
    headerText: 'Thank You for Your Feedback',
    bodyHTML: `
      <p style="margin:0 0 16px 0;">Hello <strong>${firstName || 'Valued Client'}</strong>,</p>
      <p style="margin:0 0 16px 0;color:#4b5563;">
        Thank you for taking the time to review our proposal for <strong>${projectName}</strong>.
        We appreciate your candid response.
      </p>
      <p style="margin:0 0 16px 0;color:#4b5563;">
        If any aspect of the proposal — pricing, scope, or timeline — was not a fit, 
        we would be happy to revisit and tailor a revised proposal to better meet your needs.
      </p>
      <p style="margin:0 0 16px 0;color:#4b5563;">
        Please feel free to reach out at any time. We remain available to explore how we can 
        support your goals.
      </p>
      ${supportEmail ? `<p style="margin:20px 0 0 0;color:#4b5563;">Contact us: <a href="mailto:${supportEmail}" style="color:#2563eb;">${supportEmail}</a></p>` : ''}
      <p style="margin:20px 0 0 0;color:#4b5563;">Best regards,<br/><strong>${agentName || companyName}</strong></p>
    `,
    footerNote: `Lead #${leadNumber || ''} • ${companyName}`
  }),
  attachments: []
});

/**
 * LEAD_ADMIN_PROPOSAL_DECLINED — Sent to admin team when a lead declines a proposal
 */
const LEAD_ADMIN_PROPOSAL_DECLINED = ({
  leadNumber,
  firstName,
  lastName,
  email,
  company,
  declinedReason,
  reviewUrl
}) => ({
  subject: `❌ Proposal Declined — #${leadNumber} ${firstName || ''} ${lastName || ''}`,
  html: buildEmailHTML({
    preheader: `${firstName} ${lastName || ''} has declined the proposal.`,
    title: 'Proposal Declined — Admin Alert',
    headerBg: '#dc2626',
    headerText: '❌ Proposal Declined',
    bodyHTML: `
      <p style="margin:0 0 16px 0;color:#4b5563;">A lead has declined the proposal. Consider revising and resending.</p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse:collapse;margin:0 0 24px 0;">
        <tr><td style="padding:8px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Reference</td><td style="padding:8px 16px;font-size:13px;font-weight:700;color:#dc2626;border-bottom:1px solid #f3f4f6;">#${leadNumber}</td></tr>
        <tr style="background:#f9fafb;"><td style="padding:8px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Lead</td><td style="padding:8px 16px;font-size:13px;color:#111827;border-bottom:1px solid #f3f4f6;">${firstName || ''} ${lastName || ''}</td></tr>
        <tr><td style="padding:8px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Email</td><td style="padding:8px 16px;font-size:13px;border-bottom:1px solid #f3f4f6;"><a href="mailto:${email}" style="color:#2563eb;">${email || ''}</a></td></tr>
        <tr style="background:#f9fafb;"><td style="padding:8px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Company</td><td style="padding:8px 16px;font-size:13px;color:#111827;border-bottom:1px solid #f3f4f6;">${company || 'N/A'}</td></tr>
        ${
          declinedReason
            ? `
        <tr><td style="padding:8px 16px;font-size:13px;color:#6b7280;vertical-align:top;">Decline Reason</td><td style="padding:8px 16px;font-size:13px;color:#111827;font-style:italic;">${declinedReason}</td></tr>
        `
            : ''
        }
      </table>
    `,
    ctaButton: reviewUrl ? { url: reviewUrl, text: 'Review Lead', color: '#dc2626' } : null,
    footerNote: `Admin alert — Lead #${leadNumber || ''} declined proposal.`
  }),
  attachments: []
});

/**
 * LEAD_PROPOSAL_EXPIRING — Alert sent to admin/agent when proposal is expiring soon
 */
const LEAD_PROPOSAL_EXPIRING = ({
  leadNumber,
  firstName,
  lastName,
  email,
  proposalNumber,
  validUntil,
  daysRemaining,
  reviewUrl
}) => ({
  subject: `⚠️ Proposal Expiring in ${daysRemaining} Day${daysRemaining === 1 ? '' : 's'} — #${leadNumber}`,
  html: buildEmailHTML({
    preheader: `Proposal ${proposalNumber} for ${firstName} ${lastName || ''} expires in ${daysRemaining} day(s).`,
    title: 'Proposal Expiring Soon',
    headerBg: '#f59e0b',
    headerText: '⚠️ Proposal Expiring Soon',
    bodyHTML: `
      <p style="margin:0 0 16px 0;color:#4b5563;">
        The following proposal is expiring in <strong>${daysRemaining} day${daysRemaining === 1 ? '' : 's'}</strong>. 
        Reach out to the lead to follow up.
      </p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse:collapse;margin:0 0 24px 0;">
        <tr><td style="padding:8px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Lead Reference</td><td style="padding:8px 16px;font-size:13px;font-weight:700;color:#f59e0b;border-bottom:1px solid #f3f4f6;">#${leadNumber}</td></tr>
        <tr style="background:#f9fafb;"><td style="padding:8px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Lead</td><td style="padding:8px 16px;font-size:13px;color:#111827;border-bottom:1px solid #f3f4f6;">${firstName || ''} ${lastName || ''}</td></tr>
        <tr><td style="padding:8px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Email</td><td style="padding:8px 16px;font-size:13px;border-bottom:1px solid #f3f4f6;"><a href="mailto:${email}" style="color:#2563eb;">${email || ''}</a></td></tr>
        <tr style="background:#f9fafb;"><td style="padding:8px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Proposal #</td><td style="padding:8px 16px;font-size:13px;color:#111827;border-bottom:1px solid #f3f4f6;">${proposalNumber || 'N/A'}</td></tr>
        <tr><td style="padding:8px 16px;font-size:13px;color:#6b7280;">Expires</td><td style="padding:8px 16px;font-size:13px;font-weight:700;color:#dc2626;">${validUntil ? new Date(validUntil).toLocaleDateString() : 'N/A'}</td></tr>
      </table>
    `,
    ctaButton: reviewUrl ? { url: reviewUrl, text: 'Follow Up Now', color: '#f59e0b' } : null,
    footerNote: `Automated expiry alert — Lead #${leadNumber || ''}`
  }),
  attachments: []
});

/**
 * LEAD_PROPOSAL_EXPIRED — Sent to admin when a proposal has passed its validity date
 */
const LEAD_PROPOSAL_EXPIRED = ({
  leadNumber,
  firstName,
  lastName,
  email,
  proposalNumber,
  expiredAt,
  reviewUrl
}) => ({
  subject: `🕐 Proposal Expired — #${leadNumber} ${firstName || ''} ${lastName || ''}`,
  html: buildEmailHTML({
    preheader: `Proposal ${proposalNumber} for ${firstName} ${lastName || ''} has expired without response.`,
    title: 'Proposal Expired',
    headerBg: '#6b7280',
    headerText: '🕐 Proposal Expired',
    bodyHTML: `
      <p style="margin:0 0 16px 0;color:#4b5563;">
        The following proposal has expired without a response from the lead.
        Consider sending a revised proposal or marking the lead as lost.
      </p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse:collapse;margin:0 0 24px 0;">
        <tr><td style="padding:8px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Reference</td><td style="padding:8px 16px;font-size:13px;font-weight:700;color:#6b7280;border-bottom:1px solid #f3f4f6;">#${leadNumber}</td></tr>
        <tr style="background:#f9fafb;"><td style="padding:8px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Lead</td><td style="padding:8px 16px;font-size:13px;color:#111827;border-bottom:1px solid #f3f4f6;">${firstName || ''} ${lastName || ''}</td></tr>
        <tr><td style="padding:8px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Email</td><td style="padding:8px 16px;font-size:13px;border-bottom:1px solid #f3f4f6;"><a href="mailto:${email}" style="color:#2563eb;">${email || ''}</a></td></tr>
        <tr style="background:#f9fafb;"><td style="padding:8px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Proposal #</td><td style="padding:8px 16px;font-size:13px;color:#111827;border-bottom:1px solid #f3f4f6;">${proposalNumber || 'N/A'}</td></tr>
        <tr><td style="padding:8px 16px;font-size:13px;color:#6b7280;">Expired At</td><td style="padding:8px 16px;font-size:13px;color:#dc2626;">${expiredAt ? new Date(expiredAt).toLocaleString() : 'N/A'}</td></tr>
      </table>
    `,
    ctaButton: reviewUrl ? { url: reviewUrl, text: 'Review Lead', color: '#6b7280' } : null,
    footerNote: `Automated expiry notice — Lead #${leadNumber || ''}`
  }),
  attachments: []
});

/**
 * LEAD_CONTRACT_SENT — Sent to the lead when a contract is sent for signing
 */
const LEAD_CONTRACT_SENT = ({
  firstName,
  leadNumber,
  projectName,
  contractUrl,
  agentName,
  companyName = 'Your Company',
  message
}) => ({
  subject: `📝 Contract Ready for Signing — ${projectName || `Project #${leadNumber}`}`,
  html: buildEmailHTML({
    preheader: `Your contract for ${projectName} is ready to review and sign.`,
    title: 'Contract Ready',
    headerBg: '#7c3aed',
    headerText: '📝 Contract Ready for Signing',
    bodyHTML: `
      <p style="margin:0 0 16px 0;">Hello <strong>${firstName || 'Valued Client'}</strong>,</p>
      <p style="margin:0 0 16px 0;color:#4b5563;">
        Following your acceptance of our proposal for <strong>${projectName}</strong>,
        we have prepared the contract for your review and signature.
      </p>
      ${message ? `<p style="margin:0 0 16px 0;color:#4b5563;">${message}</p>` : ''}
      <div style="text-align:center;margin:28px 0;">
        <a href="${contractUrl || '#'}" style="display:inline-block;padding:14px 26px;background:#7c3aed;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;" target="_blank" rel="noopener">
          Review & Sign Contract
        </a>
      </div>
      <p style="margin:0 0 16px 0;color:#4b5563;">
        Please review all terms carefully. If you have any questions or need clarifications, 
        do not hesitate to reach out before signing.
      </p>
      <p style="margin:20px 0 0 0;color:#4b5563;">Best regards,<br/><strong>${agentName || companyName}</strong></p>
    `,
    footerNote: `Lead #${leadNumber || ''} • ${companyName}`
  }),
  attachments: []
});

/**
 * LEAD_CONTRACT_SIGNED — Sent to the lead/admin when the contract is signed
 */
const LEAD_CONTRACT_SIGNED = ({
  firstName,
  leadNumber,
  projectName,
  contractSignedAt,
  agentName,
  companyName = 'Your Company'
}) => ({
  subject: `✅ Contract Signed — ${projectName || `Project #${leadNumber}`}`,
  html: buildEmailHTML({
    preheader: `The contract for ${projectName} has been signed. Welcome aboard!`,
    title: 'Contract Signed',
    headerBg: '#16a34a',
    headerText: '✅ Contract Signed — Welcome Aboard!',
    bodyHTML: `
      <p style="margin:0 0 16px 0;">Hello <strong>${firstName || 'Valued Client'}</strong>,</p>
      <p style="margin:0 0 16px 0;color:#4b5563;">
        Excellent news! The contract for <strong>${projectName}</strong> has been signed 
        ${contractSignedAt ? `on <strong>${new Date(contractSignedAt).toLocaleDateString()}</strong>` : ''}.
        We are officially ready to begin.
      </p>
      <p style="margin:0 0 16px 0;color:#4b5563;">
        Our team will be in touch shortly to schedule the project kickoff and walk you through the next steps.
        We look forward to delivering exceptional results for you.
      </p>
      <p style="margin:20px 0 0 0;color:#4b5563;">Best regards,<br/><strong>${agentName || companyName}</strong></p>
    `,
    footerNote: `Lead #${leadNumber || ''} • ${companyName} — Contract signed`
  }),
  attachments: []
});

/**
 * LEAD_WON_NOTIFICATION — Sent to admin/team when a lead is marked as Won
 */
const LEAD_WON_NOTIFICATION = ({
  leadNumber,
  firstName,
  lastName,
  email,
  company,
  projectName,
  quotedAmount,
  quotedCurrency = 'USD',
  closedAt,
  agentName,
  reviewUrl
}) => ({
  subject: `🏆 Deal Won — #${leadNumber} ${firstName || ''} ${lastName || ''}`,
  html: buildEmailHTML({
    preheader: `Deal closed! ${firstName} ${lastName || ''} from ${company || 'the client'} is now Won.`,
    title: 'Deal Won — Admin Notification',
    headerBg: '#15803d',
    headerText: '🏆 Deal Won!',
    bodyHTML: `
      <p style="margin:0 0 16px 0;color:#4b5563;">Great work, team! A new deal has been closed.</p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse:collapse;margin:0 0 24px 0;">
        <tr><td style="padding:8px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Reference</td><td style="padding:8px 16px;font-size:13px;font-weight:700;color:#15803d;border-bottom:1px solid #f3f4f6;">#${leadNumber}</td></tr>
        <tr style="background:#f9fafb;"><td style="padding:8px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Client</td><td style="padding:8px 16px;font-size:13px;font-weight:600;color:#111827;border-bottom:1px solid #f3f4f6;">${firstName || ''} ${lastName || ''}</td></tr>
        <tr><td style="padding:8px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Email</td><td style="padding:8px 16px;font-size:13px;border-bottom:1px solid #f3f4f6;"><a href="mailto:${email}" style="color:#2563eb;">${email || ''}</a></td></tr>
        <tr style="background:#f9fafb;"><td style="padding:8px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Company</td><td style="padding:8px 16px;font-size:13px;color:#111827;border-bottom:1px solid #f3f4f6;">${company || 'N/A'}</td></tr>
        <tr><td style="padding:8px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Project</td><td style="padding:8px 16px;font-size:13px;color:#111827;border-bottom:1px solid #f3f4f6;">${projectName || 'N/A'}</td></tr>
        ${quotedAmount ? `<tr style="background:#f9fafb;"><td style="padding:8px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Revenue</td><td style="padding:8px 16px;font-size:14px;font-weight:700;color:#15803d;border-bottom:1px solid #f3f4f6;">${quotedCurrency} ${Number(quotedAmount).toLocaleString()}</td></tr>` : ''}
        <tr><td style="padding:8px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Closed By</td><td style="padding:8px 16px;font-size:13px;color:#111827;border-bottom:1px solid #f3f4f6;">${agentName || 'N/A'}</td></tr>
        <tr style="background:#f9fafb;"><td style="padding:8px 16px;font-size:13px;color:#6b7280;">Closed At</td><td style="padding:8px 16px;font-size:13px;color:#111827;">${closedAt ? new Date(closedAt).toLocaleString() : 'N/A'}</td></tr>
      </table>
    `,
    ctaButton: reviewUrl ? { url: reviewUrl, text: 'View Lead Record', color: '#15803d' } : null,
    footerNote: `Admin alert — Deal won on Lead #${leadNumber || ''}`
  }),
  attachments: []
});

/**
 * LEAD_LOST_NOTIFICATION — Sent to admin/team when a lead is marked as Lost
 */
const LEAD_LOST_NOTIFICATION = ({
  leadNumber,
  firstName,
  lastName,
  email,
  company,
  lostReason,
  agentName,
  reviewUrl
}) => ({
  subject: `😔 Lead Lost — #${leadNumber} ${firstName || ''} ${lastName || ''}`,
  html: buildEmailHTML({
    preheader: `Lead #${leadNumber} from ${firstName} ${lastName || ''} has been marked as lost.`,
    title: 'Lead Lost — Admin Notification',
    headerBg: '#6b7280',
    headerText: '😔 Lead Marked as Lost',
    bodyHTML: `
      <p style="margin:0 0 16px 0;color:#4b5563;">
        The following lead has been marked as lost. Review the reason and consider future re-engagement.
      </p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse:collapse;margin:0 0 24px 0;">
        <tr><td style="padding:8px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Reference</td><td style="padding:8px 16px;font-size:13px;font-weight:700;color:#6b7280;border-bottom:1px solid #f3f4f6;">#${leadNumber}</td></tr>
        <tr style="background:#f9fafb;"><td style="padding:8px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Lead</td><td style="padding:8px 16px;font-size:13px;color:#111827;border-bottom:1px solid #f3f4f6;">${firstName || ''} ${lastName || ''}</td></tr>
        <tr><td style="padding:8px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Email</td><td style="padding:8px 16px;font-size:13px;border-bottom:1px solid #f3f4f6;"><a href="mailto:${email}" style="color:#2563eb;">${email || ''}</a></td></tr>
        <tr style="background:#f9fafb;"><td style="padding:8px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Company</td><td style="padding:8px 16px;font-size:13px;color:#111827;border-bottom:1px solid #f3f4f6;">${company || 'N/A'}</td></tr>
        <tr><td style="padding:8px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Closed By</td><td style="padding:8px 16px;font-size:13px;color:#111827;border-bottom:1px solid #f3f4f6;">${agentName || 'N/A'}</td></tr>
        ${
          lostReason
            ? `
        <tr style="background:#f9fafb;"><td style="padding:8px 16px;font-size:13px;color:#6b7280;vertical-align:top;">Lost Reason</td><td style="padding:8px 16px;font-size:13px;color:#111827;font-style:italic;">${lostReason}</td></tr>
        `
            : ''
        }
      </table>
    `,
    ctaButton: reviewUrl ? { url: reviewUrl, text: 'View Lead Record', color: '#6b7280' } : null,
    footerNote: `Admin alert — Lead #${leadNumber || ''} marked lost`
  }),
  attachments: []
});



// =====================================================================================
// 🏪 MARKETPLACE-SPECIFIC EMAIL TEMPLATES
// =====================================================================================

/**
 * MARKETPLACE_WELCOME — Welcome email for Local Service Marketplace
 * Sent when: A new user (provider or customer) joins the marketplace
 * Variables: { name, email, dashboardUrl }
 */
const MARKETPLACE_WELCOME = ({
  name,
  email,
  dashboardUrl = null,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  const resolvedDashboardUrl = dashboardUrl || (ctaPath ? _appUrl + ctaPath : _appUrl);

  return {
    subject: 'Welcome to Local Service Marketplace! 🎉',
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Welcome to Local Service Marketplace! ${isProvider ? 'Start receiving customer requests.' : 'Find local service providers.'}`,
      title: 'Welcome to Local Service Marketplace',
      headerBg: '#667eea',
      headerText: '🎉 Welcome to Local Service Marketplace!',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${name || 'there'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We're excited to have you on board! Your account has been successfully created.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:24px;">
            <strong style="color:#111827;">Get started:</strong><br/>
            ${
              isProvider
                ? `
              ✔️ Complete your provider profile<br/>
              ✔️ Add your services and rates<br/>
              ✔️ Start receiving customer requests
            `
                : `
              ✔️ Browse local service providers<br/>
              ✔️ Post your first service request<br/>
              ✔️ Get competitive proposals from pros
            `
            }
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Need help? Visit our help center or contact support anytime.
        </p>
      `,
      ctaButton: {
        url: dashboardUrl,
        text: 'Go to Dashboard',
        color: '#667eea'
      },
      footerNote: "You're receiving this email because you created an account with us."
    }),
    attachments: []
  };
};

/**
 * MARKETPLACE_EMAIL_VERIFICATION — Email verification for marketplace
 * Sent when: User needs to verify their email address
 * Variables: { name, verificationLink }
 */
const MARKETPLACE_EMAIL_VERIFICATION = ({ name, verificationLink }) => {
  return {
    subject: 'Verify Your Email Address',
    html: buildEmailHTML({
      preheader: 'Please verify your email address to activate your account.',
      title: 'Verify Your Email',
      headerBg: '#10b981',
      headerText: '📧 Verify Your Email',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${name || 'there'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Thank you for signing up! Please verify your email address by clicking the button below.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px 20px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:6px;">
          <tr><td style="font-size:13px;color:#92400e;">
            ⏰ This link will expire in <strong>24 hours</strong>.
          </td></tr>
        </table>
        
        <p style="margin:16px 0 0 0;color:#6b7280;font-size:13px;">
          If you didn't create an account, please ignore this email.
        </p>
      `,
      ctaButton: {
        url: verificationLink,
        text: 'Verify Email Address',
        color: '#10b981'
      },
      footerNote: `If the button doesn't work, copy and paste this link into your browser:<br/><span style="word-break:break-all;color:#667eea;">${verificationLink}</span>`
    }),
    attachments: []
  };
};

/**
 * MARKETPLACE_PASSWORD_RESET — Password reset for marketplace
 * Sent when: User requests to reset their password
 * Variables: { name, resetLink }
 */
const MARKETPLACE_PASSWORD_RESET = ({ name, resetLink }) => {
  return {
    subject: 'Reset Your Password',
    html: buildEmailHTML({
      preheader: 'You requested to reset your password. Click to create a new password.',
      title: 'Reset Your Password',
      headerBg: '#ef4444',
      headerText: '🔐 Reset Your Password',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${name || 'there'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          We received a request to reset your password. Click the button below to create a new password.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:16px 20px;background:#fee2e2;border-left:4px solid #ef4444;border-radius:6px;">
          <tr><td style="font-size:13px;color:#7f1d1d;">
            ⏰ This link will expire in <strong>1 hour</strong>.
          </td></tr>
        </table>
        
        <p style="margin:16px 0 0 0;color:#6b7280;font-size:13px;">
          If you didn't request a password reset, please ignore this email or contact support if you have concerns.
        </p>
      `,
      ctaButton: {
        url: resetLink,
        text: 'Reset Password',
        color: '#ef4444'
      },
      footerNote: `If the button doesn't work, copy and paste this link into your browser:<br/><span style="word-break:break-all;color:#667eea;">${resetLink}</span>`
    }),
    attachments: []
  };
};

/**
 * MARKETPLACE_NEW_REQUEST — Service request notification for providers
 * Sent when: A new service request is posted that matches provider's expertise
 * Variables: { providerName, requestTitle, category, budget, customerName, requestDisplayId, requestUrl }
 */
const MARKETPLACE_NEW_REQUEST = ({
  providerName,
  requestTitle,
  category,
  budget,
  customerName,
  requestDisplayId,
  requestUrl = null,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: 'New Service Request in Your Area! 🔔',
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `New service request: ${requestTitle} - Budget: $${budget}`,
      title: 'New Service Request',
      headerBg: '#667eea',
      headerText: '🔔 New Service Request',
      alert: {
        type: 'warn',
        text: 'Action Required: A new service request matches your expertise!'
      },
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${providerName || 'Provider'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          A new service request has been posted in your area that matches your expertise.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:24px;">
            <strong style="color:#111827;">Request Details:</strong><br/>
            <span style="color:#6b7280;">Title:</span> <strong style="color:#111827;">${requestTitle}</strong><br/>
            <span style="color:#6b7280;">Category:</span> <strong style="color:#111827;">${category}</strong><br/>
            <span style="color:#6b7280;">Budget:</strong> <strong style="color:#10b981;">$${budget}</strong><br/>
            <span style="color:#6b7280;">Customer:</span> <strong style="color:#111827;">${customerName}</strong>
            ${requestDisplayId ? `<br/><span style="color:#6b7280;">Request ID:</span> <code style="background:#e5e7eb;padding:2px 6px;border-radius:3px;font-family:monospace">${requestDisplayId}</code>` : ''}
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Submit your proposal before other providers to increase your chances of winning this job!
        </p>
      `,
      ctaButton: {
        url: requestUrl || _appUrl,
        text: 'View Request & Submit Proposal',
        color: '#667eea'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * MARKETPLACE_PROPOSAL_RECEIVED — Proposal received notification for customers
 * Sent when: Customer receives a new proposal from a provider
 * Variables: { customerName, providerName, requestTitle, price, estimatedDuration, proposalDisplayId, requestDisplayId, proposalUrl }
 */
const MARKETPLACE_PROPOSAL_RECEIVED = ({
  customerName,
  providerName,
  requestTitle,
  price,
  estimatedDuration,
  proposalDisplayId,
  requestDisplayId,
  proposalUrl = null,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: 'New Proposal Received for Your Request 📬',
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `${providerName} sent you a proposal for "${requestTitle}"`,
      title: 'New Proposal Received',
      headerBg: '#10b981',
      headerText: '📬 New Proposal Received!',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${customerName || 'Customer'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Good news! You've received a new proposal for your service request.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f0fdf4;border-left:4px solid #10b981;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:24px;">
            <strong style="color:#065f46;font-size:16px;margin-bottom:8px;display:block;">${requestTitle}</strong>
            <span style="color:#6b7280;">Provider:</span> <strong style="color:#111827;">${providerName}</strong><br/>
            <span style="color:#6b7280;">Price:</span> <strong style="color:#10b981;font-size:18px;">$${price}</strong><br/>
            <span style="color:#6b7280;">Estimated Duration:</span> <strong style="color:#111827;">${estimatedDuration}</strong>
            ${requestDisplayId ? `<br/><span style="color:#6b7280;">Request ID:</span> <code style="background:#dcfce7;padding:2px 6px;border-radius:3px;font-family:monospace">${requestDisplayId}</code>` : ''}
            ${proposalDisplayId ? `<br/><span style="color:#6b7280;">Proposal ID:</span> <code style="background:#dcfce7;padding:2px 6px;border-radius:3px;font-family:monospace">${proposalDisplayId}</code>` : ''}
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Review the proposal details and the provider's profile before making your decision.
        </p>
      `,
      ctaButton: {
        url: proposalUrl,
        text: 'Review Proposal',
        color: '#10b981'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * MARKETPLACE_JOB_ASSIGNED — Job assignment confirmation for providers
 * Sent when: Customer accepts provider's proposal
 * Variables: { providerName, requestTitle, customerName, price, startDate, jobDisplayId, jobUrl }
 */
const MARKETPLACE_JOB_ASSIGNED = ({
  providerName,
  requestTitle,
  customerName,
  price,
  startDate,
  jobDisplayId,
  jobUrl = null,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: 'Congratulations! Your Proposal Was Accepted 🎉',
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `Your proposal for "${requestTitle}" has been accepted!`,
      title: 'Proposal Accepted',
      headerBg: '#8b5cf6',
      headerText: '🎉 Congratulations!',
      bodyHTML: `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 24px 0;padding:30px;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);border-radius:10px;text-align:center;">
          <tr><td>
            <h1 style="color:#fff;margin:0 0 8px 0;font-size:28px;">🎉 Congratulations!</h1>
            <h2 style="color:#f3f4f6;margin:0;font-size:20px;font-weight:400;">Your Proposal Was Accepted</h2>
          </td></tr>
        </table>
        
        <p style="margin:0 0 16px 0;">
          Hello <strong>${providerName || 'Provider'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Great news! Your proposal has been accepted. You can now start working on this project.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;">
          <tr><td style="font-size:14px;line-height:24px;">
            <strong style="color:#111827;">Job Details:</strong><br/>
            <span style="color:#6b7280;">Request:</span> <strong style="color:#111827;">${requestTitle}</strong><br/>
            <span style="color:#6b7280;">Customer:</span> <strong style="color:#111827;">${customerName}</strong><br/>
            <span style="color:#6b7280;">Price:</span> <strong style="color:#10b981;font-size:18px;">$${price}</strong><br/>
            <span style="color:#6b7280;">Start Date:</span> <strong style="color:#111827;">${startDate}</strong>
            ${jobDisplayId ? `<br/><span style="color:#6b7280;">Job ID:</span> <code style="background:#e5e7eb;padding:2px 6px;border-radius:3px;font-family:monospace">${jobDisplayId}</code>` : ''}
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          Log in to view job details and communicate with the customer.
        </p>
      `,
      ctaButton: {
        url: jobUrl || _appUrl,
        text: 'View Job Details',
        color: '#10b981'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * MARKETPLACE_PAYMENT_RECEIVED — Payment confirmation for providers
 * Sent when: Provider receives payment for completed job
 * Variables: { providerName, amount, jobTitle, customerName, paymentDisplayId, dashboardUrl }
 */
const MARKETPLACE_PAYMENT_RECEIVED = ({
  providerName,
  amount,
  jobTitle,
  customerName,
  paymentDisplayId,
  dashboardUrl = null,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => {
  return {
    subject: `Payment Received - $${amount} 💰`,
    html: buildEmailHTML({
      appUrl: _appUrl,
      applicationName: _appName,
      preheader: `You've received a payment of $${amount} for "${jobTitle}"`,
      title: 'Payment Received',
      headerBg: '#10b981',
      headerText: '💰 Payment Received',
      bodyHTML: `
        <p style="margin:0 0 16px 0;">
          Hello <strong>${providerName || 'Provider'}</strong>,
        </p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          Great news! You've received a payment for completing a job.
        </p>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;padding:20px;background:#d1fae5;border-left:4px solid #10b981;border-radius:8px;">
          <tr><td>
            <h3 style="color:#10b981;margin:0 0 16px 0;font-size:32px;font-weight:700;">$${amount}</h3>
            <div style="font-size:14px;line-height:24px;">
              <span style="color:#6b7280;">Job:</span> <strong style="color:#111827;">${jobTitle}</strong><br/>
              <span style="color:#6b7280;">Customer:</span> <strong style="color:#111827;">${customerName}</strong>
              ${paymentDisplayId ? `<br/><span style="color:#6b7280;">Payment ID:</span> <code style="background:#a7f3d0;padding:2px 6px;border-radius:3px;font-family:monospace">${paymentDisplayId}</code>` : ''}
            </div>
          </td></tr>
        </table>
        
        <p style="margin:24px 0 0 0;color:#4b5563;">
          The payment will be transferred to your account according to your payout schedule.
        </p>
      `,
      ctaButton: {
        url: dashboardUrl,
        text: 'View Dashboard',
        color: '#10b981'
      },
      footerNote: null
    }),
    attachments: []
  };
};

/**
 * MARKETPLACE_PROVIDER_APPROVED — Sent when a provider application is approved
 * Variables: { businessName, email, dashboardUrl }
 */
const MARKETPLACE_PROVIDER_APPROVED = ({
  businessName,
  email,
  dashboardUrl = null,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => ({
  subject: '🎉 Congratulations! Your Provider Application is Approved',
  html: buildEmailHTML({
    appUrl: _appUrl,
    applicationName: _appName,
    preheader: `Your provider application for "${businessName}" has been approved. Start receiving customer requests!`,
    title: 'Provider Application Approved',
    headerBg: '#10b981',
    headerText: '✅ Application Approved',
    bodyHTML: `
      <p style="margin:0 0 16px 0;">
        Hello <strong>${businessName || 'Provider'}</strong>,
      </p>
      <p style="margin:0 0 16px 0;color:#4b5563;">
        We're thrilled to let you know that your provider application has been <strong style="color:#10b981;">approved</strong>!
        You are now a verified service provider on Local Service Marketplace.
      </p>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
        style="margin:24px 0;padding:20px;background:#d1fae5;border-left:4px solid #10b981;border-radius:8px;">
        <tr><td style="font-size:14px;line-height:26px;">
          <strong style="color:#065f46;">What's next:</strong><br/>
          ✔️ Complete your provider profile<br/>
          ✔️ Set your availability and service areas<br/>
          ✔️ Browse and respond to customer service requests<br/>
          ✔️ Build your reputation with great reviews
        </td></tr>
      </table>

      <p style="margin:0 0 16px 0;color:#4b5563;">
        Customers in your area can now discover and contact you. Head to your dashboard to get started.
      </p>
    `,
    ctaButton: {
      url: ctaUrl || dashboardUrl,
      text: 'Go to Provider Dashboard',
      color: '#10b981'
    },
    footerNote: "You're receiving this email because your provider application was reviewed."
  }),
  attachments: []
});

/**
 * MARKETPLACE_PROVIDER_REJECTED — Sent when a provider application is rejected
 * Variables: { businessName, email, reason, supportUrl }
 */
const MARKETPLACE_PROVIDER_REJECTED = ({
  businessName,
  email,
  reason,
  supportUrl = `${appUrl}/contact`,
  appUrl: _appUrl = appUrl,
  applicationName: _appName = applicaionName,
  ctaUrl = null,
  ctaPath = null
}) => ({
  subject: 'Update on Your Provider Application',
  html: buildEmailHTML({
    appUrl: _appUrl,
    applicationName: _appName,
    preheader: `We have an update regarding your provider application for "${businessName}".`,
    title: 'Provider Application Update',
    headerBg: '#dc2626',
    headerText: '📋 Application Update',
    bodyHTML: `
      <p style="margin:0 0 16px 0;">
        Hello <strong>${businessName || 'Applicant'}</strong>,
      </p>
      <p style="margin:0 0 16px 0;color:#4b5563;">
        Thank you for applying to become a service provider on Local Service Marketplace.
        After reviewing your application, we are unable to approve it at this time.
      </p>

      ${reason ? `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
        style="margin:24px 0;padding:20px;background:#fef2f2;border-left:4px solid #dc2626;border-radius:8px;">
        <tr><td>
          <strong style="color:#991b1b;font-size:14px;">Reason:</strong>
          <p style="margin:8px 0 0 0;color:#374151;font-size:14px;">${reason}</p>
        </td></tr>
      </table>
      ` : ''}

      <p style="margin:0 0 16px 0;color:#4b5563;">
        If you believe this decision was made in error, or if you would like more information about
        how to reapply in the future, please don't hesitate to contact our support team.
      </p>
      <p style="margin:0;color:#4b5563;">
        We appreciate your interest in joining our platform.
      </p>
    `,
    ctaButton: {
      url: ctaUrl || supportUrl,
      text: 'Contact Support',
      color: '#dc2626'
    },
    footerNote: "You're receiving this email because your provider application was reviewed."
  }),
  attachments: []
});

module.exports = {
  // Marketplace-specific templates
  MARKETPLACE_WELCOME,
  MARKETPLACE_EMAIL_VERIFICATION,
  MARKETPLACE_PASSWORD_RESET,
  MARKETPLACE_NEW_REQUEST,
  MARKETPLACE_PROPOSAL_RECEIVED,
  MARKETPLACE_JOB_ASSIGNED,
  MARKETPLACE_PAYMENT_RECEIVED,
  MARKETPLACE_PROVIDER_APPROVED,
  MARKETPLACE_PROVIDER_REJECTED,

  // New modern templates
  MAGIC_LINK,
  TRIAL_EXPIRING,
  DATA_EXPORT_READY,
  BIRTHDAY_GREETING,
  TEAM_INVITE,
  otpEmailTemplate,
  INQUIRY_NOTIFICATION,
  CONTACT_CONFIRMATION,
  INQUIRY_CONFIRMATION,
  welcomeEmailTemplate,
  EMAIL_VERIFICATION_SEND,
  USER_EMAIL_VERIFIED,
  accountDeletedTemplate,
  subscriptionUpdatedTemplate,
  passwordExpiryReminderTemplate,
  newsletterTemplate,
  USER_CREATED,
  USER_WELCOME,
  ADMIN_USER_REGISTERED,
  USER_UPDATED,
  USER_DELETED,
  USER_SUSPENDED,
  USER_BANNED,
  USER_REINSTATED,
  ROLE_ASSIGNED,
  ROLE_REVOKED,
  CONTACT_REPLY,
  PERMISSION_CHANGED,
  PASSWORD_CHANGED,
  PASSWORD_RESET_REQUESTED,
  PASSWORD_RESET_COMPLETED,
  PASSWORD_EXPIRED,
  PHONE_VERIFIED,
  PROFILE_COMPLETED,
  PROFILE_PICTURE_UPDATED,
  LOGIN_SUCCESS,
  LOGIN_FAILED,
  NEW_DEVICE_LOGIN,
  ACCOUNT_LOCKED,
  ACCOUNT_UNLOCKED,
  ACCOUNT_RECOVERY_REQUESTED,
  ACCOUNT_RECOVERY_COMPLETED,
  CONSENT_REQUIRED,
  CONSENT_REVOKED,
  ACCOUNT_MERGED,
  ACCOUNT_TERMINATED,
  SOCIAL_LOGIN_CONNECTED,
  SOCIAL_LOGIN_DISCONNECTED,
  MFA_ENABLED,
  MFA_DISABLED,
  SESSION_EXPIRED,
  PRIVACY_POLICY_UPDATED,
  TERMS_OF_SERVICE_UPDATED,
  ORG_CREATED,
  ORG_UPDATED,
  ORG_DELETED,
  ORG_PLAN_CHANGED,
  ORG_MEMBER_INVITED,
  ORG_MEMBER_REMOVED,
  ORG_ROLE_ASSIGNED,
  ORG_ROLE_CHANGED,
  ORG_ROLE_REVOKED,
  ORG_SECURITY_POLICY_UPDATED,
  ORG_API_KEY_CREATED,
  ORG_API_KEY_REVOKED,
  ORG_DOMAIN_VERIFIED,
  ORG_DOMAIN_UNVERIFIED,
  ORG_BILLING_UPDATED,
  ORG_COMPLIANCE_AUDIT_COMPLETED,
  PAYMENT_SUCCESS,
  PAYMENT_FAILED,
  PAYMENT_PENDING,
  PAYMENT_REFUNDED,
  INVOICE_GENERATED,
  INVOICE_PAID,
  INVOICE_OVERDUE,
  INVOICE_CANCELLED,
  BILLING_INFO_UPDATED,
  AUTO_RENEWAL_REMINDER,
  SUBSCRIPTION_STARTED,
  SUBSCRIPTION_CANCELLED,
  SUBSCRIPTION_RENEWED,
  CHARGEBACK_INITIATED,
  CHARGEBACK_RESOLVED,
  CART_CREATED,
  CART_UPDATED,
  CART_ABANDONED,
  WISHLIST_CREATED,
  WISHLIST_REMINDER,
  WISHLIST_PRICE_DROP,
  WISHLIST_BACK_IN_STOCK,
  CART_ITEM_PRICE_CHANGED,
  CART_EXPIRY_NOTIFICATION,
  // Order templates
  ORDER_CREATED,
  ORDER_CONFIRMED,
  ORDER_SHIPPED,
  ORDER_DELIVERED,
  ORDER_DELAYED,
  ORDER_CANCELLED,
  ORDER_RETURNED,
  ORDER_REFUNDED,
  ORDER_PAYMENT_PENDING,
  ORDER_PAYMENT_FAILED,
  ORDER_PARTIALLY_SHIPPED,
  CUSTOM_ORDER_CONFIRMED,
  ORDER_REVIEWED,

  // Return & Exchange templates
  RETURN_REQUEST_RECEIVED,
  RETURN_APPROVED,
  RETURN_REJECTED,
  RETURN_COMPLETED,
  EXCHANGE_REQUESTED,
  EXCHANGE_APPROVED,
  EXCHANGE_REJECTED,

  // System & Infrastructure templates
  SYSTEM_ALERT,
  MAINTENANCE_SCHEDULED,
  MAINTENANCE_STARTED,
  MAINTENANCE_COMPLETED,
  DATA_BACKUP_COMPLETED,
  SERVER_RESTARTED,
  SERVER_OVERLOADED,
  DEPLOYMENT_STARTED,
  DEPLOYMENT_COMPLETED,
  DEPLOYMENT_FAILED,
  CONFIGURATION_CHANGED,
  SERVICE_OUTAGE_DETECTED,
  SERVICE_RECOVERED,
  NEW_FEATURE_RELEASED,

  // Shipping & Logistics
  PACKAGE_DISPATCHED,
  PACKAGE_IN_TRANSIT,
  PACKAGE_OUT_FOR_DELIVERY,
  PACKAGE_DELIVERED,
  PACKAGE_DELAYED,
  PACKAGE_LOST,
  DELIVERY_EXCEPTION,
  CUSTOMS_HOLD,

  // Marketing & Promotions
  PROMOTION_LAUNCHED,
  DISCOUNT_APPLIED,
  FLASH_SALE_ANNOUNCEMENT,
  LOYALTY_POINTS_EARNED,
  LOYALTY_POINTS_REDEEMED,
  NEW_PRODUCT_LAUNCH,
  CUSTOMER_MILESTONE,
  REVIEW_REMINDER,
  EVENT_INVITATION,
  HOLIDAY_GREETINGS,

  // Product Management
  PRODUCT_CREATED,
  PRODUCT_UPDATED,
  PRODUCT_DELETED,
  PRODUCT_FEATURED,
  PRODUCT_BACK_IN_STOCK,
  PRODUCT_REVIEWED,
  PRODUCT_OUT_OF_STOCK,
  PRODUCT_ARCHIVED,

  // Inventory Management
  STOCK_LOW,
  STOCK_CRITICAL,
  STOCK_REPLENISHED,
  INVENTORY_AUDIT_COMPLETED,
  SUPPLIER_DELAY,
  BATCH_EXPIRING_SOON,
  WAREHOUSE_TRANSFER_INITIATED,

  // Communication templates
  MESSAGE_SENT,
  MESSAGE_RECEIVED,
  MESSAGE_READ,
  MENTION_RECEIVED,
  COMMENT_POSTED,
  COMMENT_REPLIED,
  EMAIL_DELIVERED,
  EMAIL_FAILED,
  PUSH_NOTIFICATION_SENT,
  CHAT_STARTED,
  CHAT_ENDED,
  // Analytics & Insights templates
  DAILY_REPORT_READY,
  WEEKLY_REPORT_READY,
  MONTHLY_REPORT_READY,
  DATA_TREND_ALERT,
  TRAFFIC_SPIKE,
  CONVERSION_RATE_DROP,
  ENGAGEMENT_INCREASED,
  KPI_THRESHOLD_BREACHED,

  giftCardReceivedTemplate,
  loyaltyPointsEarnedTemplate,
  dataExportRequestTemplate,
  trialExpiredTemplate,
  newFeatureAnnouncementTemplate,
  backupCodesTemplate,
  emailChangedTemplate,
  loginAlertTemplate,
  accountReactivationTemplate,
  accountSuspendedTemplate,
  consentRequiredTemplate,
  securitySettingsUpdatedTemplate,
  failedLoginAttemptsTemplate,
  logoutAllDevicesTemplate,
  trustedDeviceAddedTemplate,
  phoneVerificationTemplate,
  emailPhoneVerificationReminderTemplate,
  phoneNumberChangeRequestTemplate,
  phoneNumberChangeConfirmationTemplate,
  loginAttemptLimitExceededTemplate,
  twoFactorEnabledDisabledNotificationTemplate,
  accountVerificationReminderTemplate,
  backupEmailAddedRemovedTemplate,
  trustedDeviceManagementUpdateTemplate,
  multiFactorAuthenticationSetupReminderTemplate,
  secondaryPhoneVerificationTemplate,
  identityVerificationRequestTemplate,
  identityVerificationResultTemplate,
  accountAccessRevokedTemplate,
  passwordStrengthWarningTemplate,
  accountMergeConfirmationTemplate,
  socialLoginConnectionTemplate,
  wishlistReminderTemplate,
  wishlistBackInStockTemplate,
  wishlistPriceDropAlertTemplate,
  savedForLaterReminderTemplate,
  cartItemPriceChangedTemplate,
  wishlistItemDiscontinuedTemplate,
  cartExpiryNotificationTemplate,
  orderProcessingTemplate,
  orderPackedTemplate,
  orderOutForDeliveryTemplate,
  partialOrderShippedTemplate,
  orderSplitShipmentTemplate,
  deliveryDelayedNotificationTemplate,
  orderCanceledByCustomerTemplate,
  orderCanceledByStoreTemplate,
  preOrderConfirmationTemplate,
  preOrderShippedTemplate,
  digitalDownloadReadyTemplate,
  customOrderConfirmedTemplate,
  orderModificationRequestReceivedTemplate,
  orderModificationResultTemplate,
  returnRequestReceivedTemplate,
  returnApprovedTemplate,
  returnRejectedTemplate,
  refundProcessedTemplate,
  exchangeApprovedTemplate,
  exchangeRejectedTemplate,
  returnShipmentReceivedTemplate,
  partialRefundProcessedTemplate,
  paymentSuccessfulTemplate,
  paymentMethodExpiringSoonTemplate,
  CONTACT_NOTIFICATION,
  subscriptionStartedTemplate,
  subscriptionRenewedSuccessfullyTemplate,
  subscriptionFailedRetryNeededTemplate,
  subscriptionCanceledTemplate,
  creditNoteIssuedTemplate,
  giftCardPurchasedTemplate,
  giftCardRedeemedTemplate,
  storeCreditAddedTemplate,
  storeCreditUsedTemplate,
  emiPaymentReminderTemplate,
  paymentDisputeNotificationTemplate,
  paymentDisputeResolvedTemplate,
  paymentMethodUpdatedTemplate,
  subscriptionPauseConfirmationTemplate,
  onboardingSeriesTemplate,
  customerMilestoneTemplate,
  loyaltyPointsRedeemedTemplate,
  loyaltyPointsExpiryReminderTemplate,
  referralInvitationTemplate,
  referralBonusEarnedTemplate,
  referralBonusUsedTemplate,
  seasonalSaleAnnouncementTemplate,
  flashSaleTemplate,
  earlyAccessToSaleTemplate,
  sneakPeekTemplate,
  exclusiveEventTemplate,
  surveyRequestTemplate,
  holidayGreetingsTemplate,
  csrStoriesTemplate,
  appDownloadInvitationTemplate,
  abandonedBrowseReminderTemplate,
  loyaltyTierChangeTemplate,
  otpForLoginTemplate,
  failedLoginAttemptWarningTemplate,
  systemMaintenanceNotificationTemplate,
  scheduledDowntimeNotificationTemplate,
  fraudulentTransactionAlertTemplate,
  sessionTimeoutNotificationTemplate,
  fraudulentActivityDetectedAdminTemplate,
  accountSecurityCheckReminderTemplate,
  newOrderPlacedAdminTemplate,
  highValueOrderAlertAdminTemplate,
  lowStockAlertAdminTemplate,
  outOfStockNotificationAdminTemplate,
  productDisabledAdminTemplate,
  newReviewSubmittedAdminTemplate,
  paymentDisputeAlertAdminTemplate,
  returnRequestNotificationAdminTemplate,
  refundProcessedNotificationAdminTemplate,
  dailySalesReportAdminTemplate,
  weeklyMonthlySalesReportAdminTemplate,
  systemErrorFailedJobAlertAdminTemplate,
  customerSupportTicketCreatedAdminTemplate,
  inventoryRestockNotificationAdminTemplate,
  bulkOrderRequestAdminTemplate,
  customerDataDeletionRequestAdminTemplate,
  suspiciousAccountActivityAlertAdminTemplate,
  multipleFailedLoginAttemptsAdminTemplate,
  accountSuspensionReinstatementNotificationAdminTemplate,
  userProfileUpdateAlertAdminTemplate,
  twoFactorStatusChangeAlertAdminTemplate,
  accountDeletionRequestDeniedAdminTemplate,
  unusualAccountLoginPatternAdminTemplate,
  phoneVerificationStatusUpdateAdminTemplate,
  emailVerificationFailureAlertAdminTemplate,
  secondaryPhoneVerificationStatusUpdateAdminTemplate,
  identityVerificationRequestReceivedAdminTemplate,
  identityVerificationOutcomeNotificationAdminTemplate,
  accountAccessRevocationAdminTemplate,
  socialLoginConnectionAlertAdminTemplate,
  accountMergeRequestReceivedAdminTemplate,
  highRiskAccountActivityAlertAdminTemplate,
  accountRecoveryRequestReceivedAdminTemplate,
  twoFactorCompletedTemplate,
  NEWSLETTER_WELCOME,
  PROJECT_PROPOSAL_EMAIL,

  // Lead & Contact Microservice templates
  LEAD_RECEIVED,
  LEAD_ADMIN_NOTIFICATION,
  LEAD_CONTACT_REPLY,
  LEAD_STATUS_CHANGED,
  LEAD_FOLLOW_UP_REMINDER,

  // Lead proposal lifecycle templates
  LEAD_PROPOSAL_ACCEPTED,
  LEAD_ADMIN_PROPOSAL_ACCEPTED,
  LEAD_PROPOSAL_DECLINED_ACK,
  LEAD_ADMIN_PROPOSAL_DECLINED,
  LEAD_PROPOSAL_EXPIRING,
  LEAD_PROPOSAL_EXPIRED,
  LEAD_CONTRACT_SENT,
  LEAD_CONTRACT_SIGNED,
  LEAD_WON_NOTIFICATION,
  LEAD_LOST_NOTIFICATION
};
