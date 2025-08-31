import { errorBoundary } from "@/helpers/errors/errorBoundary"
import { SavedItem } from "@/types/SavedItem"
// MIGRATED: Updated to use shared types package
import { Close, QueueMusic, Settings, Sync, SyncDisabled } from "@mui/icons-material"
import { Box, IconButton, Paper, Tooltip, Typography } from "@mui/material"
import axios from "axios"
import { enqueueSnackbar } from "notistack"
import { useCallback, useMemo, useState } from "react"
import { useIsSelected, useSelectionEvent } from "react-selection-manager"
import { confirm } from "./ConfirmProvider/ConfirmProvider"
import PlaylistItemSettings from "./PlaylistSyncSettings"

type Props = {
    readonly item: SavedItem,
    readonly orderedIds: string[],
    readonly labels: string[],
    readonly reloadSavedItems: () => void
}
export default function ManagePlaylistItem(props: Props) {
    const { item, orderedIds, labels, reloadSavedItems } = props;
    const layerSelected = useIsSelected(item.id)
    const onSelect = useSelectionEvent();

    const onCheckboxChange = useCallback((e: React.MouseEvent<HTMLSpanElement>) => {
        onSelect({
            id: item.id,
            type: "playlist",
            shiftKey: e.shiftKey,
            metaKey: e.metaKey,
            orderedIds
        });

    }, [item.id, onSelect, orderedIds])

    ///////////////////////////////
    // Settings Item
    ///////////////////////////////
    const [editItem, setEditItem] = useState(false)
    const onEditItemClick = useCallback((e: React.SyntheticEvent) => {
        e.preventDefault()
        e.stopPropagation();

        setEditItem(true)
    }, [])
    const onCloseEditItem = useCallback((reload?: boolean) => {
        setEditItem(false)
        if (reload)
            reloadSavedItems()
    }, [reloadSavedItems])

    ///////////////////////////////
    // Delete Item
    ///////////////////////////////
    const onDeleteItemClick = useCallback((e: React.SyntheticEvent) => {
        e.preventDefault()
        e.stopPropagation();

        errorBoundary(async () => {
            await confirm({
                title: 'Delete item',
                content: 'Are you sure you want to delete this item?',
            })

            await axios.delete<SavedItem[]>(`/api/saved-items?id=${item.id}`)
            reloadSavedItems()
            enqueueSnackbar(`Item removed`)
        })

    }, [item, reloadSavedItems])

    ///////////////////////////////////////////////
    // Styles
    ///////////////////////////////////////////////

    const paperStyles = useMemo(() => {

        const styles = {
            p: 1,

            mb: 1,
            height: 75,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            userSelect: 'none',
            justifyContent: 'space-between',
            gap: 1,
            cursor: 'pointer',
            bgcolor: 'background.paper',
            position: 'relative',
            border: '1px solid transparent'
        }

        if (layerSelected)
            styles.border = `1px solid #edaf07`


        return styles
    }, [layerSelected])

    const hoverBoxStyles = useMemo(() => ({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: 'rgba(0,0,0,0.7)',
        opacity: 0,
        transition: 'opacity 0.2s',
        '&:hover': {
            opacity: 1
        }
    }), [])

    return (
        <>
            <Paper elevation={layerSelected ? 3 : 1} key={item.id} sx={paperStyles} onClick={onCheckboxChange}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }} >
                    <Box component="img" src={item.image} height={40} />
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body1" sx={{ mb: .5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</Typography>
                        <Box sx={{ display: 'flex', gap: .5, alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                {item.type !== 'plex-media' && (
                                    <Tooltip title={item.sync ? `Automatically synced every ${item.sync_interval ?? "1"} days` : "Not automatically synced"}>
                                        {item.sync ?
                                            <Sync sx={{ fontSize: '1.2em', color: 'text.secondary' }} /> :
                                            <SyncDisabled sx={{ fontSize: '1.2em', color: 'text.secondary' }} />
                                        }
                                    </Tooltip>
                                )}
                            </Box>
                        </Box>
                    </Box>
                </Box>
                <Box sx={hoverBoxStyles}>
                    {item.type !== 'plex-media' &&
                        <>
                            <Tooltip title="Open Plex importer"><IconButton component='a' color="primary" size="small" href={`/import/${item.id}`}><QueueMusic sx={{ fontSize: '1em' }} /></IconButton></Tooltip>
                            <Tooltip title="Settings"><IconButton data-id={item.id} onClick={onEditItemClick} size="small" ><Settings sx={{ fontSize: '1em' }} /></IconButton></Tooltip>
                        </>
                    }
                    <Tooltip title="Delete item"><IconButton data-id={item.id} onClick={onDeleteItemClick} size="small" ><Close sx={{ fontSize: '1em' }} /></IconButton></Tooltip>
                </Box>
            </Paper>

            {!!editItem && <PlaylistItemSettings items={[item]} labels={labels} onClose={onCloseEditItem} />}
        </>
    )
}