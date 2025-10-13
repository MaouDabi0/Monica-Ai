import moment from 'moment-timezone';
import { db } from './db/data.js'
import { getMetadata, groupCache } from './function.js'

const time = {
  timeIndo: (zone = "Asia/Jakarta", fmt = "HH:mm:ss DD-MM-YYYY") => moment().tz(zone).format(fmt)
}

const chat = (m = {}, botName = "pengguna") => {
  const id = m?.key?.remoteJid || "",
        group = id.endsWith("@g.us"),
        channel = id.endsWith("@newsletter"),
        sender = m?.key?.participantAlt || m?.key?.participant || id,
        pushName = (m?.pushName || "").trim()
          || (sender.endsWith("@s.whatsapp.net")
            ? sender.replace(/@s\.whatsapp\.net$/, "")
            : botName);

  if (!id) return null;

  return { id, group, channel, sender, pushName };
};

const banned = jid => {
  const sender = jid,
        dataKeys = Object.keys(db()?.key || {}),
        users = dataKeys.map(k => db().key[k]),
        found = users.find(u => u?.jid === sender);

  let userData = found;

  if (!userData) {
    const clean = sender.replace(/\D/g, ''),
          fallback = users.find(u => u?.jid?.replace(/\D/g, '').endsWith(clean));
    if (fallback) userData = fallback;
  }

  return userData?.ban === !0;
};

const grupify = async (xp, id, sender) => {
  const meta = groupCache.get(id) || await getMetadata(id, xp) || {};
  if (!meta.id) return {};

  const adm = (meta.participants || [])
    .filter(p => p.admin)
    .map(p => p.phoneNumber),
        bot = `${xp.user?.id?.split(':')[0]}@s.whatsapp.net`,
        botAdm = adm.includes(bot),
        usrAdm = adm.includes(sender);

  return {
    meta,
    bot,
    botAdm,
    usrAdm,
    adm
  };
};

const sys = {
  time,
  chat,
  banned,
  grupify
}

export default sys;