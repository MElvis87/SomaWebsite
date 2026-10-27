const encoder = new TextEncoder();
const decoder = new TextDecoder();

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=UTF-8", ...headers }
  });
}

function base64Url(bytes) {
  let text = "";
  for (const byte of bytes) text += String.fromCharCode(byte);
  return btoa(text).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

function cleanName(value) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, 48);
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function passwordHash(password, salt) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: fromBase64Url(salt), iterations: 100000 },
    key,
    256
  );

  return base64Url(new Uint8Array(bits));
}

function equalValues(left, right) {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return result === 0;
}

async function signingKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function createToken(userId, secret, remember) {
  const payload = {
    sub: userId,
    exp: Math.floor(Date.now() / 1000) + (remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24)
  };

  const encodedPayload = base64Url(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign(
    "HMAC",
    await signingKey(secret),
    encoder.encode(encodedPayload)
  );

  return `${encodedPayload}.${base64Url(new Uint8Array(signature))}`;
}

async function readToken(token, secret) {
  if (!token || !token.includes(".")) return null;
  const [encodedPayload, encodedSignature] = token.split(".");
  const valid = await crypto.subtle.verify(
    "HMAC",
    await signingKey(secret),
    fromBase64Url(encodedSignature),
    encoder.encode(encodedPayload)
  );

  if (!valid) return null;

  try {
    const payload = JSON.parse(decoder.decode(fromBase64Url(encodedPayload)));
    return payload.exp > Math.floor(Date.now() / 1000) ? payload : null;
  } catch {
    return null;
  }
}

function cookieValue(request, name) {
  const match = (request.headers.get("cookie") || "")
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.slice(name.length + 1)) : "";
}

function sessionCookie(token, remember) {
  const maxAge = remember ? "; Max-Age=2592000" : "";
  return `SomaSession=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Lax; Path=/${maxAge}`;
}

function clearSessionCookie() {
  return "SomaSession=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0";
}

function publicUser(row) {
  if (!row) return null;

  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    role: row.role,
    status: row.status,
    settings: {
      displayName: row.display_name,
      themeColor: row.theme_color,
      avatar: row.avatar_url
    }
  };
}

async function currentUser(request, env) {
  const bearer = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const token = bearer || cookieValue(request, "SomaSession");
  const payload = await readToken(token, env.SESSION_SECRET);

  if (!payload) return null;

  const row = await env.DB.prepare(`
    SELECT id, first_name, last_name, email, role, status,
           display_name, theme_color, avatar_url
    FROM users WHERE id = ? AND status = 'active'
  `).bind(payload.sub).first();

  return publicUser(row);
}

async function body(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export async function onRequest(context) {
  const { request, env } = context;
  const path = (context.params.path || []).join("/");
  const method = request.method.toUpperCase();

  if (!env.DB || !env.SESSION_SECRET) {
    return json({ error: "Server configuration is incomplete." }, 500);
  }

  if (method === "OPTIONS") return new Response(null, { status: 204 });

  try {
    if (path === "health" && method === "GET") {
      await env.DB.prepare("SELECT 1").first();
      return json({ ok: true, database: "d1" });
    }

    if (path === "auth/register" && method === "POST") {
      const input = await body(request);
      const firstName = cleanName(input.firstName);
      const lastName = cleanName(input.lastName);
      const email = String(input.email || "").trim().toLowerCase();
      const password = String(input.password || "");

      if (!firstName || !lastName || !validEmail(email) || password.length < 8) {
        return json({ error: "Enter your name, a valid email, and a password of at least 8 characters." }, 400);
      }

      const exists = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
      if (exists) return json({ error: "An account with this email already exists." }, 409);

      const salt = base64Url(crypto.getRandomValues(new Uint8Array(16)));
      const now = new Date().toISOString();
      const id = crypto.randomUUID();
      const displayName = `${firstName} ${lastName}`;

      await env.DB.prepare(`
        INSERT INTO users (
          id, first_name, last_name, email, password_hash, password_salt,
          role, status, display_name, theme_color, avatar_url, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'premium', 'active', ?, '#0a2463', '', ?, ?)
      `).bind(
        id, firstName, lastName, email, await passwordHash(password, salt),
        salt, displayName, now, now
      ).run();

      const token = await createToken(id, env.SESSION_SECRET, true);
      return json({
        token,
        user: {
          id, firstName, lastName, email, role: "premium", status: "active",
          settings: { displayName, themeColor: "#0a2463", avatar: "" }
        }
      }, 201, { "set-cookie": sessionCookie(token, true) });
    }

    if (path === "auth/login" && method === "POST") {
      const input = await body(request);
      const email = String(input.email || "").trim().toLowerCase();
      const password = String(input.password || "");
      const remember = Boolean(input.remember);

      const row = await env.DB.prepare(`
        SELECT * FROM users WHERE email = ? AND status = 'active'
      `).bind(email).first();

      if (!row || !equalValues(await passwordHash(password, row.password_salt), row.password_hash)) {
        return json({ error: "Incorrect email or password." }, 401);
      }

      const token = await createToken(row.id, env.SESSION_SECRET, remember);
      return json({ token, user: publicUser(row) }, 200, {
        "set-cookie": sessionCookie(token, remember)
      });
    }

    if (path === "auth/me" && method === "GET") {
      return json({ user: await currentUser(request, env) });
    }

    if (path === "auth/logout" && method === "POST") {
      return json({ ok: true }, 200, { "set-cookie": clearSessionCookie() });
    }

    const user = await currentUser(request, env);
    if (!user) return json({ error: "Please sign in to continue." }, 401);

    if (path === "account/avatar" && method === "POST") {
  const form = await request.formData();
  const file = form.get("avatar");
  const allowed = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp"
  };

  if (!file || typeof file === "string" || !allowed[file.type]) {
    return json({ error: "Choose a PNG, JPEG, GIF, or WebP image." }, 400);
  }

  if (file.size > 2_000_000) {
    return json({ error: "Profile images must be 2 MB or smaller." }, 400);
  }

  const key = `avatars/${user.id}/${crypto.randomUUID()}.${allowed[file.type]}`;
  await env.AVATARS.put(key, await file.arrayBuffer(), {
    httpMetadata: {
      contentType: file.type,
      cacheControl: "public, max-age=31536000, immutable"
    }
  });

  const base = `${env.ASSET_BASE.replace(/\/$/, "")}/`;
  const avatar = `${base}${key}`;
  const oldAvatar = user.settings.avatar || "";

  await env.DB.prepare(`
    UPDATE users SET avatar_url = ?, updated_at = ? WHERE id = ?
  `).bind(avatar, new Date().toISOString(), user.id).run();

  if (oldAvatar.startsWith(base)) {
    await env.AVATARS.delete(oldAvatar.slice(base.length));
  }

  return json({ user: await currentUser(request, env) });
}

    if (path === "account/settings" && method === "PATCH") {
      const input = await body(request);
      const settings = input.settings || input;
      const updates = [];
      const values = [];

      if (typeof settings.displayName === "string" && cleanName(settings.displayName)) {
        updates.push("display_name = ?");
        values.push(cleanName(settings.displayName));
      }

      if (/^#[0-9a-f]{6}$/i.test(String(settings.themeColor || ""))) {
        updates.push("theme_color = ?");
        values.push(settings.themeColor);
      }

      const avatar = String(settings.avatar || "").trim();
     if (!avatar || /^https?:\/\//i.test(avatar)) {
     if ("avatar" in settings) {
    updates.push("avatar_url = ?");
    values.push(avatar);
      }
    }

      if (!updates.length) return json({ error: "No valid settings were supplied." }, 400);

      values.push(new Date().toISOString(), user.id);
      await env.DB.prepare(`
        UPDATE users SET ${updates.join(", ")}, updated_at = ? WHERE id = ?
      `).bind(...values).run();

      return json({ user: await currentUser(request, env) });
    }

    if (path === "account/deactivate" && method === "POST") {
      await env.DB.prepare(`
        UPDATE users SET status = 'inactive', updated_at = ? WHERE id = ?
      `).bind(new Date().toISOString(), user.id).run();

      return json({ ok: true }, 200, { "set-cookie": clearSessionCookie() });
    }

    return json({ error: "API route not found." }, 404);
  } catch (error) {
    console.error("Soma API error", error);
    return json({ error: "The account service is temporarily unavailable." }, 500);
  }
}