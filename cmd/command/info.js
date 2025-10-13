import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { performance } from 'perf_hooks'
import moment from 'moment-timezone'
import os from 'os'

export default function info(ev) {
  ev.on({
    name: 'menu',
    cmd: ['menu'],
    tags: 'Info Menu',
    desc: 'main Menu',
    owner: !1,

    run: async (xp, m, {
      chat
    }) => {
      try {
        const { id, pushName } = chat,
              time = global.time.timeIndo('Asia/Jakarta', 'HH:mm'),
              cmdPath = path.join(process.cwd(), 'cmd', 'command')

        const commands = Object.fromEntries(
          fs.readdirSync(cmdPath)
            .filter(f => f.endsWith('.js'))
            .map(f => [f.replace('.js', ''), []])
        )

        for (const file of Object.keys(commands)) {
          const plugin = (await import(`file://${path.join(cmdPath, file)}.js`)).default
          if (typeof plugin === 'function') {
            plugin({
              on: obj => obj?.name && commands[file].push(obj.name)
            })
          }
        }

        let txt = `Halo *${pushName}*, Saya adalah asisten virtual.\n\n`
        txt += `${head}${opb} *${botName}* ${clb}\n` +
               `${body} ${btn} *Bot Name: ${botFullName}*\n` +
               `${body} ${btn} *Owner: ${ownerName}*\n` +
               `${body} ${btn} *Waktu: ${time}*\n` +
               `${foot}${line}\n${readmore}\n`

        for (const [cat, features] of Object.entries(commands)) {
          if (!features.length) continue
          txt += `${head}${opb} *${cat.charAt(0).toUpperCase() + cat.slice(1)} Menu* ${clb}\n`
          txt += features.map(f => `${body} ${btn} *${f}*`).join('\n') + `\n${foot}${line}\n\n`
        }
        txt += `${footer}`

        await xp.sendMessage(id, {
          text: txt,
          contextInfo: {
            externalAdReply: {
              title: botFullName,
              body: `Ini adalah menu ${botName}`,
              thumbnailUrl: thumbnail,
              mediaType: 1,
              renderLargerThumbnail: !0
            },
            forwardingScore: 1,
            isForwarded: !0,
            forwardedNewsletterMessageInfo: {
              newsletterJid: idCh
            }
          }
        }, { quoted: m })
      } catch (e) {
        err('Error pada menu', e)
      }
    }
  })

  ev.on({
    name: 'stats',
    cmd: ['st', 'stats', 'ping'],
    tags: 'Info Menu',
    desc: 'status Bot',
    owner: !1,

    run: async (xp, m, {
      chat
    }) => {
      const a = performance.now(),
        bytes = b => (b / 1024 / 1024).toFixed(2),
        time = global.time.timeIndo("Asia/Jakarta", "HH:mm"),
        cpu = os.cpus()?.[0]?.model ?? 'Tidak diketahui',
        platform = os.platform(),
        arch = os.arch(),
        totalMem = os.totalmem(),
        usedMem = totalMem - os.freemem()

      let totalDisk = 'Tidak diketahui',
        usedDisk = 'Tidak diketahui',
        freeDisk = 'Tidak diketahui'

      try {
        const d = execSync('df -h /', { encoding: 'utf8' })
          .split('\n')[1]
          .split(/\s+/)
        ;[totalDisk, usedDisk, freeDisk] = [d[1], d[2], d[3]]
      } catch (e) {
        err('Disk info error:', e.message)
      }

      const stats = `Ini adalah status dari ${botName}

  ${head} ${opb} Stats *${botName}* ${clb}
  ${body} ${btn} *Bot Name:* ${botName}
  ${body} ${btn} *Bot Full Name:* ${botFullName}
  ${body} ${btn} *Time:* ${time}
  ${body} ${btn} *Respon:* ${(performance.now() - a).toFixed(2)} ms
  ${foot}${line}

  ${head} ${opb} Stats System ${clb}
  ${body} ${btn} *Platform:* ${platform} ( ${arch} )
  ${body} ${btn} *Cpu:* ${cpu}
  ${body} ${btn} *Ram:* ${bytes(usedMem)} MB / ${bytes(totalMem)} MB
  ${body} ${btn} *Storage:* ${usedDisk} / ${totalDisk} ( ${freeDisk} )
  ${foot}${line}`.trim()

      await xp.sendMessage(id, {
        text: stats,
        contextInfo: {
          externalAdReply: {
            title: botFullName,
            body: `Ini adalah stats ${botName}`,
            thumbnailUrl: thumbnail,
            mediaType: 1,
            renderLargerThumbnail: !0
          },
          forwardingScore: 1,
          isForwarded: !0,
          forwardedNewsletterMessageInfo: {
            newsletterJid: idCh
          }
        }
      }, { quoted: m })
    }
  })
}