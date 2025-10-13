import fetch from 'node-fetch'
import { db, saveDb } from '../../system/db/data.js'

export default function ai(ev) {
  ev.on({
    name: 'bell',
    cmd: ['ai', 'bell'],
    tags: 'Ai Menu',
    desc: 'Fitur open ai',
    owner: !1,

    run: async (xp, m, {
      args,
      chat
    }) => {
      const { id, group, sender } = chat,
            val = args[0]?.toLowerCase();

      if (!['on', 'off'].includes(val)) 
        return xp.sendMessage(id, { text: 'Gunakan perintah .ai on/off' }, { quoted: m });

      const value = val === 'on',
            key = Object.keys(db().key).find(k => db().key[k].jid === (group ? sender : id));

      if (!key) return;

      db().key[key].ai.bell = value;
      saveDb();

      xp.sendMessage(
        id, 
        { text: `Bell telah ${value ? 'diaktifkan' : 'dinonaktifkan'}.` }, 
        { quoted: m }
      );
    }
  })

  ev.on({
    name: 'resetbell',
    cmd: ['resetbell', 'reset'],
    tags: 'Ai Menu',
    desc: 'Reset sesi AI Bell',
    owner: !1,

    run: async (xp, m, {
      args,
      chat
    }) => {
      try {
        const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
          || m.message?.extendedTextMessage?.contextInfo?.participant
          || chat.sender

        if (!target) 
          return await xp.sendMessage(chat.id, { text: 'Target tidak ditemukan.' }, { quoted: m })

        const res  = await fetch(`${termaiWeb}/api/chat/logic-bell/reset?id=${target}&key=${termaiKey}`),
              json = await res.json()

        await xp.sendMessage(
          chat.id,
          { text: json.m || json.msg || 'Terjadi error saat reset sesi Bell.' },
          { quoted: m }
        )
      } catch (e) {
        log('error pada resetbell', e)
        await xp.sendMessage(chat.id, { text: 'Terjadi kesalahan internal.' }, { quoted: m })
      }
    }
  })

  ev.on({
    name: 'cekkey',
    cmd: ['cekkey', 'key'],
    tags: 'Ai Menu',
    desc: 'cek key termai',
    owner: !1,

    run: async (xp, m, {
      chat
    }) => {
      try {
        const res = await fetch(`${termaiWeb}/api/tools/key-checker?key=${termaiKey}`),
              json = await res.json();

        if (!json.status) {
          return xp.sendMessage(chat.id, { text: `gagal mengambil data api ${json.data}` }, { quoted: m })
        }

        const d = json.data,
              formatTime = ({ days, hours, minutes, seconds }) =>
              [days && `${days} hari`, hours && `${hours} jam`, minutes && `${minutes} menit`, seconds && `${seconds} detik`]
                .filter(Boolean)
                .join(", ");

        let txt = `${head}${opb} *Info API Key* ${clb}\n` +
          `${body} ${btn} *Plan:* ${d.plan}\n` +
          `${body} ${btn} *Limit:* ${d.limit}\n` +
          `${body} ${btn} *Usage:* ${d.usage}\n` +
          `${body} ${btn} *Total Hit:* ${d.totalHit}\n` +
          `${body} ${btn} *Remaining:* ${d.remaining}\n` +
          `${body} ${btn} *Reset:* ${d.reset}\n` +
          `${body} ${btn} *Reset Dalam:* ${formatTime(d.resetEvery.format)}\n` +
          `${body} ${btn} *Expired:* ${d.expired}\n` +
          `${body} ${btn} *Expired?:* ${d.isExpired ? "Ya" : "Tidak"}\n` +
          `${foot}${line}\n\n` +
          `${head} *Fitur & Pemakaian:*\n`;

        for (const [fitur, detail] of Object.entries(d.features)) {
          if (typeof detail !== "object") continue;
          txt += `${body} ${btn} ${fitur}:\n` +
            `${body} ${btn} *Max:* ${detail.max ?? "-"}\n` +
            `${body} ${btn} *Use:* ${detail.use ?? "-"}\n` +
            `${body} ${btn} *Hit:* ${detail.hit ?? "-"}\n` +
            (detail.lastReset ? `${body} ${btn} *Last Reset:* ${new Date(detail.lastReset).toLocaleString("id-ID")}\n` : "") +
            `${body} ${line}\n`;
        }

        txt += `${body} Api Dari ${termaiWeb}\n${foot}${line}\n`;

        xp.sendMessage(chat.id, { text: txt.trim() }, { quoted: m })
      } catch (e) {
        log('error pada cekkey', e)
      }
    }
  })
}