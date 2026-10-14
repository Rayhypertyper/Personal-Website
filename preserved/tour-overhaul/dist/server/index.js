const CONTACT_RECIPIENT = "your.email@example.com";
const CONTACT_SENDER = "onboarding@resend.dev";
const RESEND_ENDPOINT = "https://api.resend.com/emails";

const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
    },
  });

const escapeHtml = (value) =>
  value.replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });

const handleContactRequest = async (request, env) => {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  const apiKey = env.RESEND_API_KEY?.trim();
  if (
    !apiKey ||
    apiKey === "re_xxxxxxxxx" ||
    CONTACT_RECIPIENT === "your.email@example.com"
  ) {
    return jsonResponse({ error: "Contact delivery is not configured." }, 503);
  }

  let input;
  try {
    input = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid request body." }, 400);
  }

  const name = typeof input?.name === "string" ? input.name.trim() : "";
  const email = typeof input?.email === "string" ? input.email.trim() : "";
  const message =
    typeof input?.message === "string" ? input.message.trim() : "";

  if (
    name.length < 2 ||
    name.length > 120 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    email.length > 320 ||
    message.length > 5000
  ) {
    return jsonResponse({ error: "Please check the form fields." }, 400);
  }

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message).replace(/\r?\n/g, "<br />");

  try {
    const resendResponse = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: CONTACT_SENDER,
        to: CONTACT_RECIPIENT,
        reply_to: email,
        subject: "Portfolio message from " + name,
        html:
          '<p><strong>Name:</strong> ' +
          safeName +
          '</p><p><strong>Email:</strong> <a href="mailto:' +
          safeEmail +
          '">' +
          safeEmail +
          '</a></p><p><strong>Message:</strong></p><p>' +
          safeMessage +
          '</p>',
      }),
    });

    if (!resendResponse.ok) {
      console.error("Resend request failed with status", resendResponse.status);
      return jsonResponse({ error: "Email delivery failed." }, 502);
    }
  } catch (error) {
    console.error("Resend request could not be completed", error);
    return jsonResponse({ error: "Email delivery failed." }, 502);
  }

  return jsonResponse({ ok: true });
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/contact") {
      return handleContactRequest(request, env);
    }

    const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
    const assetResponse = await env.ASSETS.fetch(
      new Request(new URL(pathname, request.url), request),
    );

    if (pathname !== "/index.html" || request.method === "HEAD") {
      return assetResponse;
    }

    return new Response(
      (await assetResponse.text()).replaceAll("__SITE_ORIGIN__", url.origin),
      {
        status: assetResponse.status,
        statusText: assetResponse.statusText,
        headers: assetResponse.headers,
      },
    );
  },
};
