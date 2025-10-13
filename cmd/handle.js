import c from "chalk"
import fs from "fs"
import p from "path"
import EventEmitter from "events"
import { authUser } from '../system/db/data.js'

const dir = p.join(dirname, "../cmd/command"),
      cache = {}

class CommandEmitter extends EventEmitter {
  on(def, listener) {
    if (typeof def === "object" && def.cmd && def.run) {
      def.name && (this.pluginName = def.name)
      const cmds = Array.isArray(def.cmd) ? def.cmd : [def.cmd]

      for (const c2 of cmds) {
        super.on(c2.toLowerCase(), async (...a) => {
          try {
            await def.run(...a)
          } catch (e) {
            log(c.redBright.bold(`Error ${def.name || c2}: `), e)
          }
        })
      }

      this.commands = this.commands || []
      this.commands.push(def)
    } else {
      super.on(def, listener)
    }
  }
}

const ev = new CommandEmitter()

const unloadByFile = file => {
  if (!file || !ev.commands) return
  const targets = ev.commands.filter(x => x.file === file)
  if (!targets.length) return

  for (const t of targets) {
    const cmds = Array.isArray(t.cmd) ? t.cmd : [t.cmd]
    for (const c2 of cmds) ev.removeAllListeners(c2.toLowerCase())
  }

  ev.commands = ev.commands.filter(x => x.file !== file)
}

const loadFile = async (f, isReload = !0) => {
  try {
    const fp = p.join(dir, f),
          moduleUrl = `${fp}?update=${Date.now()}`

    if (isReload) unloadByFile(f)

    const originalOn = ev.on.bind(ev)
    ev.on = def => {
      if (typeof def === 'object' && def.cmd) def.file = f
      originalOn(def)
    }

    const mod = await import(moduleUrl).then(m => m.default || m)
    if (typeof mod === "function") mod(ev)
    ev.on = originalOn
  } catch (e) {
    log('error pada loadFile', e)
  }
}

const loadAll = async () => {
  const files = fs.readdirSync(dir).filter(x => x.endsWith(".js"))
  for (const f of files) await loadFile(f, !0)
  const total = ev.commands ? ev.commands.length : 0
  log(c.greenBright.bgGrey.bold(`Berhasil memuat ${total} cmd`))
}

const watch = () => {
  const debounceTimers = {}
  try {
    fs.watch(dir, (_, f) => {
      if (!f?.endsWith(".js")) return
      clearTimeout(debounceTimers[f])
      debounceTimers[f] = setTimeout(() => {
        log(c.cyanBright.bold(`${f} diedit`))
        loadFile(f, !0)
      }, 3e2)
    })
  } catch {
    for (const f of fs.readdirSync(dir).filter(x => x.endsWith(".js"))) {
      fs.watchFile(p.join(dir, f), () => {
        log(c.cyanBright.bold(`${f} diedit`))
        loadFile(f, !0)
      })
    }
  }
}

const handleCmd = async (m, xp) => {
  try {
    const { text } = global.getMessageContent(m) || {}
    if (!text) return

    const pfx = [].concat(global.prefix),
          pre = pfx.find(p => text.startsWith(p))
    if (!pre) return

    const [cmd, ...args] = text.slice(pre.length).trim().split(/\s+/),
          chat = global.chat(m),
          lowerCmd = cmd.toLowerCase(),
          sender = (m.key.participant || m.key.remoteJid).replace(/@s\.whatsapp\.net$/, ''),
          ownerNum = Array.isArray(global.ownerNumber)
            ? global.ownerNumber.map(n => n.replace(/[^0-9]/g, ''))
            : [global.ownerNumber?.replace(/[^0-9]/g, '')],
          eventData = ev.commands?.find(
            e => e.name?.toLowerCase() === lowerCmd ||
            (Array.isArray(e.cmd) && e.cmd.map(c => c.toLowerCase()).includes(lowerCmd))
          )

    authUser(m, chat)
    if (eventData?.owner && !ownerNum.includes(sender)) return

    ev.emit(lowerCmd, xp, m, { args, chat, text, command: lowerCmd, prefix: pre })
  } catch (e) {
    log('error pada handleCmd', e)
  }
}

await loadAll()
watch()
export { handleCmd, ev }