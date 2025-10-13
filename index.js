import './system/global.js'
import c from 'chalk'
import fs from 'fs'
import path from 'path'
import pino from 'pino'
import { makeWASocket, useMultiFileAuthState } from 'baileys'
import { handleCmd, ev } from './cmd/handle.js'
import { signal } from './cmd/interactive.js'
import { evConnect, handleSessionIssue } from './connect/evConnect.js'
import { getMetadata, replaceLid, saveLidCache, cleanMsg, groupCache } from './system/function.js'

const tempDir = path.join(dirname, '../temp')
fs.existsSync(tempDir) || fs.mkdirSync(tempDir, { recursive: !0 })

global.lidCache = {}
const logLevel = pino({ level: 'silent' })
let xp

setInterval(() => console.clear(), 6e5)

const startBot = async () => {
  try {
    const { state, saveCreds } = await useMultiFileAuthState('./connect/session')
    xp = makeWASocket({
      auth: state,
      printQRInTerminal: !1,
      syncFullHistory: !1,
      logger: logLevel,
      browser: ['Ubuntu', 'Chrome', '20.0.04']
    })

    xp.ev.on('creds.update', saveCreds)

    if (!state.creds?.me?.id) {
      try {
        const num  = await q(c.blueBright.bold('Nomor: ')),
              code = await xp.requestPairingCode(await global.number(num)),
              show = (code || '').match(/.{1,4}/g)?.join('-') || ''
        log(c.greenBright.bold('Pairing Code:'), c.cyanBright.bold(show))
      } catch (e) {
        if (e?.output?.statusCode === 428 || /Connection Closed/i.test(e?.message || ''))
          return handleSessionIssue('Pairing timeout', startBot)
        throw e
      }
    }

    rl.close()
    evConnect(xp, startBot)

    xp.ev.on('messages.upsert', async ({ messages }) => {
      for (let m of messages) {
        if (!m.message) continue

        m = replaceLid(m)
        if (m.key.fromMe) cleanMsg(m)
        log(m)

        const { id, group, sender, pushName, channel } = global.chat(m, botName),
              time = global.time.timeIndo('Asia/Jakarta', 'HH:mm'),
              meta = group
                ? (groupCache.get(id) || await getMetadata(id, xp) || {})
                : {},
              groupName = group ? meta?.subject || 'Grup' : channel ? id : '',
              { text, media } = global.getMessageContent(m),
              name = pushName || sender || id

        if (group && Object.keys(meta).length) {
          await saveLidCache(meta)
        }

        log(
          c.bgGrey.yellowBright.bold(
            group
              ? `[ ${groupName} | ${name} ]`
              : channel
                ? `[ ${groupName} ]`
                : `[ ${name} ]`
          ) +
          c.white.bold(' | ') +
          c.blueBright.bold(`[ ${time} ]`)
        )

        ;(media || text) &&
        log(
          c.white.bold(
            [media && `[ ${media} ]`, text && `[ ${text} ]`]
              .filter(Boolean)
              .join(' ')
          )
        )

        if (banned(sender)) return log(c.yellowBright.bold(`${sender} diban`))

        if (text) {
          try {
            await signal(text, m, sender, id, xp, ev)
          } catch (e) {
            log('error pada response', e)
          }
        }

        await handleCmd(m, xp)
      }
    })

    xp.ev.on('group-participants.update', async u => {
      if (!u.id) return
      groupCache.delete(u.id)

      const meta = await getMetadata(u.id, xp),
            g = meta?.subject || 'Grup',
            idToPhone = Object.fromEntries((meta?.participants || []).map(p => [p.id, p.phoneNumber]))

      for (const pid of u.participants) {
        const phone = idToPhone[pid] || pid,
              msg = u.action === 'add'     ? c.greenBright.bold(`+ ${phone} joined ${g}`) :
                    u.action === 'remove'  ? c.redBright.bold(`- ${phone} left ${g}`) :
                    u.action === 'promote' ? c.magentaBright.bold(`${phone} promoted in ${g}`) :
                    u.action === 'demote'  ? c.cyanBright.bold(`${phone} demoted in ${g}`) : ''
        if (msg) log(msg)
      }
    })

    xp.ev.on('groups.update', u => 
      u.forEach(async v => {
        if (!v.id) return
        const m = await getMetadata(v.id, xp).catch(() => ({})),
              a = v.participantAlt || v.participant || v.author,
              f = a && m?.participants?.length ? m.participants.find(p => p.id === a) : 0
        v.author = f?.phoneNumber || a
        log(c.cyanBright.bold('Settings: ', m?.subject, '\n'), [v])
      })
    )
  } catch (e) {
    err(c.redBright.bold('Error pada index.js:'), e)
  }
}

startBot()