import axios from 'axios'
import fetch from 'node-fetch'

export default function download(ev) {
  ev.on({
    name: 'fb',
    cmd: ['fb', 'facebook'],
    tags: 'Download Menu',
    desc: 'mendownload video dari facebook',
    owner: !1,

    run: async (xp, m, {
      args,
      chat
    }) => {
      try {
        const url = args[0]
        if (!url || !/^https?:\/\/(www\.)?facebook\.(com|watch)\/.+/.test(url))
          return xp.sendMessage(chat.id, { text: 'masukan url nya' }, { quoted: m })

        await xp.sendMessage(chat.id, { react: { text: '⏳', key: m.key } })

        const respon = await axios.get('https://api.siputzx.my.id/api/d/facebook', {
          params: { url },
          headers: {
            accept: "*/*",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36"
          }
        }),
        { status, data } = respon.data

        if (!status || !data?.data?.length)
          return xp.sendMessage(chat.id, { text: 'Gagal mengambil video. Pastikan link valid dan publik.' }, { quoted: m })

        const video = data.data[0],
              caption = `🎬 *${data.title || 'Video'}*\n🎥 Resolusi: ${video.resolution || 'Tidak diketahui'}\n📁 Format: ${video.format || 'mp4'}`

        await xp.sendMessage(chat.id, { caption, video: { url: video.url } }, { quoted: m })
      } catch (e) {
        log('error pada fb', e)
        xp.sendMessage(chat.id, { text: 'Terjadi kesalahan saat memproses permintaan.' }, { quoted: m })
      }
    }
  })

  ev.on({
    name: 'play',
    cmd: ['play', 'putar'],
    tags: 'Download Menu',
    desc: 'mencari lagu di YouTube dan memutarnya',
    owner: !1,

    run: async (xp, m, {
      args,
      chat
    }) => {
      try {
        if (!args[0]) 
          return xp.sendMessage(chat.id, { text: 'Masukkan judul lagu yang ingin diputar.' }, { quoted: m })

        const query = args.join(' '),
              search = await fetch(`${termaiWeb}/api/search/youtube?query=${encodeURIComponent(query)}&key=${termaiKey}`).then(r => r.json())

        if (!search.status || !search.data?.items?.length)
          return xp.sendMessage(chat.id, { text: 'Lagu tidak ditemukan.' }, { quoted: m })

        const top = search.data.items[0]

        let txt = `Info Pencarian\n\n`
            txt += `${head} ${opb} YouTube ${clb}\n`
            txt += `${body} ${btn} *Title:* ${top.title}\n`
            txt += `${body} ${btn} *Channel:* ${top.author?.name || 'tidak diketahui'}\n`
            txt += `${body} ${btn} *Durasi:* ${top.duration}\n`
            txt += `${body} ${btn} *View:* ${top.viewCount.toLocaleString()}\n`
            txt += `${body} ${btn} *Rilis:* ${top.publishedAt}\n`
            txt += `${body} ${btn} *Link:* ${top.url}\n`
            txt += `${foot}${line}`

        await xp.sendMessage(chat.id, {
          text: txt,
          contextInfo: {
            externalAdReply: {
              title: top.title,
              body: top.author?.name || 'YouTube',
              thumbnailUrl: top.thumbnail,
              mediaType: 1,
              renderLargerThumbnail: true,
              sourceUrl: top.url
            }
          }
        }, { quoted: m })

        const dl = await fetch(`${termaiWeb}/api/downloader/youtube?type=mp3&url=${encodeURIComponent(top.url)}&key=${termaiKey}`).then(r => r.json())

        if (!dl.status || !dl.data?.downloads?.length)
          return xp.sendMessage(chat.id, { text: 'Gagal mengambil link download.' }, { quoted: m })

        const file = dl.data.downloads[0]
        await xp.sendMessage(chat.id, {
          audio: { url: file.dlink },
          mimetype: 'audio/mpeg',
          ptt: !1
        }, { quoted: m })

      } catch (e) {
        log('error pada play', e)
        xp.sendMessage(chat.id, { text: 'Terjadi kesalahan saat memproses permintaan.' }, { quoted: m })
      }
    }
  })

  ev.on({
    name: 'ytdl',
    cmd: ['yt', 'ytdl'],
    tags: 'Download Menu',
    desc: 'download youtube mp4/mp3',
    owner: !1,

    run: async (xp, m, {
      args,
      chat
    }) => {
      try {
        if (!args[0]) 
          return xp.sendMessage(chat.id, { text: 'Masukan link YouTube-nya' }, { quoted: m })

        const url = args[0],
              format = ['mp4','mp3'].includes(args[1]) ? args[1] : 'mp4',
              api = `${termaiWeb}/api/downloader/youtube?type=${format}&url=${encodeURIComponent(url)}&key=${termaiKey}`,
              res = await fetch(api),
              dl = await res.json()

        if (!dl.status || !dl.data?.downloads?.length)
          return xp.sendMessage(chat.id, { text: 'Gagal mengambil link download.' }, { quoted: m })

        const file = dl.data.downloads[0]
        await xp.sendMessage(chat.id, { 
          [format === 'mp3' ? 'audio' : 'video']: { url: file.dlink }, 
          mimetype: format === 'mp3' ? 'audio/mpeg' : 'video/mp4' 
        }, { quoted: m })
      } catch (e) {
        log('error pada ytdl', e)
      }
    }
  })
}