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
}