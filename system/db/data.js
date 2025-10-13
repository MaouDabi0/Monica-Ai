import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const database = path.join(dirname, 'database.json')

let init = (() => {
  if (!fs.existsSync(database)) return fs.writeFileSync(database, JSON.stringify({ key: {} }, null, 2)), { key: {} }
  try {
    return JSON.parse(fs.readFileSync(database)) || (fs.writeFileSync(database, JSON.stringify({ key: {} }, null, 2)), { key: {} })
  } catch (e) {
    log('database rusak', e)
    fs.writeFileSync(database, JSON.stringify({ key: {} }, null, 2))
    return { key: {} }
  }
})()

const db = () => init

const saveDb = () => {
  try {
    fs.writeFileSync(database, JSON.stringify(init, null, 2))
  } catch (e) {
    log('error pada saveDb: ', e)
  }
}

const randomId = m => {
  const letters = 'abcdefghijklmnopqrstuvwxyz',
        pick = s => Array.from({ length: 5 }, () => s[Math.floor(Math.random() * s.length)]),
        jid = (m?.key?.participantAlt || '').replace('@s.whatsapp.net', ''),
        base = [...pick(letters), ...jid.slice(-4)]

  for (let i = base.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[base[i], base[j]] = [base[j], base[i]]
  }

  return base.join('')
}

const authUser = m => {
  try {
    const { sender, group, pushName } = chat(m),
          nama = (pushName || '-').trim().slice(0, 20),
          pJid = m?.key?.participantAlt || null,
          e = o => Object.values(o || {}).some(u => u.jid === sender)

    if (
      !sender.endsWith('@s.whatsapp.net') ||
      e(db.key) ||
      (group && pJid && sender !== pJid) ||
      e(init.key)
    ) return

    init.key ??= {}
    let k = nama, i = 1
    while (init.key[k]) k = `${nama}_${i++}`

    init.key[k] = {
      jid: sender,
      noId: randomId(),
      ban: !1,
      ai: {
        bell: !1,
        chat: 0
      }
    }

    saveDb()
  } catch (e) {
    log('error pada authUser', e)
  }
}

export {
  init,
  db,
  saveDb,
  randomId,
  authUser
}