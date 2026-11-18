import { Account, Client, Functions, ID, Permission, Query, Role, Storage, TablesDB } from 'appwrite'

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1'
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID
const DB = 'shaadisutra'
const FUNCTION_ID = 'cashfree-payments'

export const appwriteConfigured = Boolean(projectId)
const client = new Client().setEndpoint(endpoint).setProject(projectId || 'missing-project-id')
export const account = new Account(client)
export const tablesDB = new TablesDB(client)
export const storage = new Storage(client)
export const functions = new Functions(client)

async function callBackend(path, { method = 'GET', data = {}, authenticated = false } = {}) {
  if (!appwriteConfigured) throw new Error('Appwrite is not configured. Set VITE_APPWRITE_PROJECT_ID.')
  const headers = {}
  if (authenticated) {
    const jwt = await account.createJWT({ duration: 900 })
    headers['x-appwrite-user-jwt'] = jwt.jwt
  }
  const execution = await functions.createExecution({
    functionId: FUNCTION_ID,
    body: method === 'GET' ? '' : JSON.stringify(data),
    path,
    method,
    headers,
  })
  let payload = {}
  try { payload = JSON.parse(execution.responseBody || '{}') } catch {}
  if (execution.responseStatusCode < 200 || execution.responseStatusCode >= 300 || payload.success === false) {
    throw new Error(payload.message || `Request failed (${execution.responseStatusCode}).`)
  }
  return payload
}

export async function getCurrentUser() {
  if (!appwriteConfigured) return null
  try { return await account.get() } catch { return null }
}

export async function registerAccount({ email, password, name }) {
  if (!appwriteConfigured) throw new Error('Appwrite is not configured. Add VITE_APPWRITE_PROJECT_ID.')
  await account.create({ userId: ID.unique(), email, password, name: name || email.split('@')[0] })
  return account.createEmailPasswordSession({ email, password })
}

export async function loginAccount({ email, password }) {
  if (!appwriteConfigured) throw new Error('Appwrite is not configured. Add VITE_APPWRITE_PROJECT_ID.')
  return account.createEmailPasswordSession({ email, password })
}

export async function logoutAccount() {
  return account.deleteSession({ sessionId: 'current' })
}

export async function listWeddingTemplates() {
  if (!appwriteConfigured) return []
  const result = await tablesDB.listRows({ databaseId: DB, tableId: 'template_catalog', queries: [Query.equal('active', true), Query.limit(100)] })
  return (result.rows || result.documents || []).map(row => {
    const t = row.data || row
    return { id: t.template_key || row.$id, name: t.name, religion: t.category, style: t.style || 'Traditional', price: Number(t.price_paise) / 100, tags: t.tags || [], palette: t.palette || '', accent: t.accent || '#a6533c', image: t.preview_image || '', desc: t.description || '' }
  })
}

export async function saveWeddingProject({ user, wedding, template }) {
  if (!user?.$id) throw new Error('Please sign in before saving your wedding.')
  const result = await tablesDB.listRows({ databaseId: DB, tableId: 'wedding_projects', queries: [Query.equal('owner_id', user.$id), Query.orderDesc('$updatedAt'), Query.limit(1)] })
  const existing = (result.rows || result.documents || [])[0]
  const data = {
    owner_id: user.$id,
    slug: existing?.slug || `${(wedding.bride || 'celebration').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${ID.unique().slice(0, 8).toLowerCase()}`,
    title: `${wedding.bride || 'Your'} & ${wedding.groom || 'Wedding'}`,
    template_id: template?.id || 'gulmohar',
    status: existing?.status === 'published' ? 'published' : 'draft',
    wedding_data: JSON.stringify(wedding),
  }
  if (existing?.$id) return tablesDB.updateRow({ databaseId: DB, tableId: 'wedding_projects', rowId: existing.$id, data })
  return tablesDB.createRow({
    databaseId: DB, tableId: 'wedding_projects', rowId: ID.unique(), data,
    permissions: [Permission.read(Role.user(user.$id)), Permission.update(Role.user(user.$id)), Permission.delete(Role.user(user.$id))],
  })
}

export async function loadWeddingProject(user) {
  if (!user?.$id) return null
  const result = await tablesDB.listRows({ databaseId: DB, tableId: 'wedding_projects', queries: [Query.equal('owner_id', user.$id), Query.orderDesc('$updatedAt'), Query.limit(1)] })
  return (result.rows || result.documents || [])[0] || null
}

export async function listMyOrders(user) {
  if (!user?.$id) return []
  const result = await tablesDB.listRows({ databaseId: DB, tableId: 'orders', queries: [Query.equal('owner_id', user.$id), Query.orderDesc('$createdAt'), Query.limit(20)] })
  return result.rows || result.documents || []
}

export async function createCashfreeOrder({ templateId, phone, projectId }) {
  return callBackend('/create-order', { method: 'POST', authenticated: true, data: { templateId, phone, projectId } })
}

export async function verifyCashfreePayment(orderId) {
  return callBackend('/verify', { method: 'POST', authenticated: true, data: { orderId } })
}

export async function publishWedding(orderId) {
  return callBackend('/publish', { method: 'POST', authenticated: true, data: { orderId } })
}

export async function loadPublicWedding(slug) {
  return callBackend(`/public-wedding?slug=${encodeURIComponent(slug)}`)
}

export async function submitWeddingRsvp(data) {
  return callBackend('/rsvp', { method: 'POST', data })
}

export async function uploadWeddingImage(file, user) {
  if (!user?.$id) throw new Error('Please sign in before uploading photos.')
  if (!file || !/^image\/(jpeg|png|webp|avif)$/.test(file.type)) throw new Error('Choose a JPG, PNG, WebP or AVIF image.')
  if (file.size > 10 * 1024 * 1024) throw new Error('Each image must be 10 MB or smaller.')
  const uploaded = await storage.createFile({
    bucketId: 'wedding-media', fileId: ID.unique(), file,
    permissions: [Permission.read(Role.any()), Permission.update(Role.user(user.$id)), Permission.delete(Role.user(user.$id))],
  })
  return { fileId: uploaded.$id, url: storage.getFileView({ bucketId: 'wedding-media', fileId: uploaded.$id }).toString() }
}

export async function listWeddingRsvps(projectId) {
  if (!projectId) return []
  const result = await callBackend(`/my-rsvps?projectId=${encodeURIComponent(projectId)}`, { authenticated: true })
  return result.rsvps || []
}

export async function adminRequest(path, { method = 'GET', data = {} } = {}) {
  return callBackend(path, { method, data, authenticated: true })
}
