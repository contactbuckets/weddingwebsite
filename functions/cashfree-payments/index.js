import { createHmac, timingSafeEqual, randomUUID } from 'node:crypto'
import { Client, Account, TablesDB, Query, ID, Permission, Role } from 'node-appwrite'

const PROJECT_ID = process.env.APPWRITE_FUNCTION_PROJECT_ID
const ENDPOINT = process.env.APPWRITE_FUNCTION_API_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1'
const DB_ID = 'shaadisutra'
const ORDERS_TABLE = 'orders'
const CASHFREE_VERSION = '2025-01-01'
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
function cashfreeBase() {
  return process.env.CASHFREE_ENV === 'production'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg'
}
function cashfreeHeaders() {
  const clientId = process.env.CASHFREE_CLIENT_ID
  const clientSecret = process.env.CASHFREE_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('Cashfree credentials are not configured in Appwrite Function variables.')
  return {
    'Content-Type': 'application/json',
    'x-api-version': CASHFREE_VERSION,
    'x-client-id': clientId,
    'x-client-secret': clientSecret,
  }
}
function adminTables() {
  const key = process.env.APPWRITE_FUNCTION_API_KEY
  if (!key) throw new Error('Appwrite Function API key is unavailable. Grant rows.read and rows.write scopes.')
  const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(key)
  return new TablesDB(client)
}
async function authenticatedUser(req) {
  const jwt = req.headers['x-appwrite-user-jwt']
  if (!jwt) return null
  const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setJWT(jwt)
  return new Account(client).get()
}
async function findOrder(tables, cashfreeOrderId) {
  const result = await tables.listRows({
    databaseId: DB_ID,
    tableId: ORDERS_TABLE,
    queries: [Query.equal('payment_provider_ref', cashfreeOrderId), Query.limit(1)],
  })
  return result.rows?.[0] || result.documents?.[0] || null
}
async function cashfreePayments(orderId) {
  const response = await fetch(`${cashfreeBase()}/orders/${encodeURIComponent(orderId)}/payments`, {
    method: 'GET',
    headers: cashfreeHeaders(),
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.message || 'Unable to verify payment with Cashfree.')
  return Array.isArray(payload) ? payload : []
}
async function syncVerifiedPayment(tables, row, payment) {
  const isSuccess = payment.payment_status === 'SUCCESS'
  const expectedAmount = Number(row.amount_paise) / 100
  const paidAmount = Number(payment.payment_amount ?? payment.order_amount)
  if (isSuccess && (payment.order_id !== row.payment_provider_ref || paidAmount !== expectedAmount || payment.payment_currency && payment.payment_currency !== 'INR')) {
    throw new Error('Cashfree payment details do not match the ShaadiSutra order.')
  }
  if (isSuccess && row.status !== 'paid') {
    await tables.updateRow({
      databaseId: DB_ID,
      tableId: ORDERS_TABLE,
      rowId: row.$id,
      data: { status: 'paid', payment_id: String(payment.cf_payment_id || ''), currency: 'INR' },
    })
  } else if (payment.payment_status === 'FAILED' && row.status === 'pending') {
    await tables.updateRow({ databaseId: DB_ID, tableId: ORDERS_TABLE, rowId: row.$id, data: { status: 'failed' } })
  }
  return isSuccess
}
function verifyWebhookSignature(req, rawBody) {
  const timestamp = req.headers['x-webhook-timestamp']
  const signature = req.headers['x-webhook-signature']
  const secret = process.env.CASHFREE_CLIENT_SECRET
  if (!timestamp || !signature || !secret) return false
  const expected = createHmac('sha256', secret).update(String(timestamp) + rawBody).digest('base64')
  const a = Buffer.from(expected)
  const b = Buffer.from(String(signature))
  return a.length === b.length && timingSafeEqual(a, b)
}

export default async ({ req, res, log, error }) => {
  try {
    const path = (req.path || '/').replace(/\/$/, '') || '/'
    const data = req.bodyJson || {}

    if (req.method === 'GET' && (path === '/health' || path === '/')) {
      return res.json({ service: 'ShaadiSutra Cashfree Payments', ready: Boolean(process.env.CASHFREE_CLIENT_ID && process.env.CASHFREE_CLIENT_SECRET), environment: process.env.CASHFREE_ENV || 'sandbox' })
    }

    if (path === '/webhook' && req.method === 'POST') {
      const rawBody = req.bodyText || ''
      if (!verifyWebhookSignature(req, rawBody)) return jsonError(res, 'Invalid Cashfree webhook signature.', 401)
      const event = JSON.parse(rawBody)
      const orderId = event?.data?.order?.order_id
      const payment = event?.data?.payment
      if (!orderId || !payment) return res.json({ success: true, ignored: true })
      const tables = adminTables()
      const row = await findOrder(tables, orderId)
      if (!row) return jsonError(res, 'Order not found.', 404)
      const success = await syncVerifiedPayment(tables, row, {
        order_id: orderId,
        payment_status: payment.payment_status,
        payment_amount: payment.payment_amount,
        payment_currency: payment.payment_currency || 'INR',
        cf_payment_id: payment.cf_payment_id,
      })
      return res.json({ success: true, paid: success })
    }

    if (path === '/create-order' && req.method === 'POST') {
      const user = await authenticatedUser(req)
      if (!user) return jsonError(res, 'Please sign in to continue.', 401)
      const template = CATALOG[data.templateId]
      if (!template) return jsonError(res, 'Please select a valid wedding template.')
      const phone = String(data.phone || '').replace(/\D/g, '')
      if (!/^\d{10}$/.test(phone)) return jsonError(res, 'Enter a valid 10-digit mobile number.')
      const siteUrl = process.env.SHAADISUTRA_SITE_URL
      if (!siteUrl) return jsonError(res, 'ShaadiSutra site URL is not configured in Appwrite Function variables.', 500)
      const orderId = `ss_${randomUUID().replace(/-/g, '').slice(0, 24)}`
      const amount = template.amount
      const cfResponse = await fetch(`${cashfreeBase()}/orders`, {
        method: 'POST',
        headers: { ...cashfreeHeaders(), 'x-idempotency-key': randomUUID() },
        body: JSON.stringify({
          order_id: orderId,
          order_amount: amount,
          order_currency: 'INR',
          customer_details: {
            customer_id: user.$id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50),
            customer_name: String(user.name || 'ShaadiSutra Customer').replace(/[^a-zA-Z0-9 ]/g, '').slice(0, 80),
            customer_email: user.email,
            customer_phone: phone,
          },
          order_meta: {
            return_url: `${siteUrl.replace(/\/$/, '')}/?payment=return&order_id={order_id}`,
            ...(process.env.CASHFREE_NOTIFY_URL ? { notify_url: process.env.CASHFREE_NOTIFY_URL } : {}),
          },
          order_note: `ShaadiSutra template: ${template.name}`,
        }),
      })
      const cfOrder = await cfResponse.json().catch(() => ({}))
      if (!cfResponse.ok || !cfOrder.payment_session_id) {
        error(`Cashfree order creation failed: ${cfOrder.message || cfResponse.status}`)
        return jsonError(res, cfOrder.message || 'Cashfree could not create this payment order.', 502)
      }
      const tables = adminTables()
      const row = await tables.createRow({
        databaseId: DB_ID,
        tableId: ORDERS_TABLE,
        rowId: ID.unique(),
        data: {
          owner_id: user.$id,
          template_id: data.templateId,
          amount_paise: amount * 100,
          currency: 'INR',
          status: 'pending',
          payment_provider_ref: orderId,
        },
        permissions: [
          Permission.read(Role.user(user.$id)),
          Permission.update(Role.user(user.$id)),
        ],
      })
      return res.json({
        success: true,
        orderRowId: row.$id,
        orderId,
        paymentSessionId: cfOrder.payment_session_id,
        amount,
        templateName: template.name,
      })
    }

    if (path === '/verify' && req.method === 'POST') {
      const user = await authenticatedUser(req)
      if (!user) return jsonError(res, 'Please sign in to verify this payment.', 401)
      const orderId = String(data.orderId || '')
      if (!/^ss_[a-f0-9]{24}$/.test(orderId)) return jsonError(res, 'Invalid order reference.')
      const tables = adminTables()
      const row = await findOrder(tables, orderId)
      if (!row || row.owner_id !== user.$id) return jsonError(res, 'Order not found.', 404)
      const payments = await cashfreePayments(orderId)
      const successful = payments.find(payment => payment.payment_status === 'SUCCESS')
      if (successful) {
        const paid = await syncVerifiedPayment(tables, row, successful)
        return res.json({ success: true, paid, status: paid ? 'paid' : 'pending' })
      }
      return res.json({ success: true, paid: false, status: row.status })
    }

    return jsonError(res, 'Route not found.', 404)
  } catch (err) {
    error(err?.stack || String(err))
    return jsonError(res, err?.message || 'Payment service error.', 500)
  }
}
