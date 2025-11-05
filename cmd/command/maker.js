import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { downloadMediaMessage } from 'baileys'
import { writeExifImg, writeExifVid, mediaMessage } from '../../system/exif.js'

export default function maker(ev) {
  ev.on({
    name: 'stiker',
    cmd: ['s', 'stiker', 'sticker'],
    tags: 'Maker Menu',
    desc: 'membuat stiker',
    owner: !1,

    run: async (xp, m, {
      chat
    }) => {
      try {
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage,
              image = quoted?.imageMessage || m.message?.imageMessage,
              video = quoted?.videoMessage || m.message?.videoMessage

        if (!image && !video) {
          return xp.sendMessage(chat.id, { text: 'reply/kirim media dengan caption yang akan dijadikan stiker' }, { quoted: m })
        }

        const media = await downloadMediaMessage({ message: quoted || m.message }, 'buffer')
        if (!media) throw new Error('error saat download media')

        const pack = { packname: footer, author: chat.pushName },
              Spath = image
                ? await writeExifImg(media, pack)
                : await writeExifVid(media, pack)

        if (!Spath) throw new Error('gagal membuat stiker')

        await xp.sendMessage(chat.id, { sticker: fs.readFileSync(Spath) }, { quoted: m })
      } catch (e) {
        log('error pada stiker', e)
      }
    }
  })

  ev.on({
    name: 'toimg',
    cmd: ['toimg'],
    tags: 'Maker Menu',
    desc: 'konversi stiker ke gambar ( kecuali stiker animasi )',
    owner: !1,

    run: async (xp, m, {
      chat
    }) => {
      try {
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage,
              stiker = quoted?.stickerMessage || m.message?.stickerMessage,
              temp = path.join(dirname, '../temp'),
              time = global.time.timeIndo("Asia/Jakarta", "HH:mm")

        if (!stiker || stiker.isAnimated || !fs.existsSync(temp)) {
          return xp.sendMessage(
            chat.id,
            {
              text:
                !stiker
                  ? 'reply/kirim stiker yang ingin dikonversi'
                  : stiker.isAnimated
                    ? 'stiker animasi tidak bisa dikonversi'
                    : !fs.existsSync(temp)
                      ? 'folder temp belum ada'
                    : ''
            },
            { quoted: m }
          )
        }

        const timeDir = `${time}`,
              webpPath = await mediaMessage({ message: quoted || m.message }, 'buffer'),
              outputPath = `${webpPath}.png`

        exec(`ffmpeg -i "${webpPath}" "${outputPath}"`, async err => {
          await fs.promises.unlink(webpPath).catch(() => {})
          if (err || !fs.existsSync(outputPath)) {
            return xp.sendMessage(chat.id, { text: `gagal mengonversi: ${err.message || 'tidak diketahui'}` }, { quoted: m })
          }

          const buffer = await fs.promises.readFile(outputPath)
          await xp.sendMessage(chat.id, { image: buffer, caption: 'hasil konversi' }, { quoted: m })
        })
      } catch (e) {
        log('error pada toimg', e)
      }
    }
  })

  ev.on({
    name: 'fakengl',
    cmd: ['ngl', 'fakengl'],
    tags: 'Maker Menu',
    desc: 'membuat fake ngl',
    owner: !1,

    run: async (xp, m, {
      args,
      chat
    }) => {
      try {
        if (!args.length) {
          return xp.sendMessage(chat.id, { text: 'example: .fakengl halo' }, { quoted: m })
        }

        const txt = args.join(' ').trim(),
              emoji = 'whatsapp',
              backgroundColor = 'light',
              url = `${termaiWeb}/api/maker/ngl?text=${encodeURIComponent(txt)}&emoji=${emoji}&backgroundColor=${backgroundColor}&key=${termaiKey}`,
              res = await xp.sendMessage(chat.id, { image: { url }, caption: 'hasil generate', ai: !0 }, { quoted: m })

        res ? !0 : await xp.sendMessage(chat.id, { text: 'gagal membuat fakengl' }, { quoted: m })
      } catch (e) {
        log('error pada fakengl', e)
      }
    }
  })
}