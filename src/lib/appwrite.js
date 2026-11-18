import { Account, Client, ID, Permission, Role, Storage, TablesDB } from 'appwrite'

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1'
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID

export const appwriteConfigured = Boolean(projectId)
const client = new Client().setEndpoint(endpoint).setProject(projectId || 'missing-project-id')
export const account = new Account(client)
export const tablesDB = new TablesDB(client)
export const storage = new Storage(client)

export async function getCurrentUser() {
  if (!appwriteConfigured) return null
  try { return await account.get() } catch { return null }
}

export async function registerAccount({ email, password, name }) {
  if (!appwriteConfigured) throw new Error('Appwrite is not configured. Add the VITE_APPWRITE_PROJECT_ID environment variable.')
  await account.create({ userId: ID.unique(), email, password, name: name || email.split('@')[0] })
  return account.createEmailPasswordSession({ email, password })
}

export async function loginAccount({ email, password }) {
  if (!appwriteConfigured) throw new Error('Appwrite is not configured. Add the VITE_APPWRITE_PROJECT_ID environment variable.')
  return account.createEmailPasswordSession({ email, password })
}

export async function logoutAccount() {
  return account.deleteSession({ sessionId: 'current' })
}

export async function saveWeddingProject({ user, wedding, template }) {
  if (!user?.$id) throw new Error('Please sign in before saving your wedding.')
  const existingId = localStorage.getItem('ss-cloud-project-id')
  const data = {
    owner_id: user.$id,
    slug: `${(wedding.bride || 'celebration').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`,
    title: `${wedding.bride || 'Your'} & ${wedding.groom || 'Wedding'}`,
    template_id: template?.id || 'gulmohar',
    status: 'draft',
    wedding_data: JSON.stringify(wedding),
  }
  if (existingId) {
    const { slug, ...updateData } = data
    return tablesDB.updateRow({ databaseId: 'shaadisutra', tableId: 'wedding_projects', rowId: existingId, data: updateData })
  }
  const row = await tablesDB.createRow({
    databaseId: 'shaadisutra',
    tableId: 'wedding_projects',
    rowId: ID.unique(),
    data,
    permissions: [
      Permission.read(Role.user(user.$id)),
      Permission.update(Role.user(user.$id)),
      Permission.delete(Role.user(user.$id)),
    ],
  })
  localStorage.setItem('ss-cloud-project-id', row.$id)
  return row
}

export async function uploadWeddingImage(file, user) {
  if (!user?.$id) throw new Error('Please sign in before uploading photos.')
  if (!file || !/^image\\/(jpeg|png|webp|avif)$/.test(file.type)) throw new Error('Choose a JPG, PNG, WebP or AVIF image.')
  if (file.size > 10 * 1024 * 1024) throw new Error('Each image must be 10 MB or smaller.')
  const uploaded = await storage.createFile({
    bucketId: 'wedding-media',
    fileId: ID.unique(),
    file,
    permissions: [Permission.read(Role.any()), Permission.update(Role.user(user.$id)), Permission.delete(Role.user(user.$id))],
  })
  return { fileId: uploaded.$id, url: storage.getFileView({ bucketId: 'wedding-media', fileId: uploaded.$id }).toString() }
}
