import fs from 'fs'
import path from 'path'
import AdmZip from "adm-zip";
import { db, saveDb } from '../../system/db/data.js'
const config = path.join(dirname, './set/config.json'),
      pkg = JSON.parse(fs.readFileSync(path.join(dirname, '../package.json'))),
      temp = path.join(dirname, '../temp')

export default function owner(ev) {
  ev.on({
    name: 'backup',
    cmd: ['backup'],
    tags: 'Owner Menu',
    desc: 'backup sc',
    owner: !0,

    run: async (xp, m, {
      chat
    }) => {
      try {
        const name = global.botName.replace(/\s+/g, '_'),
              vers = pkg.version.replace(/\s+/g, '.'),
              zipName = `${name}-${vers}.zip`

        if (!fs.existsSync(temp)) fs.mkdirSync(temp, { recursive: !0 })

        const p = path.join(temp, zipName),
              zip = new AdmZip(),
              file = [
                'cmd',
                'connect',
                'system',
                'index.js',
                'package.json'
              ]

        for (const item of file) {
          const full = path.join(dirname, '../', item)
          if (!fs.existsSync(full)) continue
          const dir = fs.lstatSync(full).isDirectory()
          dir
            ? zip.addLocalFolder(
                full,
                item,
                item === 'connect' ? p => !p.includes('session') : void 0
              )
            : zip.addLocalFile(full)
        }

        zip.writeZip(p)

        await xp.sendMessage(chat.id, {
          document: fs.readFileSync(p),
          mimetype: 'application/zip',
          fileName: zipName,
          caption: `Backup berhasil dibuat.\nNama file: ${zipName}`
        }, m && m.key ? { quoted: m } : {})

        setTimeout(() => {
          if (fs.existsSync(p)) fs.unlinkSync(p)
        }, 5e3)
      } catch (e) {
        log('error pada backup', e)
      }
    }
  })

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

        const errorMsg = !nomor
          ? 'reply/tag atau input nomor'
          : !found
            ? 'nomor belum terdaftar'
            : null

        if (errorMsg) return xp.sendMessage(chat.id, { text: errorMsg }, { quoted: m })

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

        const errorMsg = !nomor
          ? 'reply/tag atau input nomor'
          : !found
            ? 'nomor belum terdaftar'
            : null

        if (errorMsg) return xp.sendMessage(chat.id, { text: errorMsg }, { quoted: m })

        saveDb()
        xp.sendMessage(chat.id, { text: `${nomor} diunban` }, { quoted: m })
      } catch (e) {
        log('Error pada unban', e)
      }
    }
  })

  ev.on({
    name: 'public',
    cmd: ['public'],
    tags: 'Owner Menu',
    desc: 'pengaturan bot mode',
    owner: !0,

    run: async (xp, m, {
      args,
      chat
    }) => {
      try {
        const arg = args[0]?.toLowerCase(),
              cfg = JSON.parse(fs.readFileSync(config, 'utf-8')),
              input = arg === 'on'

        if (!['on', 'off'].includes(arg)) {
          return xp.sendMessage(chat.id, {
            text: `gunakan: .public on/off\n\nstatus: ${global.public}`
          }, { quoted: m })
        }

        cfg.ownerSetting.public = input
        fs.writeFileSync(config, JSON.stringify(cfg, null, 2))
        global.public = input

        xp.sendMessage(chat.id, {
          text: `public ${input ? 'diaktifkan' : 'dimatikan'}`
        }, { quoted: m })
      } catch (e) {
        log('error pada public', e)
      }
    }
  })
}