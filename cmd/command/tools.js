import fs from 'fs'
import os from 'os'
import path from 'path'
import c from 'chalk'
import fetch from 'node-fetch'
import { vn } from '../interactive.js'
import { downloadMediaMessage } from 'baileys'
import { tmpFiles } from '../../system/tmpfiles.js'

export default function tools(ev) {
  ev.on({
    name: 'enlarger',
    cmd: ['hd', 'enlarger'],
    tags: 'Tools Menu',
    desc: 'Upscale / enhance gambar menggunakan AI',
    owner: !1,

    run: async (xp, m, {
      chat,
      prefix,
      command
    }) => {
      try {
        const { id } = chat,
              q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage || m.message,
              img = q?.imageMessage

        if (!img)
          return xp.sendMessage(id, { text: `Kirim atau reply gambar dengan caption *${prefix + command}*` }, { quoted: m })

        const buffer = await downloadMediaMessage({ message: q }, 'buffer')
        if (!buffer)
          return xp.sendMessage(id, { text: 'Gagal mengambil data gambar.' }, { quoted: m })

        const imageUrl = await tmpFiles(buffer),
              type = 'stdx4',
              task = await fetch(`${termaiWeb}/api/tools/enhance/createTask?url=${encodeURIComponent(imageUrl)}&type=${type}&key=${termaiKey}`).then(r => r.json()).catch(() => null)
        let i = 0

        if (!task?.status)
          return xp.sendMessage(id, { text: task?.msg || 'Gagal membuat task enhance.' }, { quoted: m })

        while (i++ < 5e1) {
          const status = await fetch(`${termaiWeb}/api/tools/enhance/taskStatus?id=${task.id}&key=${termaiKey}`).then(r => r.json()).catch(() => null)
          if (!status) break
          if (status.task_status === 'failed' || status.task_status === 'done')
            return xp.sendMessage(
              id,
              status.task_status === 'failed'
                ? { text: 'Maaf terjadi kesalahan. Gunakan gambar lain!' }
                : { image: { url: status.output }, caption: 'Gambar berhasil di-enhance' },
              { quoted: m }
            )
          await new Promise(r => setTimeout(r, 1e3))
        }

        xp.sendMessage(id, { text: 'Waktu pemrosesan habis. Coba lagi.' }, { quoted: m })
      } catch (e) {
        console.error('error pada enlarger', e)
        xp.sendMessage(chat.id, { text: 'Terjadi kesalahan saat memproses gambar.' }, { quoted: m })
      }
    }
  })

  ev.on({
    name: 'tmpfiles',
    cmd: ['tmpfiles', 'totmp'],
    tags: 'Tools Menu',
    desc: 'Ubah gambar jadi link dengan tmpfiles',
    owner: !1,

    run: async (xp, m, {
      chat
    }) => {
      try {
        const q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage || m.message,
              img = q?.imageMessage || q?.videoMessage

        if (!img)
          return xp.sendMessage(chat.id, { text: 'Kirim atau reply gambar/video untuk dijadikan link.' }, { quoted: m })

        const buffer = await downloadMediaMessage({ message: q }, 'buffer'),
              url = await tmpFiles(buffer)

        await xp.sendMessage(chat.id, { text: url }, { quoted: m })
      } catch (e) {
        log('error pada tourl', e)
        xp.sendMessage(chat.id, { text: 'Gagal upload file.' }, { quoted: m })
      }
    }
  })

  ev.on({
    name: 'tovn',
    cmd: ['tovn', 'vn'],
    tags: 'Tools Menu',
    desc: 'ubah lagu jadi vn',
    owner: !1,

    run: async (xp, m, {
      chat
    }) => {
      try {
        const q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage,
              audio = q?.audioMessage || m.message?.audioMessage,
              video = q?.videoMessage || m.message?.videoMessage

        if (!(audio || video)) {
          return xp.sendMessage(chat.id, { text: audio ? 'reply atau kirim audio yang akan di ubah' : 'reply atau kirim video yang akan di ubah' }, { quoted: m })
        }

        let media
        media = await downloadMediaMessage({ message: q || m.message }, 'buffer')
        if (!media) throw new Error('media tidak terunduh')

        await vn(xp, chat.id, media, m)
      } catch (e) {
        log('error pada tovn', e)
      }
    }
  })

  ev.on({
    name: 'ptv',
    cmd: ['ptv', 'p'],
    tags: 'Tools Menu',
    desc: 'generate ptv studio',
    owner: !1,

    run: async (xp, m, {
      args,
      chat
    }) => {
      try {
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage,
              video = quoted?.videoMessage || msg.message?.videoMessage

        if (!video) {
          return xp.sendMessage(chat.id, { text: 'reply atau kirim video yang ingin dijadikan ptv' }, { quoted: m })
        }

        const buffer = await downloadMediaMessage({ message: quoted || m.message }, 'buffer')

        if (!buffer) throw new Error('gagal mengunduh media')

        await xp.sendMessage(chat.id, { video: buffer, mimetype: 'video/mp4', ptv: !0 })
      } catch (e) {
        log('error pada ptv', e)
      }
    }
  })
}