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
    // GET /api/materials
    if (path === 'materials' && method === 'GET') {
      const { results } = await env.DB.prepare("SELECT * FROM materials ORDER BY category, id").all();
      return new Response(JSON.stringify(results), { headers });
    }

    // PUT /api/materials/:id
    if (path.startsWith('materials/') && method === 'PUT') {
      const id = path.split('/')[1];
      const body = await request.json();
      await env.DB.prepare("UPDATE materials SET price = ? WHERE id = ?").bind(body.price, id).run();
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
            "INSERT OR IGNORE INTO clients (name, phone, email) VALUES (?, ?, ?)"
          ).bind(body.client_name, body.client_phone || null, body.client_email || null).run();
        }

        const res = await env.DB.prepare(
          `INSERT INTO offers (client_name, client_phone, client_email, items_json, total_price, discount_percent, final_price, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          body.client_name,
          body.client_phone || null,
          body.client_email || null,
          body.items_json,
          body.total_price,
          body.discount_percent || 0,
          body.final_price,
          body.status || 'Në Pritje'
        ).run();

        return new Response(JSON.stringify({ success: true, id: res.meta.last_row_id }), { headers });
      }
    }

    // PUT /api/offers/:id (Update Status)
    if (path.startsWith('offers/') && method === 'PUT') {
      const id = path.split('/')[1];
      const body = await request.json();
      await env.DB.prepare("UPDATE offers SET status = ? WHERE id = ?").bind(body.status, id).run();
      return new Response(JSON.stringify({ success: true }), { headers });
    }

    // GET /api/clients
    if (path === 'clients' && method === 'GET') {
      const { results } = await env.DB.prepare("SELECT * FROM clients ORDER BY id DESC").all();
      return new Response(JSON.stringify(results), { headers });
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
