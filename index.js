const { addonBuilder } = require("stremio-addon-sdk")
const axios = require("axios")

// CHANGE THIS to the playlist you want:
const PLAYLIST_ID = "PLgbp8uJ-p_SB_bn-m6nHGRySHdOmIHd8r"

// Helper: fetch playlist items
async function getPlaylistItems() {
    const url = `https://www.youtube.com/feeds/videos.xml?playlist_id=${PLAYLIST_ID}`
    const res = await axios.get(url)

    // Extract entries
    const items = res.data.match(/<entry>[\s\S]*?<\/entry>/g) || []

    return items.map(item => {
        const id = (item.match(/<yt:videoId>(.*?)<\/yt:videoId>/) || [])[1]
        const title = (item.match(/<title>(.*?)<\/title>/) || [])[1]
        const thumbnail = (item.match(/<media:thumbnail url="(.*?)"/) || [])[1]

        return { id, title, thumbnail }
    })
}

// Build add-on
const builder = new addonBuilder({
    id: "youtube-playlist-addon",
    version: "1.0.0",
    name: "YouTube Playlist",
    description: "Streams a specific YouTube playlist inside Stremio",
    types: ["movie"],
    catalogs: [
        {
            type: "movie",
            id: "youtube_playlist",
            name: "YouTube Playlist",
        }
    ],
    resources: ["catalog", "stream", "meta"]
})

// Catalog handler
builder.defineCatalogHandler(async () => {
    const playlist = await getPlaylistItems()

    return {
        metas: playlist.map(video => ({
            id: video.id,
            type: "movie",
            name: video.title,
            poster: video.thumbnail
        }))
    }
})

// Metadata handler
builder.defineMetaHandler(async ({ id }) => {
    return {
        meta: {
            id,
            type: "movie",
            name: `YouTube Video`,
            poster: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        }
    }
})

// Stream handler (YouTube direct playable format)
builder.defineStreamHandler(async ({ id }) => {
    return {
        streams: [
            {
                title: "YouTube",
                // Using the /embed URL ensures Stremio tvOS will not redirect to the YouTube app
                url: `https://www.youtube.com/embed/${id}`
            }
        ]
    }
})

// Start server
builder.getInterface()

console.log("YouTube Playlist Add-on running")
