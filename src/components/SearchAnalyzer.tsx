import { errorBoundary } from "@/helpers/errors/errorBoundary";
import { GetSpotifyTrackResponse } from "@/pages/api/spotify/track";
import { SearchResponse } from "@jjdenhertog/plex-music-search";
import { KeyboardArrowRightSharp } from "@mui/icons-material";
import { Box, Button, Divider, Input, Link, Typography } from "@mui/joy";
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

            const result = await axios.post<SearchResponse>('/api/plex/analyze', { item: spotifyTrack.data })
            setSearchResponse(result.data)
        }, () => {
            setLoading(false)
        })

    }, [spotifyURI])

    const getRoundedSimilarity = (value: number) => {
        return `${Math.round(value * 100)}%`
    }


    return (<>
        <Typography mb={.5} level="body-md">It can happen that songs are not matching (correctly). To find out if and why songs are matching you can use this page. Please share a screenshot of this page when <Link href="https://github.com/jjdenhertog/spotify-to-plex/issues" target="_blank" sx={{ m: 0, p: 0 }} color="warning">submitting a issue at GitHub</Link>.</Typography>

        <Divider sx={{ mt: 2, mb: 2 }} />
        <Typography mb={1} level="h2">Spotify Track Link</Typography>
        <Typography level="body-md" mt={1} mb={.5} sx={{ fontSize: ".9em" }} startDecorator={<KeyboardArrowRightSharp sx={{ fontSize: "1.1em" }} />}>Spotify URL &#40;e.g. https://open.spotify.com/track/7KwZNVEaqikRSBSpyhXK2j &#41;</Typography>
        <Typography level="body-md" mb={1} sx={{ fontSize: ".9em" }} startDecorator={<KeyboardArrowRightSharp sx={{ fontSize: "1.1em" }} />}>Spotify URI &#40;e.g. spotify:track:7KwZNVEaqikRSBSpyhXK2j &#41;</Typography>
        <Input placeholder="Enter your Spotify URL/URI" disabled={loading} value={spotifyURI} onChange={onChangeSpotifyInput} />

        <Box mt={1}>
            <Button size="sm" disabled={loading || !spotifyURI} onClick={onAnalyseSongMatchClick}>Analyse Song Match</Button>
        </Box>

        {!!searchResponse &&
            <>

                <Divider sx={{ mb: 1, mt: 3 }} />
                {!!searchResponse.queries &&
                    <>
                        <Typography mb={1} level="h2">Search queries</Typography>
                        {searchResponse.queries?.map((item, index) => {

                            const { approach, album, artist, title } = item;
                            const id = `query-${index}`;

                            return <Box key={id}>
                                <Box display="flex" gap={1} alignItems="center">
                                    <Typography level="body-md">Approach</Typography>
                                    <Typography level="body-sm">{approach}</Typography>
                                </Box>
                                <Box display="flex" gap={1} alignItems="center">
                                    <Typography level="body-md">Artist</Typography>
                                    <Typography level="body-sm">{artist}</Typography>
                                </Box>
                                <Box display="flex" gap={1} alignItems="center">
                                    <Typography level="body-md">Title</Typography>
                                    <Typography level="body-sm">{title}</Typography>
                                </Box>
                                <Box display="flex" gap={1} alignItems="center">
                                    <Typography level="body-md">Album</Typography>
                                    <Typography level="body-sm">{album}</Typography>
                                </Box>
                                <Divider sx={{ mt: 1, mb: 1 }} />
                            </Box>
                        })
                        }
                    </>
                }
                {searchResponse.result.length > 0 &&
                    <Typography mb={1} level="h2">Search Results</Typography>
                }
                {searchResponse.result.map(item => {
                    const { title, artist, id, matching, reason } = item;

                    if (!matching)
                        return null;

                    return <Fragment key={`analyze-${id}`}>
                        <Box>
                            <Typography level="h2" mb={1}>Reason for match: {reason}</Typography>
                            <Typography level="body-md">{title}</Typography>
                            <Typography level="body-sm">{artist.title}</Typography>
                        </Box>
                        <Box key={id} sx={{ display: 'flex', gap: 2 }}>
                            <Box>
                                <Typography level="body-md">Artist</Typography>
                                <Typography level="body-sm">Match: {matching.artist.match ? "Yes" : "No"}</Typography>
                                <Typography level="body-sm">Contains: {matching.artist.contains ? "Yes" : "No"}</Typography>
                                <Typography level="body-sm">Similarity: {getRoundedSimilarity(matching.artist.similarity)}</Typography>
                            </Box>
                            <Box>
                                <Typography level="body-md">Artist in Title</Typography>
                                <Typography level="body-sm">Match: {matching.artistInTitle.match ? "Yes" : "No"}</Typography>
                                <Typography level="body-sm">Contains: {matching.artistInTitle.contains ? "Yes" : "No"}</Typography>
                                <Typography level="body-sm">Similarity: {getRoundedSimilarity(matching.artistInTitle.similarity)}</Typography>
                            </Box>
                            <Box>
                                <Typography level="body-md">Artist with Title</Typography>
                                <Typography level="body-sm">Match: {matching.artistWithTitle.match ? "Yes" : "No"}</Typography>
                                <Typography level="body-sm">Contains: {matching.artistWithTitle.contains ? "Yes" : "No"}</Typography>
                                <Typography level="body-sm">Similarity: {getRoundedSimilarity(matching.artistWithTitle.similarity)}</Typography>
                            </Box>
                            <Box>
                                <Typography level="body-md">Title</Typography>
                                <Typography level="body-sm">Match: {matching.title.match ? "Yes" : "No"}</Typography>
                                <Typography level="body-sm">Contains: {matching.title.contains ? "Yes" : "No"}</Typography>
                                <Typography level="body-sm">Similarity: {getRoundedSimilarity(matching.title.similarity)}</Typography>
                            </Box>
                            <Box>
                                <Typography level="body-md">Album</Typography>
                                <Typography level="body-sm">Match: {matching.album.match ? "Yes" : "No"}</Typography>
                                <Typography level="body-sm">Contains: {matching.album.contains ? "Yes" : "No"}</Typography>
                                <Typography level="body-sm">Similarity: {getRoundedSimilarity(matching.album.similarity)}</Typography>
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