import { isJidGroup } from 'baileys'

export default function group(ev) {
  ev.on({
    name: 'open',
    cmd: ['buka', 'open'],
    tags: 'Group Menu',
    desc: 'membuka grup',
    owner: !1,

    run: async (xp, m, {
      args,
      chat
    }) => {
      try {
        if (!chat.group) {
          return xp.sendMessage(chat.id, { text: 'perintah ini hanya untuk grup' }, { quoted: m })
        }

        const { botAdm, usrAdm } = await grupify(xp, chat.id, chat.sender)

        if (!botAdm) {
          return xp.sendMessage(chat.id, { text: 'Bot bukan admin' }, { quoted: m })
        }

        if (!usrAdm) {
          return xp.sendMessage(chat.id, { text: 'Kamu bukan admin grup' }, { quoted: m })
        }

        await xp.groupSettingUpdate(chat.id, 'not_announcement');
      } catch (e) {
        log('error pada open', e)
      }
    }
  })

  ev.on({
    name: 'close',
    cmd: ['tutup', 'close'],
    tags: 'Group Menu',
    desc: 'menutup grup',
    owner: !1,

    run: async (xp, m, {
      args,
      chat
    }) => {
      try {
        if (!chat.group) {
          return xp.sendMessage(chat.id, { text: 'Perintah ini hanya untuk grup' }, { quoted: m })
        }

        const { botAdm, usrAdm } = await grupify(xp, chat.id, chat.sender)

        if (!botAdm) {
          return xp.sendMessage(chat.id, { text: 'Bot bukan admin' }, { quoted: m })
        }

        if (!usrAdm) {
          return xp.sendMessage(chat.id, { text: 'Kamu bukan admin grup' }, { quoted: m })
        }

        await xp.groupSettingUpdate(chat.id, 'announcement')
      } catch (e) {
        log('error pada close', e)
      }
    }
  })

  ev.on({
    name: 'joingc',
    cmd: ['join', 'masuk', 'joingc'],
    tags: 'Group Menu',
    desc: 'memasukkan bot ke grup dengan link',
    owner: !1,

    run: async (xp, m, {
      chat,
      args
    }) => {
      try {
        let prompt = args.join(' '),
            quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage

        if (quoted) prompt = quoted.conversation 
                        || quoted.extendedTextMessage?.text 
                        || quoted.extendedTextMessage?.prompt 
                        || prompt

        const match = prompt?.match(/chat\.whatsapp\.com\/([\w\d]+)/)
        if (!match) return xp.sendMessage(chat.id, { text: prompt ? 'Link grup tidak valid' : 'Link grupnya mana?' }, { quoted: m })

        const res = await xp.groupAcceptInvite(match[1]),
              text = isJidGroup(res) 
                ? `Berhasil masuk ke grup dengan ID: ${res}` 
                : 'Undangan diterima, menunggu persetujuan admin'

        return xp.sendMessage(chat.id, { text }, { quoted: m })

      } catch (e) {
        console.error('Error pada joingc:', e)
        xp.sendMessage(chat.id, { text: 'Terjadi error saat join grup' }, { quoted: m })
      }
    }
  })

  ev.on({
    name: 'outgc',
    cmd: ['out', 'keluar', 'outgc'],
    tags: 'Group Menu',
    desc: 'mengeluarkan bot dari grup',
    owner: !0,

    run: async (xp, m, {
      args,
      chat
    }) => {
      try {
        const gc = await xp.groupFetchAllParticipating(),
              gcList = Object.values(gc)

        if (!gcList.length)
          return xp.sendMessage(chat.id, { text: 'Tidak ada grup yang diikuti bot.' }, { quoted: m })

        if (!args.length) {
          let text = '*Daftar Grup Bot:*\n\n'
          gcList.forEach((g, i) => {
            text += `${i + 1}. ${g.subject}\nID: ${g.id}\n\n`
          })
          text += 'Ketik: .outgc <nomor atau id grup>\nContoh:\n.outgc 1\n.outgc 628xxx-xxx@g.us'
          return xp.sendMessage(chat.id, { text }, { quoted: m })
        }

        const input = args[0]
        let target = null

        if (/^\d+$/.test(input)) {
          const i = parseInt(input, 10) - 1
          if (i >= 0 && i < gcList.length) target = gcList[i].id
        } else if (input.endsWith('@g.us')) {
          target = gcList.find(g => g.id === input)?.id
        }

        if (!target || !target.endsWith('@g.us'))
          return xp.sendMessage(chat.id, { text: !target ? 'Grup tidak ditemukan.' : 'ID grup tidak valid.' }, { quoted: m })

        await xp.groupLeave(target)
        xp.sendMessage(chat.id, { text: `Bot berhasil keluar dari grup:\n${target}` }, { quoted: m })

      } catch (e) {
        log('error pada outgc', e)
        xp.sendMessage(chat.id, { text: 'Terjadi kesalahan saat keluar dari grup.' }, { quoted: m })
      }
    }
  })
}