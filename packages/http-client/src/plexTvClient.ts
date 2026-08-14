import axios from "axios";

/**
 * Shared client for the plex.tv cloud API (https://plex.tv/api/v2).
 *
 * plex.tv only serves JSON when Accept is *exactly* "application/json". Axios
 * sends "application/json, text/plain, *\/*" by default, and that trailing
 * *\/* is enough for plex.tv to fall back to XML — so `response.data` arrives
 * as an unparsed XML string wherever the code expects an object.
 *
 * Note this differs from the Plex Media Server itself, which negotiates the
 * default header correctly and returns JSON; only plex.tv needs the explicit
 * header. See AxiosRequest for the media-server client.
 *
 * Always use this instance for plex.tv requests so the header cannot be
 * forgotten at a new call site.
 */
export const plexTvClient = axios.create({
    headers: {
        Accept: "application/json"
    }
});
