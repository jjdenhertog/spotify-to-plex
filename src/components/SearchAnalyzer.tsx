import { errorBoundary } from "@/helpers/errors/errorBoundary";
import { GetSpotifyTrackResponse } from "@/pages/api/spotify/track";
import type { SearchResponse, SearchQuery, PlexTrack } from "@spotify-to-plex/plex-music-search";
import { Box, Button, CircularProgress, Divider, Link, TextField, Typography } from "@mui/material";
import axios from "axios";
import { ChangeEvent, Fragment, useCallback, useState } from "react";

export default function SearchAnalyzer() {

    const [loading, setLoading] = useState(false)
    const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null)

    const [spotifyURI, setSpotifyURI] = useState('')
    const onChangeSpotifyInput = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setSpotifyURI(e.target.value)
    }, [])

    const onAnalyseSongMatchClick = useCallback(() => {

        errorBoundary(async () => {
            setSearchResponse(null)
            setLoading(true);

            const spotifyTrack = await axios.post<GetSpotifyTrackResponse>('/api/spotify/track', { search: spotifyURI })
            setLoading(false)

            const result = await axios.post('/api/plex/analyze', { item: spotifyTrack.data })
            setSearchResponse(result.data)
        }, () => {
            setLoading(false)
        })

    }, [spotifyURI])

    const getRoundedSimilarity = (value: number) => {
        return `${Math.round(value * 100)}%`
    }


    return (<>
        <Typography sx={{ mb: 0.5 }} variant="body1">It can happen that songs are not matching (correctly). To find out if and why songs are matching you can use this page. Please share a screenshot of this page when <Link href="https://github.com/jjdenhertog/spotify-to-plex/issues" target="_blank" sx={{ m: 0, p: 0 }} color="warning">submitting a issue at GitHub</Link>.</Typography>

        <Divider sx={{ mt: 2, mb: 2 }} />
        <Typography sx={{ mb: 1 }} variant="h6">Spotify Track Link</Typography>
        <Typography variant="body1" sx={{ mt: 1, mb: 0.5, fontSize: ".9em" }}>Spotify URL &#40;e.g. https://open.spotify.com/track/7KwZNVEaqikRSBSpyhXK2j &#41;</Typography>
        <Typography variant="body1" sx={{ mb: 1, fontSize: ".9em" }}>Spotify URI &#40;e.g. spotify:track:7KwZNVEaqikRSBSpyhXK2j &#41;</Typography>
        <TextField
            fullWidth
            placeholder="Enter your Spotify URL/URI"
            disabled={loading}
            value={spotifyURI}
            onChange={onChangeSpotifyInput}
        />

        <Box mt={1}>
            <Button
                variant="contained"
                disabled={loading}
                onClick={onAnalyseSongMatchClick}
            >
                Analyse song match
            </Button>
        </Box>

        {!!loading && <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
        </Box>}

        {!!searchResponse &&
            <>

                <Divider sx={{ mb: 1, mt: 3 }} />
                {!!searchResponse.queries &&
                    <>
                        <Typography variant="h6" sx={{ mb: 1 }}>Search queries</Typography>
                        {searchResponse.queries?.map((item: SearchQuery, index: number) => {

                            const { approach, album, artist, title } = item;
                            const id = `query-${index}`;

                            return <Box key={id}>
                                <Box display="flex" gap={1} alignItems="center">
                                    <Typography variant="body1">Approach</Typography>
                                    <Typography variant="body2">{approach}</Typography>
                                </Box>
                                <Box display="flex" gap={1} alignItems="center">
                                    <Typography variant="body1">Artist</Typography>
                                    <Typography variant="body2">{artist}</Typography>
                                </Box>
                                <Box display="flex" gap={1} alignItems="center">
                                    <Typography variant="body1">Title</Typography>
                                    <Typography variant="body2">{title}</Typography>
                                </Box>
                                <Box display="flex" gap={1} alignItems="center">
                                    <Typography variant="body1">Album</Typography>
                                    <Typography variant="body2">{album}</Typography>
                                </Box>
                                <Divider sx={{ mt: 1, mb: 1 }} />
                            </Box>
                        })
                        }
                    </>
                }
                {searchResponse.result.length > 0 &&
                    <Typography variant="h6" sx={{ mb: 1 }}>Search Results</Typography>
                }
                {searchResponse.result.map((item: PlexTrack) => {
                    const { title, artist, id, matching, reason } = item;

                    if (!matching)
                        return null;

                    return <Fragment key={`analyze-${id}`}>
                        <Box>
                            <Typography variant="h6" sx={{ mb: 1 }}>Reason for match: {reason}</Typography>
                            <Typography variant="body1">{title}</Typography>
                            <Typography variant="body2">{artist.title}</Typography>
                        </Box>
                        <Box key={id} sx={{ display: 'flex', gap: 2 }}>
                            <Box>
                                <Typography variant="body1">Artist</Typography>
                                <Typography variant="body2">Match: {matching.artist.match ? "Yes" : "No"}</Typography>
                                <Typography variant="body2">Contains: {matching.artist.contains ? "Yes" : "No"}</Typography>
                                <Typography variant="body2">Similarity: {getRoundedSimilarity(matching.artist.similarity)}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="body1">Artist in Title</Typography>
                                <Typography variant="body2">Match: {matching.artistInTitle.match ? "Yes" : "No"}</Typography>
                                <Typography variant="body2">Contains: {matching.artistInTitle.contains ? "Yes" : "No"}</Typography>
                                <Typography variant="body2">Similarity: {getRoundedSimilarity(matching.artistInTitle.similarity)}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="body1">Artist with Title</Typography>
                                <Typography variant="body2">Match: {matching.artistWithTitle.match ? "Yes" : "No"}</Typography>
                                <Typography variant="body2">Contains: {matching.artistWithTitle.contains ? "Yes" : "No"}</Typography>
                                <Typography variant="body2">Similarity: {getRoundedSimilarity(matching.artistWithTitle.similarity)}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="body1">Title</Typography>
                                <Typography variant="body2">Match: {matching.title.match ? "Yes" : "No"}</Typography>
                                <Typography variant="body2">Contains: {matching.title.contains ? "Yes" : "No"}</Typography>
                                <Typography variant="body2">Similarity: {getRoundedSimilarity(matching.title.similarity)}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="body1">Album</Typography>
                                <Typography variant="body2">Match: {matching.album.match ? "Yes" : "No"}</Typography>
                                <Typography variant="body2">Contains: {matching.album.contains ? "Yes" : "No"}</Typography>
                                <Typography variant="body2">Similarity: {getRoundedSimilarity(matching.album.similarity)}</Typography>
                            </Box>
                        </Box>
                        <Divider sx={{ mb: 1, mt: 1 }} />
                    </Fragment>
                })}
            </>
        }
    </>
    )
}