import { db, saveDb } from '../../system/db/data.js'

export default function owner(ev) {
  ev.on({
    name: 'banchat',
    cmd: ['ban', 'banchat'],
    tags: 'Owner Menu',
    desc: 'banned pengguna',
    owner: !0,

    run: async (xp, m, {
      args,
      chat
    }) => {
      try {
        const ctx = m.message?.extendedTextMessage?.contextInfo || {},
              nomor = args[0]
                ? await global.number(args[0])
                : (ctx.mentionedJid?.[0] || ctx.participant || '')
                    .replace(/@s\.whatsapp\.net$/, ''),
              found = Object.keys(db().key).some(k => {
                const u = db().key[k]
                if (u.jid.replace(/@s\.whatsapp\.net$/i, '') === nomor) {
                  u.ban = !0
                  return !0
                }
                return !1
              })

        if (!nomor) return xp.sendMessage(chat.id, { text: 'reply/tag atau input nomor' })
        if (!found) return xp.sendMessage(chat.id, { text: 'nomor belum terdaftar' }, { quoted: m })

        saveDb(),
        xp.sendMessage(chat.id, { text: `${nomor} diban` }, { quoted: m })
      } catch (e) {
        log('error pada banchat', e)
      }
    }
  })

  ev.on({
    name: 'unban',
    cmd: ['unban'],
    tags: 'Owner Menu',
    desc: 'menghapus status ban pada pengguna',
    owner: !0,

    run: async (xp, m, {
      args,
      chat
    }) => {
      try {
        const ctx = m.message?.extendedTextMessage?.contextInfo || {},
              nomor = args[0]
                ? await global.number(args[0])
                : (ctx.mentionedJid?.[0] || ctx.participant || '')
                    .replace(/@s\.whatsapp\.net$/, ''),
              found = Object.keys(db().key).some(k => {
                const u = db().key[k]
                if (u.jid.replace(/@s\.whatsapp\.net$/i, '') === nomor) {
                  u.ban = !1
                  return !0
                }
                return !1
              })

        if (!nomor)
          return xp.sendMessage(chat.id, { text: 'Reply/tag atau input nomor' }, { quoted: m })

        if (!found)
          return xp.sendMessage(chat.id, { text: 'Nomor belum terdaftar' }, { quoted: m })

        saveDb()
        xp.sendMessage(chat.id, { text: `${nomor} diunban` }, { quoted: m })
      } catch (e) {
        log('Error pada unban', e)
      }
    }
  })
}