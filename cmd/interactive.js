import fetch from 'node-fetch'
import { generateWAMessageContent, getContentType } from 'baileys'
import { convertToOpus, generateWaveform } from '../system/ffmpeg.js'
import { db, saveDb } from '../system/db/data.js'

const fetchJSON = async (url, options = {}) => {
  const res = await fetch(url, options)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

const fetchBuffer = async (url, options = {}) => {
  const res = await fetch(url, options)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return Buffer.from(await res.arrayBuffer())
}

export async function vn(xp, id, audioBuffer, m = null) {
  try {
    const buff = await convertToOpus(audioBuffer),
          config = { audio: buff, mimetype: 'audio/ogg; codecs=opus', ptt: !0 },
          messageContent = await generateWAMessageContent(config, { upload: xp.waUploadToServer }),
          type = getContentType(messageContent)

    if (m) messageContent[type].contextInfo = {
      stanzaId: m.key.id,
      participant: m.key.participant || m.key.remoteJid,
      quotedMessage: m.message
    }

    messageContent[type].waveform = await generateWaveform(buff)
    return await xp.relayMessage(id, messageContent, {})
  } catch (err) {
    log('error pasa vn', err)
    throw err
  }
}

async function bell(body, text, m, sender, xp, id, voice = "dabi", pitch = 0, speed = 0.9) {
  const name = m?.pushName || m?.key?.participantAlt?.split('@')[0] || 'tidak diketahui',
        data = {
          text,
          id: sender,
          fullainame: botFullName,
          nickainame: botName,
          senderName: name,
          ownerName,
          date: new Date().toString(),
          role: 'Sahabat Deket',
          msgtype: 'text',
          custom_profile: logic,
          commands: [
            {
              description: 'Jika perlu direspon dengan suara',
              output: {
                cmd: 'voice',
                msg: `Pesan di sini. Gunakan gaya bicara <nickainame> yang menarik dan realistis, lengkap dengan tanda baca yang tepat agar terdengar hidup saat diucapkan.`
              }
            },
            {
              description: 'Jika pesan adalah permintaan untuk menampilkan menu (maka jawab lah dengan mengatakan ini menu nya!)',
              output: { 
                cmd: 'menu'
              }
            },
            {
              description: 'Jika pesan adalah perintah untuk membuka/menutup group',
              output: {
                cmd: ['opengroup', 'closegroup']
              }
            },
            {
              description: 'Jika pesan adalah permintaan untuk membuat stiker atau mengubah sebuah gambar menjadi stiker. (Abaikan isi konten pada gambar!)',
              output: {
                cmd: 'stiker'
              }
            },
            {
              description: 'Jika pesan adalah permintaan untuk membuat stiker to image atau mengubah sebuah sticker menjadi gambar. (Abaikan isi konten pada sticker!)',
              output: {
                cmd: 'toimg'
              }
            }
          ]
        }

  try {
    const { status, data: resData } = await fetchJSON(
      `${termaiWeb}/api/chat/logic-bell?key=${termaiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }
    )

    if (!status) return { error: !0, message: 'API gagal merespon' }

    if (resData?.cmd === 'voice') {
      const audioBuffer = await fetchBuffer(
        `${termaiWeb}/api/text2speech/elevenlabs?text=${encodeURIComponent(resData.msg)}&voice=${voice}&pitch=${pitch}&speed=${speed}&key=${termaiKey}`
      )
      return audioBuffer
        ? (await vn(xp, id, audioBuffer, m), { cmd: 'voice' })
        : { error: !0, message: 'Gagal membuat voice' }
    }

    return { cmd: resData?.cmd, msg: resData?.msg }
  } catch (e) {
    return { error: !0, message: e.message }
  }
}

export const signal = async (text, m, user, id, xp, ev) => {  
  const idBot = xp.user?.id?.split(':')[0] + '@s.whatsapp.net',
        botNameLower = global.botName?.toLowerCase(),
        ctx = m.message?.extendedTextMessage?.contextInfo || {},
        { mentionedJid = [], participant = '' } = ctx,
        sender = m.key?.participant || m.participant || user,
        senderBase = sender?.split(':')[0] || sender,
        botNumb = idBot?.split('@')[0],
        call = mentionedJid.includes(idBot)
          || participant === idBot
          || ctx.participant === idBot
          || text?.toLowerCase().includes(botNameLower),
        prefix = [].concat(global.prefix).some(p => text?.startsWith(p))

  if ((call && senderBase === botNumb) || prefix || !call) return

  const keyData = Object.values(db()?.key || {}).find(v => v?.jid === sender)
  if (!keyData || keyData.ai?.bell === !1) return

  keyData.ai.chat = (keyData.ai.chat || 0) + 1
  saveDb()

  const _ai = await bell(text, text, m, sender, xp, id)
  log(_ai)

  if (!_ai) return

  const cmd = _ai?.cmd?.toLowerCase()
  if (!ev) return

  let res = !1

  const cmds = [
    {
      cmd: ['opengroup'],
      q: 'open',
      event: 'open',
      res: !0
    },
    {
      cmd: ['closegroup'],
      q: 'close',
      event: 'close',
      res: !0
    },
    {
      cmd: ['menu'],
      q: 'menu',
      event: 'menu',
      res: !1
    },
    {
      cmd: ['stiker', 'sticker'],
      q: 'stiker',
      event: 'stiker',
      res: !0
    },
    {
      cmd: ['toimg'],
      q: 'toimg',
      event: 'toimg',
      res: !0
    }
  ]

  const ify = cmds.find(r => r.cmd.includes(cmd))
  if (ify) {
    m.q = ify.q
    ev.emit(ify.event, xp, m, { args: [], chat: global.chat(m) })
    res = ify.res ?? !1
  } else if (_ai?.msg) {
    res = !0
  }

  if (_ai?.msg && res) {
    await xp.sendMessage(m.key.remoteJid, { text: _ai.msg }, { quoted: m })
  }

  return _ai
}