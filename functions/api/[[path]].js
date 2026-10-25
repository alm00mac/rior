export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api/, '');

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  try {
    // LOGIN
    if (request.method === 'POST' && path === '/login') {
      const { username, password } = await request.json();
      const user = await env.DB.prepare('SELECT id, username, role FROM users WHERE username = ? AND password = ?')
        .bind(username, password)
        .first();
      if (user) {
        return new Response(JSON.stringify({ success: true, user }), { headers });
      } else {
        return new Response(JSON.stringify({ success: false, message: 'Kredencialet janë të pasakta' }), { status: 401, headers });
      }
    }

    // MATERIALS
    if (request.method === 'GET' && path === '/materials') {
      const { results } = await env.DB.prepare('SELECT * FROM materials ORDER BY id DESC').all();
      return new Response(JSON.stringify(results), { headers });
    }
    if (request.method === 'POST' && path === '/materials') {
      const body = await request.json();
      if (body.id) {
        await env.DB.prepare('UPDATE materials SET name=?, category=?, unit=?, price=? WHERE id=?')
          .bind(body.name, body.category, body.unit, body.price, body.id).run();
      } else {
        await env.DB.prepare('INSERT INTO materials (name, category, unit, price) VALUES (?, ?, ?, ?)')
          .bind(body.name, body.category, body.unit, body.price).run();
      }
      return new Response(JSON.stringify({ success: true }), { headers });
    }
    if (request.method === 'DELETE' && path === '/materials') {
      const id = url.searchParams.get('id');
      await env.DB.prepare('DELETE FROM materials WHERE id = ?').bind(id).run();
      return new Response(JSON.stringify({ success: true }), { headers });
    }

    // CATEGORIES
    if (request.method === 'GET' && path === '/categories') {
      const { results } = await env.DB.prepare('SELECT * FROM categories ORDER BY id ASC').all();
      return new Response(JSON.stringify(results), { headers });
    }
    if (request.method === 'POST' && path === '/categories') {
      const { name } = await request.json();
      await env.DB.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)').bind(name).run();
      return new Response(JSON.stringify({ success: true }), { headers });
    }
    if (request.method === 'DELETE' && path === '/categories') {
      const id = url.searchParams.get('id');
      await env.DB.prepare('DELETE FROM categories WHERE id = ?').bind(id).run();
      return new Response(JSON.stringify({ success: true }), { headers });
    }

    // UNITS
    if (request.method === 'GET' && path === '/units') {
      const { results } = await env.DB.prepare('SELECT * FROM units ORDER BY id ASC').all();
      return new Response(JSON.stringify(results), { headers });
    }
    if (request.method === 'POST' && path === '/units') {
      const { name } = await request.json();
      await env.DB.prepare('INSERT OR IGNORE INTO units (name) VALUES (?)').bind(name).run();
      return new Response(JSON.stringify({ success: true }), { headers });
    }
    if (request.method === 'DELETE' && path === '/units') {
      const id = url.searchParams.get('id');
      await env.DB.prepare('DELETE FROM units WHERE id = ?').bind(id).run();
      return new Response(JSON.stringify({ success: true }), { headers });
    }

    // CLIENTS
    if (request.method === 'GET' && path === '/clients') {
      const { results } = await env.DB.prepare('SELECT * FROM clients ORDER BY id DESC').all();
      return new Response(JSON.stringify(results), { headers });
    }
    if (request.method === 'POST' && path === '/clients') {
      const body = await request.json();
      const fullName = (body.first_name + ' ' + body.last_name).trim() || body.name || '';
      if (body.id) {
        await env.DB.prepare('UPDATE clients SET first_name=?, last_name=?, name=?, phone=?, email=?, address=? WHERE id=?')
          .bind(body.first_name || '', body.last_name || '', fullName, body.phone || '', body.email || '', body.address || '', body.id).run();
      } else {
        await env.DB.prepare('INSERT INTO clients (first_name, last_name, name, phone, email, address) VALUES (?, ?, ?, ?, ?, ?)')
          .bind(body.first_name || '', body.last_name || '', fullName, body.phone || '', body.email || '', body.address || '').run();
      }
      return new Response(JSON.stringify({ success: true }), { headers });
    }
    if (request.method === 'DELETE' && path === '/clients') {
      const id = url.searchParams.get('id');
      await env.DB.prepare('DELETE FROM clients WHERE id = ?').bind(id).run();
      return new Response(JSON.stringify({ success: true }), { headers });
    }

    // OFFERS
    if (request.method === 'GET' && path === '/offers') {
      const { results } = await env.DB.prepare('SELECT * FROM offers ORDER BY id DESC').all();
      return new Response(JSON.stringify(results), { headers });
    }
    if (request.method === 'POST' && path === '/offers') {
      const body = await request.json();
      await env.DB.prepare('INSERT INTO offers (client_id, client_name, client_phone, client_email, items_json, total_price, discount_percent, final_price, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(body.client_id || null, body.client_name, body.client_phone || '', body.client_email || '', JSON.stringify(body.items), body.total_price, body.discount_percent, body.final_price, body.status || 'Në Pritje').run();
      return new Response(JSON.stringify({ success: true }), { headers });
    }
    if (request.method === 'PUT' && path === '/offers') {
      const { id, status } = await request.json();
      await env.DB.prepare('UPDATE offers SET status=? WHERE id=?').bind(status, id).run();
      return new Response(JSON.stringify({ success: true }), { headers });
    }
    if (request.method === 'DELETE' && path === '/offers') {
      const id = url.searchParams.get('id');
      await env.DB.prepare('DELETE FROM offers WHERE id = ?').bind(id).run();
      return new Response(JSON.stringify({ success: true }), { headers });
    }

    // USERS MANAGEMENT
    if (request.method === 'GET' && path === '/users') {
      const { results } = await env.DB.prepare('SELECT id, username, role, created_at FROM users ORDER BY id ASC').all();
      return new Response(JSON.stringify(results), { headers });
    }
    if (request.method === 'POST' && path === '/users') {
      const { username, password, role } = await request.json();
      await env.DB.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)')
        .bind(username, password, role || 'Punonjës').run();
      return new Response(JSON.stringify({ success: true }), { headers });
    }
    if (request.method === 'PUT' && path === '/users/password') {
      const { id, password } = await request.json();
      await env.DB.prepare('UPDATE users SET password=? WHERE id=?').bind(password, id).run();
      return new Response(JSON.stringify({ success: true }), { headers });
    }
    if (request.method === 'DELETE' && path === '/users') {
      const id = url.searchParams.get('id');
      await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run();
      return new Response(JSON.stringify({ success: true }), { headers });
    }

    // SITE SETTINGS
    if (request.method === 'GET' && path === '/settings') {
      const { results } = await env.DB.prepare('SELECT * FROM site_settings').all();
      const settingsMap = {};
      results.forEach(r => { settingsMap[r.key] = r.value; });
      return new Response(JSON.stringify(settingsMap), { headers });
    }
    if (request.method === 'POST' && path === '/settings') {
      const body = await request.json();
      for (const [key, value] of Object.entries(body)) {
        await env.DB.prepare('INSERT INTO site_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value')
          .bind(key, value).run();
      }
      return new Response(JSON.stringify({ success: true }), { headers });
    }

    return new Response(JSON.stringify({ error: 'Rruga nuk u gjet' }), { status: 404, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}
