import { GetTrackResponse } from "@/pages/api/tracks";
import Track from "./Track";

type Props = {
    loading: boolean
    track: {
        artist: string;
        name: string;
        reason?: string;
    },
    data?: GetTrackResponse
    songIdx: number
    setSongIdx?: (idx: number) => void
}
export default function PlexTrack(props: Props) {
    const songs = props.data ? props.data.Result.map(item => {
        const thumbUrl = item.image && item.image.indexOf('rovicorp') == -1 ? `/api/image?path=${item.image}` : '';
        const albumThumbUrl = item.album && item.album.image && item.image.indexOf('rovicorp') == -1 ? `/api/image?path=${item.album.image}` : '';
        const isTidal = !!(item.source && item.source.indexOf('provider.music') > -1)
        return {
            trackName: item.title,
            artistName: item.artist.title,
            thumb: thumbUrl,
            tidal: isTidal,
            album: item.album ? {
                title: item.album.title,
                thumb: albumThumbUrl
            } : undefined
        }
    }) : []


    return <Track
        loading={props.loading}
        trackName={props.track.name}
        artistName={props.track.artist}
        reason={props.track.reason || ''}
        songs={songs}
        songIdx={props.songIdx}
        setSongIdx={props.setSongIdx}
    />
}