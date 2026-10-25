export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/?/, '');
  const method = request.method;

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  try {
    // POST /api/login (AUTHENTICATION)
    if (path === 'login' && method === 'POST') {
      const body = await request.json();
      const user = await env.DB.prepare("SELECT * FROM users WHERE username = ? AND password = ?").bind(body.username, body.password).first();
      if (user) {
        return new Response(JSON.stringify({ success: true, username: user.username, role: user.role }), { headers });
      } else {
        return new Response(JSON.stringify({ error: "Përdoruesi ose fjalëkalimi i pasaktë" }), { status: 401, headers });
      }
    }

    // GET & POST /api/categories (CATEGORY CONTROL)
    if (path === 'categories') {
      if (method === 'GET') {
        const { results } = await env.DB.prepare("SELECT * FROM categories ORDER BY id ASC").all();
        return new Response(JSON.stringify(results), { headers });
      }
      if (method === 'POST') {
        const body = await request.json();
        await env.DB.prepare("INSERT INTO categories (name, image) VALUES (?, ?)").bind(body.name, body.image || null).run();
        return new Response(JSON.stringify({ success: true }), { headers });
      }
    }

    // PUT & DELETE /api/categories/:id
    if (path.startsWith('categories/')) {
      const id = path.split('/')[1];
      if (method === 'PUT') {
        const body = await request.json();
        await env.DB.prepare("UPDATE categories SET name = ?, image = ? WHERE id = ?").bind(body.name, body.image || null, id).run();
        return new Response(JSON.stringify({ success: true }), { headers });
      }
      if (method === 'DELETE') {
        await env.DB.prepare("DELETE FROM categories WHERE id = ?").bind(id).run();
        return new Response(JSON.stringify({ success: true }), { headers });
      }
    }

    // GET & POST /api/materials (ADD NEW MATERIAL & LIST)
    if (path === 'materials') {
      if (method === 'GET') {
        const { results } = await env.DB.prepare("SELECT * FROM materials ORDER BY category, id").all();
        return new Response(JSON.stringify(results), { headers });
      }
      if (method === 'POST') {
        const body = await request.json();
        await env.DB.prepare(
          "INSERT INTO materials (name, category, unit, price, image) VALUES (?, ?, ?, ?, ?)"
        ).bind(body.name, body.category, body.unit, body.price, body.image || null).run();
        return new Response(JSON.stringify({ success: true }), { headers });
      }
    }

    // PUT & DELETE /api/materials/:id
    if (path.startsWith('materials/')) {
      const id = path.split('/')[1];
      if (method === 'PUT') {
        const body = await request.json();
        await env.DB.prepare("UPDATE materials SET name = ?, price = ?, image = ? WHERE id = ?").bind(body.name, body.price, body.image || null, id).run();
        return new Response(JSON.stringify({ success: true }), { headers });
      }
      if (method === 'DELETE') {
        await env.DB.prepare("DELETE FROM materials WHERE id = ?").bind(id).run();
        return new Response(JSON.stringify({ success: true }), { headers });
      }
    }

    // GET & POST /api/users (ADMIN USER CONTROL)
    if (path === 'users') {
      if (method === 'GET') {
        const { results } = await env.DB.prepare("SELECT id, username, role, created_at FROM users ORDER BY id ASC").all();
        return new Response(JSON.stringify(results), { headers });
      }
      if (method === 'POST') {
        const body = await request.json();
        await env.DB.prepare(
          "INSERT INTO users (username, password, role) VALUES (?, ?, ?)"
        ).bind(body.username, body.password, body.role || 'staf').run();
        return new Response(JSON.stringify({ success: true }), { headers });
      }
    }

    // PUT /api/users/:id (UPDATE PASSWORD OR ROLE)
    if (path.startsWith('users/') && method === 'PUT') {
      const id = path.split('/')[1];
      const body = await request.json();
      if (body.password) {
        await env.DB.prepare("UPDATE users SET password = ? WHERE id = ?").bind(body.password, id).run();
      }
      if (body.role) {
        await env.DB.prepare("UPDATE users SET role = ? WHERE id = ?").bind(body.role, id).run();
      }
      return new Response(JSON.stringify({ success: true }), { headers });
    }

    // GET & POST /api/offers
    if (path === 'offers') {
      if (method === 'GET') {
        const { results } = await env.DB.prepare("SELECT * FROM offers ORDER BY id DESC").all();
        return new Response(JSON.stringify(results), { headers });
      }
      if (method === 'POST') {
        const body = await request.json();
        
        if (body.client_name) {
          await env.DB.prepare(
            "INSERT OR IGNORE INTO clients (name, phone, email, address) VALUES (?, ?, ?, ?)"
          ).bind(body.client_name, body.client_phone || null, body.client_email || null, body.client_address || null).run();
        }

        const res = await env.DB.prepare(
          `INSERT INTO offers (client_name, client_phone, client_email, client_address, items_json, total_price, discount_percent, final_price, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          body.client_name,
          body.client_phone || null,
          body.client_email || null,
          body.client_address || null,
          body.items_json,
          body.total_price,
          body.discount_percent || 0,
          body.final_price,
          body.status || 'Në Pritje'
        ).run();

        return new Response(JSON.stringify({ success: true, id: res.meta.last_row_id }), { headers });
      }
    }

    // PUT /api/offers/:id (Full Update Offer)
    if (path.startsWith('offers/') && method === 'PUT') {
      const id = path.split('/')[1];
      const body = await request.json();

      if (body.client_name) {
        await env.DB.prepare(
          "INSERT OR IGNORE INTO clients (name, phone, email, address) VALUES (?, ?, ?, ?)"
        ).bind(body.client_name, body.client_phone || null, body.client_email || null, body.client_address || null).run();
      }

      await env.DB.prepare(
        `UPDATE offers SET client_name = ?, client_phone = ?, client_email = ?, client_address = ?, items_json = ?, total_price = ?, discount_percent = ?, final_price = ?, status = ? WHERE id = ?`
      ).bind(
        body.client_name,
        body.client_phone || null,
        body.client_email || null,
        body.client_address || null,
        body.items_json,
        body.total_price,
        body.discount_percent || 0,
        body.final_price,
        body.status || 'Në Pritje',
        id
      ).run();

      return new Response(JSON.stringify({ success: true }), { headers });
    }

    // DELETE /api/offers/:id
    if (path.startsWith('offers/') && method === 'DELETE') {
      const id = path.split('/')[1];
      await env.DB.prepare("DELETE FROM offers WHERE id = ?").bind(id).run();
      return new Response(JSON.stringify({ success: true }), { headers });
    }

    // GET /api/clients
    if (path === 'clients' && method === 'GET') {
      const { results } = await env.DB.prepare("SELECT * FROM clients ORDER BY id DESC").all();
      return new Response(JSON.stringify(results), { headers });
    }

    // POST /api/clients
    if (path === 'clients' && method === 'POST') {
      const body = await request.json();
      await env.DB.prepare(
        "INSERT INTO clients (name, phone, email, address) VALUES (?, ?, ?, ?)"
      ).bind(body.name, body.phone || null, body.email || null, body.address || null).run();
      return new Response(JSON.stringify({ success: true }), { headers });
    }

    // PUT & DELETE /api/clients/:id
    if (path.startsWith('clients/')) {
      const id = path.split('/')[1];
      if (method === 'PUT') {
        const body = await request.json();
        await env.DB.prepare("UPDATE clients SET name = ?, phone = ?, email = ?, address = ? WHERE id = ?").bind(body.name, body.phone || null, body.email || null, body.address || null, id).run();
        return new Response(JSON.stringify({ success: true }), { headers });
      }
      if (method === 'DELETE') {
        await env.DB.prepare("DELETE FROM clients WHERE id = ?").bind(id).run();
        return new Response(JSON.stringify({ success: true }), { headers });
      }
    }

    // GET & POST /api/settings
    if (path === 'settings') {
      if (method === 'GET') {
        const { results } = await env.DB.prepare("SELECT * FROM site_settings").all();
        const settings = {};
        results.forEach(r => settings[r.key] = r.value);
        return new Response(JSON.stringify(settings), { headers });
      }
      if (method === 'POST') {
        const body = await request.json();
        for (const [key, value] of Object.entries(body)) {
          await env.DB.prepare(
            "INSERT INTO site_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?"
          ).bind(key, value, value).run();
        }
        return new Response(JSON.stringify({ success: true }), { headers });
      }
    }

    return new Response(JSON.stringify({ error: "Endpoint not found" }), { status: 404, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}
