import { errorBoundary } from "@/helpers/errors/errorBoundary";
import { Album, Close, QueueMusic, Settings } from "@mui/icons-material";
import { Box, Button, CircularProgress, IconButton, Paper, Tooltip, Typography } from "@mui/material";
import axios from "axios";
import { enqueueSnackbar } from "notistack";
import { useCallback, useEffect, useState } from "react";
import UserItems from "./UserItems";
import UserSyncSettings from "./UserSyncSettings";
export default function ManageUsers() {
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    useEffect(() => {
        errorBoundary(async () => {
            const result = await axios.get(`/api/spotify/users`);
            setUsers(result.data);
            setLoading(false);
        }, () => {
            setLoading(false);
        }, true);
    }, []);
    const onDeleteUserClick = useCallback((e) => {
        const { id } = e.currentTarget.dataset;
        if (id) {
            errorBoundary(async () => {
                const result = await axios.delete(`/api/spotify/users?id=${id}`);
                setUsers(result.data);
                enqueueSnackbar(`User removed`);
            });
        }
    }, []);
    /////////////////////////////
    // Set User
    /////////////////////////////
    const [editUser, setEditUser] = useState(null);
    const onSettingsUserClick = useCallback((e) => {
        const { id } = e.currentTarget.dataset;
        if (id) {
            const user = users.find(item => item.id == id);
            if (user)
                setEditUser(user);
        }
    }, [users]);
    const onEditUserClose = useCallback((reload) => {
        if (reload) {
            errorBoundary(async () => {
                const result = await axios.get(`/api/spotify/users`);
                setUsers(result.data);
            });
        }
        setEditUser(null);
    }, []);
    /////////////////////////////
    // Set User
    /////////////////////////////
    const [userItems, setUserItems] = useState(null);
    const onItemsUserClick = useCallback((e) => {
        const { id, type } = e.currentTarget.dataset;
        if (id && (type == "albums" || type == "playlists")) {
            const user = users.find(item => item.id == id);
            if (user)
                setUserItems({ user, type });
        }
    }, [users]);
    const onUserItemsClose = useCallback(() => {
        setUserItems(null);
    }, []);
    return (<>
        {loading ?
            <Box sx={{ textAlign: 'center', p: 2 }}><CircularProgress /></Box>
            :
                <>
                <Typography sx={{ mb: 0.5 }} variant="body1">When connecting users you can sync recent songs, saved playlists and albums.</Typography>

                {users.length > 0 ?
                        <>
                        <Typography variant="h6" sx={{ mt: 2, mb: 0.5 }}>Connected Spotify users</Typography>
                        {users.map(item => {
                                return <Paper variant="outlined" key={item.id} sx={{ p: 1, mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body1">{item.name}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
                                    <Tooltip title="Select albums to import"><IconButton data-id={item.id} data-type="albums" onClick={onItemsUserClick} size="small"><Album sx={{ fontSize: '1em' }}/></IconButton></Tooltip>
                                    <Tooltip title="Select playlists to import"><IconButton data-id={item.id} data-type="playlists" onClick={onItemsUserClick} size="small"><QueueMusic sx={{ fontSize: '1em' }}/></IconButton></Tooltip>
                                    <Tooltip title="Settings"><IconButton data-id={item.id} onClick={onSettingsUserClick} size="small"><Settings sx={{ fontSize: '1em' }}/></IconButton></Tooltip>
                                    <Tooltip title="Delete user"><IconButton data-id={item.id} onClick={onDeleteUserClick} color="error" size="small"><Close sx={{ fontSize: '1em' }}/></IconButton></Tooltip>
                                </Box>
                            </Paper>;
                            })}
                        <Box pt={1}>
                            <Typography variant="body2" sx={{ mb: 1 }}>You can add more users if you want. But make sure to first log out of spotify.com or open this window in an incognito window. Otherwise it will simply reconnect the last user.</Typography>
                            <Button size="small" variant="outlined" component="a" href="/api/spotify/login" sx={{ borderColor: "#1db954" }}>Add another user</Button>
                        </Box>
                    </>
                        :
                            <Button component="a" href="/api/spotify/login" size="small" variant="contained" sx={{ bgcolor: "#1db954", mt: 1, '&:hover': { bgcolor: "#1aa34a" } }}>Connect Spotify Account</Button>}


            </>}
        {!!editUser && <UserSyncSettings user={editUser} onClose={onEditUserClose}/>}
        {!!userItems && <UserItems user={userItems.user} type={userItems.type} onClose={onUserItemsClose}/>}
    </>);
}
//# sourceMappingURL=ManageUsers.jsx.map