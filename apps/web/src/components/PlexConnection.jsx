import { errorBoundary } from "@/helpers/errors/errorBoundary";
import { LoadingButton } from '@mui/lab';
import { Alert, Box, ListItem, MenuItem, Select, Typography } from "@mui/material";
import axios from "axios";
import { enqueueSnackbar } from "notistack";
import { useCallback, useEffect, useState } from "react";
const PlexConnection = (props) => {
    const { settings, setSettings, connected, setConnected } = props;
    const [validated, setValidated] = useState(false);
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newPlexUri, setNewPlexUri] = useState(settings?.uri || null);
    const [saving, setSaving] = useState(false);
    const onPlexUriChange = useCallback((e) => {
        setNewPlexUri(e.target.value);
    }, []);
    const onSaveClick = useCallback(() => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        errorBoundary(async () => {
            setSaving(true);
            setValidated(false);
            const [resource] = resources.filter(item => item.connections.some(connection => connection.uri == newPlexUri));
            if (!resource)
                throw new Error("Something went wrong selecting the resource");
            const settings = await axios.post("/api/settings", {
                uri: newPlexUri,
                id: resource.id
            });
            try {
                await axios.post("api/plex/search", { query: "x", limit: 3 }, { signal: controller.signal });
                clearTimeout(timeoutId);
                setValidated(true);
                setSettings(settings.data);
                enqueueSnackbar("Plex server selected and verified verified", { variant: "success" });
            }
            catch (_e) {
            }
            setSaving(false);
        }, () => {
            clearTimeout(timeoutId);
            setSaving(false);
        });
    }, [newPlexUri, resources, setSettings]);
    useEffect(() => {
        if (!settings) {
            setLoading(false);
            return;
        }
        setLoading(true);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        errorBoundary(async () => {
            const resources = await axios.get("/api/plex/resources");
            setResources(resources.data);
            setConnected(true);
            if (settings.uri) {
                await axios.post("api/plex/search", { query: "x", limit: 3 }, { signal: controller.signal });
                setValidated(true);
            }
            setLoading(false);
            clearTimeout(timeoutId);
        }, () => {
            setLoading(false);
            clearTimeout(timeoutId);
        }, true);
    }, [setConnected, settings]);
    const saveDisabled = !(newPlexUri && settings?.uri != newPlexUri);
    if (loading) {
        return <Box display="flex" justifyContent="center">
            <Alert severity="info" sx={{ ml: 2 }}>
                Checking your connection with Plex
            </Alert>
        </Box>;
    }
    return (<Box textAlign="center">
            <Typography variant="h5" sx={{ mb: 2 }}>
                Select Plex Server
            </Typography>
            {resources.length === 0 ? (<Alert variant="outlined" severity="error">
                    We didn&apos;t find Plex Media Servers on your account.
                </Alert>) : (<>
                    <Typography sx={{ mb: 2 }} variant="body1">
                        Select and test the connection that you would like to use.
                    </Typography>
                    <Box maxWidth={400} margin="0 auto" textAlign="left">
                        <Select fullWidth value={newPlexUri || ''} onChange={onPlexUriChange}>
                            {resources.map(item => {
                if (item.connections.length < 2)
                    return null;
                return [
                    <ListItem key={`header-${item.name}`}>
                                        <Typography variant="caption" sx={{ textTransform: 'uppercase' }}>
                                            {item.name}
                                        </Typography>
                                    </ListItem>,
                    ...item.connections.map(connection => (<MenuItem key={connection.uri} value={connection.uri}>
                                            {connection.uri}
                                        </MenuItem>))
                ];
            })}
                        </Select>

                        {connected && !saving && !validated && settings?.uri ? <Alert variant="outlined" severity="error" sx={{ mt: 2 }}>
                            We can&apos;t connect to the selected Plex Media Server
                        </Alert> : null}
                        {connected && !saving && validated && settings?.uri ? <Alert variant="outlined" severity="success" sx={{ mt: 2 }}>
                            We&apos;re connected to the selected Plex Media Server
                        </Alert> : null}

                    </Box>



                    <Box mt={2}>
                        <LoadingButton disabled={saveDisabled} loading={saving} color="primary" onClick={onSaveClick} variant="contained">
                            Save connection
                        </LoadingButton>
                    </Box>
                </>)}
        </Box>);
};
export default PlexConnection;
//# sourceMappingURL=PlexConnection.jsx.map