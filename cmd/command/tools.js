import fs from 'fs'
import os from 'os'
import path from 'path'
import c from 'chalk'
import { exec } from 'child_process'
import { downloadMediaMessage } from 'baileys'
import { writeExifImg, writeExifVid, mediaMessage } from '../../system/exif.js'

export default function tools(ev) {
  ev.on({
    name: 'stiker',
    cmd: ['s', 'stiker', 'sticker'],
    tags: ['tools'],
    desc: 'Membuat stiker whatsapp',
    owner: !1,

    run: async (xp, m, {
      chat
    }) => {
      const { id } = chat
      try {
        const q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage,
              image = q?.imageMessage || m.message?.imageMessage,
              video = q?.videoMessage || m.message?.videoMessage

        if (!image && !video)
          return xp.sendMessage(id, { text: 'reply/kirim media dengan caption .s' }, { quoted: m })

        const media = await downloadMediaMessage({ message: q || m.message }, 'buffer')
        if (!media) throw new Error('media tidak terunduh')

        const metadata = { packname: footer, author: m.pushName },
              stickerPath = image
                ? await writeExifImg(media, metadata)
                : await writeExifVid(media, metadata)

        if (!stickerPath) throw new Error('gagal membuat stiker')

        await xp.sendMessage(
          id,
          { sticker: fs.readFileSync(stickerPath) },
          { quoted: m }
        )
      } catch (e) {
        log('error pada sticker:', e)
      }
    }
  })

  ev.on({
    name: 'toimg',
    cmd: ['toimg'],
    tags: ['tools'],
    desc: 'Stiker to image / gif',
    owner: !1,

    run: async (xp, m, {
      chat
    }) => {
      const { id } = chat
      try {
        const quotedMessage = m.message?.extendedTextMessage?.contextInfo?.quotedMessage,
              sticker = quotedMessage?.stickerMessage || m.message?.stickerMessage

        if (!sticker || sticker.isAnimated)
          return xp.sendMessage(
            id,
            { text: !sticker ? 'reply/kirim gambar dengan caption .s' : 'stiker animasi tidak bisa di conversi' },
            { quoted: m }
          )

        const temp = path.join(dirname, '../temp')
        if (!fs.existsSync(temp))
          return xp.sendMessage(
            id,
            { text: 'folder temp/sampah belum ada' },
            { quoted: m }
          )

        const time = global.time.timeIndo("Asia/Jakarta", "HH:mm"),
              timeDir = `${time}`,
              webpPath = await mediaMessage({ message: quotedMessage || m.message }, 'buffer'),
              outputPath = `${webpPath}.png`

        exec(`ffmpeg -i "${webpPath}" "${outputPath}"`, async err => {
          await fs.promises.unlink(webpPath).catch(() => {})
          if (err || !fs.existsSync(outputPath))
            return xp.sendMessage(
              id,
              { text: `Gagal conversi: ${err?.message || 'Tidak diketahui'}` },
              { quoted: m }
            )

          const buffer = await fs.promises.readFile(outputPath)
          await xp.sendMessage(
            id,
            { image: buffer, caption: 'Hasil conversi' },
            { quoted: m }
          )
          await fs.promises.unlink(outputPath).catch(() => {})
        })
      } catch (e) {
        log('Error pada toimg', e)
      }
    }
  })
}