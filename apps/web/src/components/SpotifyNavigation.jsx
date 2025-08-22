import { Assignment, People, PlaylistPlay, Search } from "@mui/icons-material";
import { Box, Tab, Tabs } from "@mui/material";
import { useRouter } from "next/router";
import { useCallback } from "react";
const navigationItems = [
    {
        label: 'Playlists & Albums',
        path: '/spotify/manage-playlists',
        icon: <PlaylistPlay sx={{ fontSize: 20 }}/>
    },
    {
        label: 'Users',
        path: '/spotify/manage-users',
        icon: <People sx={{ fontSize: 20 }}/>
    },
    {
        label: 'Search Analyzer',
        path: '/spotify/search-analyzer',
        icon: <Search sx={{ fontSize: 20 }}/>
    },
    {
        label: 'Logs',
        path: '/spotify/logs',
        icon: <Assignment sx={{ fontSize: 20 }}/>
    }
];
const SpotifyNavigation = () => {
    const router = useRouter();
    const currentPath = router.pathname;
    const onChange = useCallback((_event, value) => {
        router.push(navigationItems[value].path);
    }, [router]);
    return (<Box sx={{
            borderBottom: 1,
            borderColor: 'divider',
            mt: 3,
            mb: 1,
            display: 'flex',
            justifyContent: 'center'
        }}>
            <Tabs value={navigationItems.findIndex(item => item.path === currentPath)} onChange={onChange} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile>
                {navigationItems.map((item) => (<Tab key={item.path} label={item.label} icon={item.icon} iconPosition="start" sx={{
                minHeight: 48,
                maxHeight: 48,
            }}/>))}
            </Tabs>
        </Box>);
};
export default SpotifyNavigation;
//# sourceMappingURL=SpotifyNavigation.jsx.map