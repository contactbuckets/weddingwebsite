import { createHmac, timingSafeEqual, randomUUID } from 'node:crypto'
import { Client, Account, Users, TablesDB, Query, ID, Permission, Role } from 'node-appwrite'

const PROJECT_ID = process.env.APPWRITE_FUNCTION_PROJECT_ID
const ENDPOINT = process.env.APPWRITE_FUNCTION_API_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1'
const DB_ID = 'shaadisutra'
const CATALOG_TABLE = 'template_catalog'
const PROJECTS_TABLE = 'wedding_projects'
const ORDERS_TABLE = 'orders'
const RSVPS_TABLE = 'rsvps'
const CASHFREE_VERSION = '2025-01-01'
const DEFAULT_TEMPLATES = [
{id:'gulmohar',name:'Gulmohar',category:'Hindu',style:'Floral',price:2499,palette:'Terracotta · Ivory',accent:'#a84e39',image:'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=1000&q=85',description:'A warm floral celebration.'},
{id:'noor',name:'Noor-e-Nikah',category:'Muslim',style:'Minimal',price:2799,palette:'Sage · Champagne',accent:'#77866d',image:'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=85',description:'An elegant modern nikah invitation.'},
{id:'jaipur',name:'The Jaipur Edit',category:'Hindu',style:'Royal',price:2999,palette:'Rose · Antique Gold',accent:'#a6533c',image:'https://images.unsplash.com/photo-1591604466107-ec97de577aff?auto=format&fit=crop&w=1000&q=85',description:'Inspired by palace courtyards.'},
{id:'meenakshi',name:'Meenakshi',category:'South Indian',style:'Traditional',price:2499,palette:'Banana Leaf · Vermilion',accent:'#8d6b3f',image:'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1000&q=85',description:'Temple-inspired motifs and jasmine details.'},
{id:'laavan',name:'Laavan',category:'Sikh',style:'Vibrant',price:2699,palette:'Marigold · Crimson',accent:'#b45b32',image:'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1000&q=85',description:'A joyful Punjabi celebration.'},
{id:'satrangi',name:'Satrangi',category:'Hindu',style:'Vibrant',price:2299,palette:'Fuchsia · Saffron',accent:'#a34b64',image:'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1000&q=85',description:'Playful colour and a festive mood.'},
{id:'everafter',name:'Ever After',category:'Christian',style:'Minimal',price:2799,palette:'Ivory · Dusty Blue',accent:'#71818a',image:'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=1000&q=85',description:'A clean editorial romantic design.'},
{id:'sunehri',name:'Sunehri Shaam',category:'Hindu',style:'Royal',price:3199,palette:'Midnight · Gold',accent:'#927044',image:'https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?auto=format&fit=crop&w=1000&q=85',description:'A candlelit jewel-toned invitation.'},
{id:'viren-yukti',name:'Viren & Yukti',category:'Hindu',style:'Royal Floral',price:2999,palette:'Antique Gold · Peach · Ivory',accent:'#b77b24',image:'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=85',description:'An ornate storybook wedding invitation.'}
];
const CATALOG = {
  gulmohar: { name: 'Gulmohar', amount: 2499 },
  noor: { name: 'Noor-e-Nikah', amount: 2799 },
  jaipur: { name: 'The Jaipur Edit', amount: 2999 },
  meenakshi: { name: 'Meenakshi', amount: 2499 },
  laavan: { name: 'Laavan', amount: 2699 },
  satrangi: { name: 'Satrangi', amount: 2299 },
  everafter: { name: 'Ever After', amount: 2799 },
  sunehri: { name: 'Sunehri Shaam', amount: 3199 },
}

function jsonError(res, message, status = 400) {
  return res.json({ success: false, message }, status)
}
function baseUrl() {
  return process.env.CASHFREE_ENV === 'production' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg'
}
function cashfreeHeaders() {
  const id = process.env.CASHFREE_CLIENT_ID
  const secret = process.env.CASHFREE_CLIENT_SECRET
  if (!id || !secret) throw new Error('Cashfree sandbox credentials are not configured in Appwrite Function variables.')
  return { 'Content-Type': 'application/json', 'x-api-version': CASHFREE_VERSION, 'x-client-id': id, 'x-client-secret': secret }
}
function adminClient() {
  const key = process.env.SHAADISUTRA_APPWRITE_API_KEY || process.env.APPWRITE_FUNCTION_API_KEY
  if (!key) throw new Error('Appwrite admin API key is unavailable.')
  return new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(key)
}
async function requireAdmin(req) {
  const user = await authenticatedUser(req)
  const allowed = String(process.env.SHAADISUTRA_ADMIN_USER_IDS || '').split(',').map(x => x.trim()).filter(Boolean)
  return user && allowed.includes(user.$id) ? user : null
}
function tables() {
  const key = process.env.SHAADISUTRA_APPWRITE_API_KEY || process.env.APPWRITE_FUNCTION_API_KEY
  if (!key) throw new Error('Appwrite Function API key is unavailable. Check rows.read and rows.write scopes.')
  return new TablesDB(new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(key))
}
function header(req, name) {
  const headers = req.headers || {}
  const found = Object.keys(headers).find(key => key.toLowerCase() === name.toLowerCase())
  return found ? headers[found] : ''
}
function rawBody(req) {
  if (typeof req.body === 'string') return req.body
  if (typeof req.bodyText === 'string') return req.bodyText
  return ''
}
function bodyJson(req) {
  const raw = rawBody(req)
  if (!raw) return {}
  try { return JSON.parse(raw) } catch { throw new Error('Invalid JSON request body.') }
}
function userClient(req) {
  const jwt = header(req, 'x-user-jwt')
  if (!jwt) return null
  return new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setJWT(jwt)
}
async function authenticatedUser(req) {
  const client = userClient(req)
  if (!client) return null
  return new Account(client).get()
}
async function findOrder(db, orderId) {
  const result = await db.listRows({ databaseId: DB_ID, tableId: ORDERS_TABLE, queries: [Query.equal('payment_provider_ref', orderId), Query.limit(1)] })
  return result.rows?.[0] || result.documents?.[0] || null
}
async function findProject(db, projectId) {
  try { return await db.getRow({ databaseId: DB_ID, tableId: PROJECTS_TABLE, rowId: projectId }) } catch { return null }
}
async function cashfreePayments(orderId) {
  const response = await fetch(`${baseUrl()}/orders/${encodeURIComponent(orderId)}/payments`, { method: 'GET', headers: cashfreeHeaders() })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.message || 'Unable to verify payment with Cashfree.')
  return Array.isArray(payload) ? payload : []
}
async function syncVerifiedPayment(db, row, payment) {
  const success = payment.payment_status === 'SUCCESS'
  const amount = Number(payment.payment_amount)
  const currency = payment.payment_currency || 'INR'
  if (success && (payment.order_id !== row.payment_provider_ref || !Number.isFinite(amount) || amount !== Number(row.amount_paise) / 100 || currency !== 'INR')) {
    throw new Error('Cashfree payment details do not match this ShaadiSutra order.')
  }
  if (success && row.status !== 'paid') {
    await db.updateRow({ databaseId: DB_ID, tableId: ORDERS_TABLE, rowId: row.$id, data: { status: 'paid', payment_id: String(payment.cf_payment_id || '') } })
  } else if (payment.payment_status === 'FAILED' && row.status === 'pending') {
    await db.updateRow({ databaseId: DB_ID, tableId: ORDERS_TABLE, rowId: row.$id, data: { status: 'failed' } })
  }
  return success
}
function validWebhook(req) {
  const timestamp = header(req, 'x-webhook-timestamp')
  const signature = header(req, 'x-webhook-signature')
  const secret = process.env.CASHFREE_CLIENT_SECRET
  const raw = rawBody(req)
  if (!timestamp || !signature || !secret || !raw) return false
  const expected = createHmac('sha256', secret).update(String(timestamp) + raw).digest('base64')
  const a = Buffer.from(expected)
  const b = Buffer.from(String(signature))
  return a.length === b.length && timingSafeEqual(a, b)
}

export default async ({ req, res, log, error }) => {
  try {
    const path = (req.path || '/').replace(/\/$/, '') || '/'
    const db = tables()

    if (req.method === 'GET' && (path === '/health' || path === '/')) {
      return res.json({
        service: 'ShaadiSutra Cashfree Payments',
        ready: Boolean(process.env.CASHFREE_CLIENT_ID && process.env.CASHFREE_CLIENT_SECRET && process.env.SHAADISUTRA_SITE_URL),
        environment: process.env.CASHFREE_ENV || 'sandbox',
        appwriteReady: Boolean(process.env.SHAADISUTRA_APPWRITE_API_KEY || process.env.APPWRITE_FUNCTION_API_KEY),
        siteConfigured: Boolean(process.env.SHAADISUTRA_SITE_URL),
      })
    }

    if (req.method === 'GET' && path === '/catalog') {
      const result = await db.listRows({ databaseId: DB_ID, tableId: CATALOG_TABLE, queries: [Query.equal('active', true), Query.limit(100)] })
      return res.json({ success: true, templates: result.rows || result.documents || [] })
    }

    if (path.startsWith('/admin/')) {
      const admin = await requireAdmin(req)
      if (!admin) return jsonError(res, 'Administrator access is required.', 403)
      if (req.method === 'GET' && path === '/admin/dashboard') {
        const [users, orders, weddings, rsvps] = await Promise.all([
          new Users(adminClient()).list({ queries: [Query.limit(100)] }),
          db.listRows({ databaseId: DB_ID, tableId: ORDERS_TABLE, queries: [Query.orderDesc('$createdAt'), Query.limit(100)] }),
          db.listRows({ databaseId: DB_ID, tableId: PROJECTS_TABLE, queries: [Query.orderDesc('$createdAt'), Query.limit(100)] }),
          db.listRows({ databaseId: DB_ID, tableId: RSVPS_TABLE, queries: [Query.orderDesc('$createdAt'), Query.limit(100)] }),
        ])
        let templateRows = (await db.listRows({ databaseId: DB_ID, tableId: CATALOG_TABLE, queries: [Query.limit(100)] })).rows || []
        const known = new Set(templateRows.map(row => row.template_key || row.$id))
        for (const t of DEFAULT_TEMPLATES) {
          if (known.has(t.id)) continue
          const rowData = { template_key:t.id, name:t.name, category:t.category, style:t.style, price_paise:t.price*100, preview_image:t.image, description:t.description, active:true, is_free:false, palette:t.palette, accent:t.accent }
          try { const created = await db.createRow({ databaseId:DB_ID, tableId:CATALOG_TABLE, rowId:t.id, data:rowData, permissions:[Permission.read(Role.any())] }); templateRows.push(created) } catch (e) {
            const existing = await db.getRow({ databaseId:DB_ID, tableId:CATALOG_TABLE, rowId:t.id }).catch(() => null)
            if (existing) templateRows.push(existing)
          }
        }
        const orderRows = orders.rows || orders.documents || []
        const weddingRows = weddings.rows || weddings.documents || []
        return res.json({ success: true, customers: users.users || [], orders: orderRows, weddings: weddingRows, templates: templateRows, rsvps: rsvps.rows || rsvps.documents || [], metrics: { customers: users.total || 0, orders: orderRows.length, revenue: orderRows.filter(x => x.status === 'paid').reduce((sum, x) => sum + Number(x.amount_paise || 0), 0) / 100, weddings: weddingRows.length, rsvps: (rsvps.rows || rsvps.documents || []).length } })
      }
      if (req.method === 'POST' && path === '/admin/template') {
        const data = bodyJson(req)
        const id = String(data.id || '').toLowerCase()
        const name = String(data.name || '').trim()
        const isFree = data.is_free === true
        const price = isFree ? 0 : Math.round(Number(data.price) * 100)
        if (!/^[a-z0-9_-]{2,80}$/.test(id) || name.length < 2 || !Number.isSafeInteger(price) || (!isFree && price < 100)) return jsonError(res, 'Enter a valid template ID, name and price.')
        const variables = Array.isArray(data.variables) ? data.variables.slice(0, 60).map(v => ({ key: String(v.key || '').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 60), label: String(v.label || '').slice(0, 100), defaultValue: String(v.defaultValue || '').slice(0, 500) })) : []
        if (variables.some(v => !v.key) || new Set(variables.map(v => v.key)).size !== variables.length) return jsonError(res, 'Dynamic variable keys must be valid and unique.')
        for (const key of ['html','css','js']) if (String(data[key] || '').length > 300000) return jsonError(res, 'Each source file must be 300 KB or smaller.')
        const catalogData = { template_key:id, name, category:String(data.category || 'Hindu').slice(0,60), style:String(data.style || 'Traditional').slice(0,40), price_paise:price, preview_image:String(data.image || '').slice(0,1000), description:String(data.description || '').slice(0,3000), active:data.active !== false, is_free:isFree, palette:String(data.palette || '').slice(0,100), accent:String(data.accent || '#a6533c').slice(0,20) }
        const existing = await db.getRow({ databaseId:DB_ID, tableId:CATALOG_TABLE, rowId:id }).catch(() => null)
        if (existing) await db.updateRow({ databaseId:DB_ID, tableId:CATALOG_TABLE, rowId:id, data:catalogData })
        else await db.createRow({ databaseId:DB_ID, tableId:CATALOG_TABLE, rowId:id, data:catalogData, permissions:[Permission.read(Role.any())] })
        const source = await db.getRow({ databaseId:DB_ID, tableId:'template_sources', rowId:id }).catch(() => null)
        const sourceData = { template_key:id, file_id:id, file_name:name+'.html', html_source:String(data.html || ''), css_source:String(data.css || ''), js_source:String(data.js || ''), variables_json:JSON.stringify(variables), created_by:admin.$id }
        if (source) await db.updateRow({ databaseId:DB_ID, tableId:'template_sources', rowId:id, data:sourceData })
        else await db.createRow({ databaseId:DB_ID, tableId:'template_sources', rowId:id, data:sourceData, permissions:[Permission.read(Role.user(admin.$id)),Permission.update(Role.user(admin.$id))] })
        return res.json({ success:true, templateId:id })
      }
      if (req.method === 'POST' && path === '/admin/template-status') {
        const data = bodyJson(req)
        const id = String(data.id || '').toLowerCase()
        if (!/^[a-z0-9_-]{2,80}$/.test(id)) return jsonError(res, 'Invalid template ID.')
        const existing = await db.getRow({ databaseId:DB_ID, tableId:CATALOG_TABLE, rowId:id }).catch(() => null)
        if (!existing) return jsonError(res, 'Template not found.', 404)
        const current = existing.data || existing
        const patch = {}
        if (typeof data.active === 'boolean') patch.active = data.active
        if (typeof data.is_free === 'boolean') patch.is_free = data.is_free
        if (data.price !== undefined) {
          const price = Math.round(Number(data.price) * 100)
          if (!Number.isSafeInteger(price) || price < 0 || (price === 0 && current.is_free !== true && data.is_free !== true)) return jsonError(res, 'Mark a template free before setting its price to zero.')
          patch.price_paise = price
        }
        if (!Object.keys(patch).length) return jsonError(res, 'No template settings supplied.')
        const updated = await db.updateRow({ databaseId:DB_ID, tableId:CATALOG_TABLE, rowId:id, data:patch })
        return res.json({ success:true, template:updated })
      }
    }
    if (req.method === 'GET' && path === '/public-wedding') {
      const slug = String(req.query?.slug || '')
      if (!slug || slug.length > 100) return jsonError(res, 'A valid invitation link is required.')
      const result = await db.listRows({ databaseId: DB_ID, tableId: PROJECTS_TABLE, queries: [Query.equal('slug', slug), Query.equal('status', 'published'), Query.limit(1)] })
      const project = result.rows?.[0] || result.documents?.[0]
      if (!project) return jsonError(res, 'This wedding invitation is not published or no longer available.', 404)
      return res.json({ success: true, wedding: JSON.parse(project.wedding_data), templateId: project.template_id, title: project.title, projectId: project.$id })
    }

    if (req.method === 'POST' && path === '/webhook') {
      if (!validWebhook(req)) return jsonError(res, 'Invalid Cashfree webhook signature.', 401)
      const event = JSON.parse(rawBody(req))
      const orderId = event?.data?.order?.order_id
      const payment = event?.data?.payment
      if (!orderId || !payment) return res.json({ success: true, ignored: true })
      const row = await findOrder(db, orderId)
      if (!row) return jsonError(res, 'Order not found.', 404)
      const paid = await syncVerifiedPayment(db, row, { order_id: orderId, payment_status: payment.payment_status, payment_amount: payment.payment_amount, payment_currency: payment.payment_currency || 'INR', cf_payment_id: payment.cf_payment_id })
      return res.json({ success: true, paid })
    }

    if (req.method === 'POST' && path === '/claim-free') {
      const user = await authenticatedUser(req)
      if (!user) return jsonError(res, 'Please sign in to claim this template.', 401)
      const data = bodyJson(req)
      const templateId = String(data.templateId || '')
      const catalogRow = await db.getRow({ databaseId:DB_ID, tableId:CATALOG_TABLE, rowId:templateId }).catch(() => null)
      const catalog = catalogRow?.data || catalogRow
      if (!catalog || catalog.active !== true || catalog.is_free !== true) return jsonError(res, 'This template is not currently available for free.', 403)
      const project = await findProject(db, String(data.projectId || ''))
      if (!project || project.owner_id !== user.$id || project.template_id !== templateId) return jsonError(res, 'Save your wedding draft before claiming this template.')
      const freeOrderId = 'ss_free_' + randomUUID().replace(/-/g, '').slice(0,24)
      const order = await db.createRow({ databaseId:DB_ID, tableId:ORDERS_TABLE, rowId:ID.unique(), data:{ owner_id:user.$id, project_id:project.$id, template_id:templateId, amount_paise:0, currency:'INR', status:'paid', payment_provider_ref:freeOrderId, payment_id:'FREE_TEMPLATE' }, permissions:[Permission.read(Role.user(user.$id))] })
      return res.json({ success:true, orderId:freeOrderId, orderRowId:order.$id, amount:0, templateName:catalog.name })
    }

    if (req.method === 'POST' && path === '/create-order') {
      const user = await authenticatedUser(req)
      if (!user) return jsonError(res, 'Please sign in to continue.', 401)
      const data = bodyJson(req)
      if (!/^[a-z0-9_-]{2,80}$/.test(String(data.templateId || ''))) return jsonError(res, 'Please select a valid wedding template.')
      const catalogRow = await db.getRow({ databaseId: DB_ID, tableId: CATALOG_TABLE, rowId: data.templateId }).catch(() => null)
      const catalog = catalogRow?.data || catalogRow
      if (!catalog || catalog.active !== true || !Number.isSafeInteger(Number(catalog.price_paise)) || Number(catalog.price_paise) < 100) return jsonError(res, 'This wedding template is unavailable for purchase.', 404)
      const template = { name: catalog.name, amount: Number(catalog.price_paise) / 100 }
      const phone = String(data.phone || '').replace(/\D/g, '')
      if (!/^\d{10}$/.test(phone)) return jsonError(res, 'Enter a valid 10-digit mobile number.')
      if (!user.email) return jsonError(res, 'Your account needs an email address before checkout.')
      if (!Number.isInteger(template.amount * 100) || template.amount * 100 > 100000000) return jsonError(res, 'This template price is not configured correctly.', 503)
      const siteUrl = process.env.SHAADISUTRA_SITE_URL
      if (!siteUrl) return jsonError(res, 'ShaadiSutra website URL is not configured yet.', 503)
      const projectId = String(data.projectId || '')
      const project = await findProject(db, projectId)
      if (!project || project.owner_id !== user.$id || project.template_id !== data.templateId) return jsonError(res, 'Save your wedding draft before checkout.')
      const orderId = `ss_${randomUUID().replace(/-/g, '').slice(0, 24)}`
      const orderRow = await db.createRow({
        databaseId: DB_ID, tableId: ORDERS_TABLE, rowId: ID.unique(),
        data: { owner_id: user.$id, project_id: project.$id, template_id: data.templateId, amount_paise: template.amount * 100, currency: 'INR', status: 'pending' },
        permissions: [Permission.read(Role.user(user.$id))],
      })
      try {
        const response = await fetch(`${baseUrl()}/orders`, {
          method: 'POST',
          headers: { ...cashfreeHeaders(), 'x-idempotency-key': randomUUID() },
          body: JSON.stringify({
            order_id: orderId, order_amount: template.amount, order_currency: 'INR',
            customer_details: {
              customer_id: user.$id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50),
              customer_name: String(user.name || 'ShaadiSutra Customer').replace(/[^a-zA-Z0-9 ]/g, '').slice(0, 80),
              customer_email: user.email, customer_phone: phone,
            },
            order_meta: {
              return_url: `${siteUrl.replace(/\/$/, '')}/?payment=return&order_id={order_id}`,
              ...(process.env.CASHFREE_NOTIFY_URL ? { notify_url: process.env.CASHFREE_NOTIFY_URL } : {}),
            },
            order_note: `ShaadiSutra template: ${template.name}`,
          }),
        })
        const cashfreeOrder = await response.json().catch(() => ({}))
        if (!response.ok || !cashfreeOrder.payment_session_id) throw new Error(cashfreeOrder.message || 'Cashfree could not create this payment order.')
        await db.updateRow({ databaseId: DB_ID, tableId: ORDERS_TABLE, rowId: orderRow.$id, data: { payment_provider_ref: orderId } })
        return res.json({ success: true, orderRowId: orderRow.$id, orderId, paymentSessionId: cashfreeOrder.payment_session_id, amount: template.amount, templateName: template.name })
      } catch (err) {
        await db.updateRow({ databaseId: DB_ID, tableId: ORDERS_TABLE, rowId: orderRow.$id, data: { status: 'failed' } }).catch(() => {})
        throw err
      }
    }

    if (req.method === 'POST' && path === '/verify') {
      const user = await authenticatedUser(req)
      if (!user) return jsonError(res, 'Please sign in to verify this payment.', 401)
      const data = bodyJson(req)
      const orderId = String(data.orderId || '')
      if (!/^ss_[a-f0-9]{24}$/.test(orderId)) return jsonError(res, 'Invalid order reference.')
      const row = await findOrder(db, orderId)
      if (!row || row.owner_id !== user.$id) return jsonError(res, 'Order not found.', 404)
      const payments = await cashfreePayments(orderId)
      const successful = payments.find(payment => payment.payment_status === 'SUCCESS')
      if (successful) {
        const paid = await syncVerifiedPayment(db, row, successful)
        return res.json({ success: true, paid, status: paid ? 'paid' : 'pending', projectId: row.project_id })
      }
      const failed = payments.some(payment => payment.payment_status === 'FAILED')
      if (failed && row.status === 'pending') await db.updateRow({ databaseId: DB_ID, tableId: ORDERS_TABLE, rowId: row.$id, data: { status: 'failed' } })
      return res.json({ success: true, paid: false, status: failed ? 'failed' : row.status, projectId: row.project_id })
    }

    if (req.method === 'POST' && path === '/publish') {
      const user = await authenticatedUser(req)
      if (!user) return jsonError(res, 'Please sign in to publish your wedding.', 401)
      const data = bodyJson(req)
      const orderId = String(data.orderId || '')
      const row = await findOrder(db, orderId)
      if (!row || row.owner_id !== user.$id || row.status !== 'paid' || !row.project_id) return jsonError(res, 'A verified paid order is required before publishing.', 403)
      const project = await findProject(db, row.project_id)
      if (!project || project.owner_id !== user.$id) return jsonError(res, 'Wedding project not found.', 404)
      const updated = await db.updateRow({ databaseId: DB_ID, tableId: PROJECTS_TABLE, rowId: project.$id, data: { status: 'published', published_at: new Date().toISOString() } })
      return res.json({ success: true, slug: updated.slug, url: `${process.env.SHAADISUTRA_SITE_URL}/?invite=${encodeURIComponent(updated.slug)}` })
    }

    if (req.method === 'GET' && path === '/my-rsvps') {
      const user = await authenticatedUser(req)
      if (!user) return jsonError(res, 'Please sign in to view your guest RSVPs.', 401)
      const projectId = String(req.query?.projectId || '')
      const project = await findProject(db, projectId)
      if (!project || project.owner_id !== user.$id) return jsonError(res, 'Wedding project not found.', 404)
      const result = await db.listRows({ databaseId: DB_ID, tableId: RSVPS_TABLE, queries: [Query.equal('project_id', project.$id), Query.orderDesc('$createdAt'), Query.limit(100)] })
      return res.json({ success: true, rsvps: result.rows || result.documents || [] })
    }

    if (req.method === 'POST' && path === '/rsvp') {
      const data = bodyJson(req)
      const projectId = String(data.projectId || '')
      const project = await findProject(db, projectId)
      if (!project || project.status !== 'published') return jsonError(res, 'This invitation is not available for RSVP.', 404)
      const name = String(data.name || '').trim().slice(0, 160)
      const attendance = String(data.attendance || '')
      const count = Math.max(1, Math.min(20, Number(data.guestCount) || 1))
      if (name.length < 2 || !['attending', 'not_attending'].includes(attendance)) return jsonError(res, 'Please enter your name and RSVP response.')
      await db.createRow({
        databaseId: DB_ID, tableId: RSVPS_TABLE, rowId: ID.unique(),
        data: { project_id: project.$id, guest_name: name, ...(String(data.email || '').trim() ? { guest_email: String(data.email).trim().slice(0, 254) } : {}), guest_phone: String(data.phone || '').replace(/\D/g, '').slice(0, 24), attendance, guest_count: count, note: String(data.note || '').slice(0, 1000) },
        permissions: [],
      })
      return res.json({ success: true, message: 'Thank you! Your RSVP has been received.' })
    }

    return jsonError(res, 'Route not found.', 404)
  } catch (err) {
    error(err?.stack || String(err))
    return jsonError(res, err?.message || 'Payment service error.', 500)
  }
}
