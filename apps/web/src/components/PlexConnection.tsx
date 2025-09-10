import { errorBoundary } from "@/helpers/errors/errorBoundary";
import { LoadingButton } from '@mui/lab';
import { Alert, Box, ListItem, MenuItem, Select, Typography } from "@mui/material";
import { SelectChangeEvent } from '@mui/material/Select';
import axios from "axios";
import { enqueueSnackbar } from "notistack";
import { Dispatch, SetStateAction, useCallback, useEffect, useState } from "react";

import { GetAuthUrlResponse } from "../../pages/api/auth/url";
import { GetPlexResourcesResponse } from "../../pages/api/plex/resources";
import { GetSettingsResponse } from "../../pages/api/settings";

type Props = {
    readonly settings?: GetSettingsResponse
    readonly setSettings: Dispatch<SetStateAction<GetSettingsResponse | undefined>>

    readonly connected?: boolean
    readonly setConnected: Dispatch<boolean>
}

const PlexConnection = (props: Props) => {
    const { settings, setSettings, connected, setConnected } = props;

    const [validated, setValidated] = useState<boolean>(false);
    const [resources, setResources] = useState<GetPlexResourcesResponse[]>([]);

    const [loading, setLoading] = useState<boolean>(true);
    const [newPlexUri, setNewPlexUri] = useState<string | null>(settings?.uri || null);
    const [saving, setSaving] = useState<boolean>(false);
    const [creatingUrl, setCreatingUrl] = useState<boolean>(false);

    const onPlexUriChange = useCallback((e: SelectChangeEvent) => {
        setNewPlexUri(e.target.value)
    }, []);

    useEffect(() => {
        if (settings?.uri) {
            setNewPlexUri((prev) => {
                if (prev === settings.uri || !prev)
                    return prev;

                return settings.uri || "";
            });
        }
    }, [settings?.uri]);

    const onPlexLoginClick = useCallback(() => {
        setCreatingUrl(true);
        errorBoundary(async () => {
            const result = await axios.post<GetAuthUrlResponse>('/api/auth/url', {
                callback: window.location.href
            });
            if (top)
                top.location.href = result.data.authUrl;
        }, () => {
            setCreatingUrl(false);
        });
    }, []);

    const onSaveClick = useCallback(() => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        errorBoundary(async () => {
            setSaving(true);
            setValidated(false);


            const [resource] = resources.filter(item => item.connections.some(connection => connection.uri === newPlexUri));
            if (!resource)
                throw new Error("Something went wrong selecting the resource");

            const settings = await axios.post<GetSettingsResponse>("/api/settings", {
                uri: newPlexUri,
                id: resource.id
            });

            try {
                await axios.post("/api/plex/search", { query: "x", limit: 3 }, { signal: controller.signal });
                clearTimeout(timeoutId);
                setValidated(true);
                setSettings(settings.data);

                enqueueSnackbar("Plex server selected and verified", { variant: "success" });
            } catch (_e) {
            }
            setSaving(false);
        }, () => {
            clearTimeout(timeoutId);
            setSaving(false);
        });
    }, [newPlexUri, resources, setSettings]);

    useEffect(() => {
        if (!connected) {
            setLoading(false);

            return;
        }

        if (!settings) {
            setLoading(false);

            return;
        }

        setLoading(true);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        errorBoundary(async () => {
            const resources = await axios.get<GetPlexResourcesResponse[]>("/api/plex/resources");
            setResources(resources.data);
            setConnected(true);

            if (settings.uri) {
                try {
                    await axios.post("/api/plex/search", { query: "x", limit: 3 }, { signal: controller.signal });
                    setValidated(true);
                } catch (_error) {
                    setValidated(false);
                    // Plex server connection validation failed - handled by UI error state
                }
            }

            setLoading(false);
            clearTimeout(timeoutId);
        }, () => {
            setLoading(false);
            clearTimeout(timeoutId);
        }, true);

    }, [connected, setConnected, settings]);

    const saveDisabled = !(newPlexUri && settings?.uri !== newPlexUri);

    if (loading) {
        return <Box display="flex" justifyContent="center">
            <Alert severity="info" sx={{ ml: 2 }}>
                Checking your connection with Plex
            </Alert>
        </Box>
    }

    // Show login prompt if not connected to Plex
    if (!connected) {
        return (
            <Box textAlign="center">
                <Typography variant="h5" sx={{ mb: 2 }}>Connect to Plex</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                    You need to login to Plex to continue.
                </Typography>
                <LoadingButton loading={creatingUrl} onClick={onPlexLoginClick} variant="contained" color="primary">Login to Plex</LoadingButton>
            </Box>
        );
    }

    return (
        <Box textAlign="center">
            <Typography variant="h5" sx={{ mb: 2 }}>Select Plex Server</Typography>
            {resources.length === 0 ? (
                <Alert variant="outlined" severity="error">
                    We didn&apos;t find Plex Media Servers on your account.
                </Alert>
            ) : (
                <>
                    <Typography sx={{ mb: 2 }} variant="body1">
                        Select and test the connection that you would like to use.
                    </Typography>
                    <Box maxWidth={400} margin="0 auto" textAlign="left">
                        <Select fullWidth value={newPlexUri || ''} onChange={onPlexUriChange}>
                            {resources.map(item => {
                                if (item.connections.length < 2) return null;

                                return [
                                    <ListItem key={`header-${item.name}`}>
                                        <Typography variant="caption" sx={{ textTransform: 'uppercase' }}>{item.name}</Typography>
                                    </ListItem>,
                                    ...item.connections.map(connection => (
                                        <MenuItem key={connection.uri} value={connection.uri}>{connection.uri}</MenuItem>
                                    ))
                                ];
                            })}
                        </Select>

                        {!!connected && !saving && !validated && settings?.uri ? <Alert variant="outlined" severity="error" sx={{ mt: 2 }}>
                            We can&apos;t connect to the selected Plex Media Server
                        </Alert> : null}
                        {!!connected && !saving && validated && settings?.uri ? <Alert variant="outlined" severity="success" sx={{ mt: 2 }}>
                            We&apos;re connected to the selected Plex Media Server
                        </Alert> : null}

                    </Box>



                    <Box mt={2}>
                        <LoadingButton disabled={saveDisabled} loading={saving} color="primary" onClick={onSaveClick} variant="contained">Save connection</LoadingButton>
                    </Box>
                </>
            )}
        </Box>
    );
};

export default PlexConnection; 