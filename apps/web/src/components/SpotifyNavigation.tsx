import { Assignment, People, PlaylistPlay } from "@mui/icons-material";
import { Box, Tab, Tabs } from "@mui/material";
import { useRouter } from "next/router";
import { useCallback } from "react";

const navigationItems = [
    {
        label: 'Playlists & Albums',
        path: '/spotify/manage-playlists',
        icon: <PlaylistPlay sx={{ fontSize: 20 }} />
    },
    {
        label: 'Users',
        path: '/spotify/manage-users',
        icon: <People sx={{ fontSize: 20 }} />
    },
    {
        label: 'Logs',
        path: '/spotify/logs',
        icon: <Assignment sx={{ fontSize: 20 }} />
    }
];


export default function SpotifyNavigation() {
    const router = useRouter();
    const currentPath = router.pathname;

    const onChange = useCallback((_event: React.SyntheticEvent, value: number) => {
        const item = navigationItems[value];
        if (item?.path) {
            router.push(item.path);
        }
    }, [router]);

    return (
        <Box
            sx={{
                borderBottom: 1,
                borderColor: 'divider',
                mt: 3,
                mb: 1,
                display: 'flex',
                justifyContent: 'center'
            }}>
            <Tabs value={navigationItems.findIndex(item=> item.path===currentPath)} onChange={onChange} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile>
                {navigationItems.map((item) => (
                    <Tab key={item.path} label={item.label} icon={item.icon} iconPosition="start" sx={{ minHeight: 48, maxHeight: 48 }} />
                ))}
            </Tabs>
        </Box>
    );
}