/* eslint-disable unicorn/prefer-blob-reading-methods */
import Logo from "@/components/Logo"
import MatchFilterEditor from "@/components/MatchFilterEditor"
import HowItWorksTab from "@/components/HowItWorksTab"
import TextProcessingAndSearchEditor from "@/components/TextProcessingAndSearchEditor"
import TestConfigurationTab from "@/components/TestConfigurationTab"
import { errorBoundary } from "@/helpers/errors/errorBoundary"
import MainLayout from "@/layouts/MainLayout"
import { ChevronLeft, Download, Restore, Upload } from "@mui/icons-material"
import { LoadingButton } from "@mui/lab"
// prettier-ignore
import { Box, Breadcrumbs, Button, Card, CardContent, Container, Dialog, DialogActions, DialogContent, DialogTitle, Link, Paper, Tab, Tabs, TextField, Typography } from "@mui/material"
import axios from "axios"
import { NextPage } from "next"
import Head from "next/head"
import { useRouter } from "next/router"
import { enqueueSnackbar } from "notistack"
import { useCallback, useEffect, useRef, useState } from "react"

// Tab key type definition
type TabKey = 'how-it-works' | 'processing' | 'match-filters' | 'test'

// Define tab mappings outside component to avoid useEffect dependency issues
const TAB_KEY_TO_INDEX: Record<TabKey, number> = {
    'how-it-works': 0,
    'processing': 1,
    'match-filters': 2,
    'test': 3
}

const INDEX_TO_TAB_KEY: Record<number, TabKey> = {
    0: 'how-it-works',
    1: 'processing', 
    2: 'match-filters',
    3: 'test'
}

const isValidTabKey = (key: string): key is TabKey => {
    return ['how-it-works', 'processing', 'match-filters', 'test'].includes(key as TabKey)
}

const Page: NextPage = () => {
    const router = useRouter()
    const [tabValue, setTabValue] = useState(0)
    const [resetting, setResetting] = useState(false)
    const [importDialog, setImportDialog] = useState(false)
    const [importJson, setImportJson] = useState("")
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Initialize tab from URL on component mount
    useEffect(() => {
        const urlTab = router.query.tab as string
        if (urlTab && isValidTabKey(urlTab)) {
            setTabValue(TAB_KEY_TO_INDEX[urlTab])
        } else if (!router.query.tab) {
            // Default to first tab and update URL
            router.replace('/plex/music-search-config?tab=how-it-works', undefined, { shallow: true })
        }
    }, [router.query.tab, router])

    const resetConfiguration = useCallback(() => {
        setResetting(true)
        errorBoundary(
            async () => {
                await axios.post("/api/plex/music-search-config/reset")
                enqueueSnackbar("Configuration reset to defaults", { variant: "info" })
                setResetting(false)
                // Refresh the page to reload all components
                window.location.reload()
            },
            () => {
                setResetting(false)
            }
        )
    }, [])

    const exportConfiguration = useCallback(() => {
        errorBoundary(async () => {
            const [matchFilters, textProcessing, searchApproaches] = await Promise.all([
                axios.get("/api/plex/music-search-config/match-filters"),
                axios.get("/api/plex/music-search-config/text-processing"),
                axios.get("/api/plex/music-search-config/search-approaches")
            ])

            const config = {
                matchFilters: matchFilters.data,
                textProcessing: textProcessing.data,
                searchApproaches: searchApproaches.data,
                exportedAt: new Date().toISOString(),
                version: "2.0.0"
            }

            const dataStr = JSON.stringify(config, null, 2)
            const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`

            const exportFileDefaultName = `music-search-config-${new Date().toISOString()
                .split("T")[0]}.json`

            const linkElement = document.createElement("a")
            linkElement.setAttribute("href", dataUri)
            linkElement.setAttribute("download", exportFileDefaultName)
            linkElement.click()

            enqueueSnackbar("Configuration exported successfully", { variant: "success" })
        })
    }, [])

    const importConfiguration = useCallback(() => {
        if (fileInputRef.current) {
            fileInputRef.current.click()
        }
    }, [])

    const handleFileImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (e) => {
                const content = e.target?.result as string
                setImportJson(content)
                setImportDialog(true)
            }
            reader.readAsText(file)
        }

        // Reset the input value so the same file can be imported again
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }, [])

    const handleImportConfirm = useCallback(() => {
        errorBoundary(async () => {
            try {
                const config = JSON.parse(importJson)

                // Import each configuration section
                if (config.matchFilters) {
                    await axios.post("/api/plex/music-search-config/match-filters", config.matchFilters)
                }

                if (config.textProcessing) {
                    await axios.post("/api/plex/music-search-config/text-processing", config.textProcessing)
                }

                if (config.searchApproaches) {
                    await axios.post("/api/plex/music-search-config/search-approaches", config.searchApproaches)
                }

                enqueueSnackbar("Configuration imported successfully", { variant: "success" })
                setImportDialog(false)

                // Refresh the page to reload all components
                setTimeout(() => window.location.reload(), 500)
            } catch (error) {
                enqueueSnackbar(
                    `Failed to import configuration: ${error instanceof Error ? error.message : "Invalid JSON"}`,
                    { variant: "error" }
                )
            }
        })
    }, [importJson])

    const handleTabChange = useCallback((_event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue)
        const tabKey = INDEX_TO_TAB_KEY[newValue]
        router.push(`/plex/music-search-config?tab=${tabKey}`, undefined, { shallow: true })
    }, [router])

    const handleCloseImportDialog = useCallback(() => setImportDialog(false), [])
    const handleImportJsonChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => setImportJson(e.target.value),
        []
    )

    return (
        <>
            <Head>
                <title>
                    Music Search Configuration - Spotify to Plex
                </title>
            </Head>
            <MainLayout maxWidth="1200px">
                <Container>
                    <Logo  />
                    <Paper elevation={0} sx={{ p: 2, bgcolor: "action.hover", mb: 3 }}>
                        <Breadcrumbs sx={{ mb: 2 }}>
                            <Link href="/" underline="hover" color="inherit">Home</Link>
                            <Typography color="text.primary">
                                Music Search Configuration
                            </Typography>
                        </Breadcrumbs>

                        <Button component="a" href="/" variant="outlined" color="inherit" size="small" startIcon={<ChevronLeft />}>
                            Back to Home
                        </Button>

                        <Typography variant="h4" sx={{ mt: 2, mb: 0.5 }}>
                            Music Search Configuration
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 2, maxWidth: 600 }}>
                            Configure how the system matches songs between Spotify and Plex. Use the &ldquo;How It Works&rdquo; tab 
                            to understand the system, then configure your settings and test them immediately.
                        </Typography>

                        <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
                            <LoadingButton loading={resetting} onClick={resetConfiguration} variant="outlined" color="warning" startIcon={<Restore />}>
                                Reset All to Defaults
                            </LoadingButton>

                            <Button onClick={exportConfiguration} variant="outlined" startIcon={<Download />}>
                                Export Configuration
                            </Button>

                            <Button onClick={importConfiguration} variant="outlined" startIcon={<Upload />}>
                                Import Configuration
                            </Button>

                            <input ref={fileInputRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleFileImport} />
                        </Box>
                    </Paper>

                    <Box>
                        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }} variant="scrollable" scrollButtons="auto">
                            <Tab label="How It Works" />
                            <Tab label="Text Processing & Search Approaches" />
                            <Tab label="Match Filters" />
                            <Tab label="Test Configuration" />
                        </Tabs>

                        {/* How It Works Tab */}
                        {tabValue === 0 && (
                            <Card>
                                <CardContent>
                                    <HowItWorksTab />
                                </CardContent>
                            </Card>
                        )}

                        {/* Text Processing & Search Tab */}
                        {tabValue === 1 && (
                            <Card>
                                <CardContent>
                                    <TextProcessingAndSearchEditor />
                                </CardContent>
                            </Card>
                        )}

                        {/* Match Filters Tab */}
                        {tabValue === 2 && (
                            <Card>
                                <CardContent>
                                    <MatchFilterEditor  />
                                </CardContent>
                            </Card>
                        )}

                        {/* Test Configuration Tab */}
                        {tabValue === 3 && (
                            <Card>
                                <CardContent>
                                    <TestConfigurationTab />
                                </CardContent>
                            </Card>
                        )}
                    </Box>

                    {/* Import Configuration Dialog */}
                    <Dialog open={importDialog} onClose={handleCloseImportDialog} maxWidth="md" fullWidth>
                        <DialogTitle>
                            Import Configuration
                        </DialogTitle>
                        <DialogContent>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                                Review the configuration below before importing. This will overwrite your current
                                settings.
                            </Typography>
                            <TextField
                                fullWidth
                                multiline
                                rows={15}
                                value={importJson}
                                onChange={handleImportJsonChange}
                                variant="outlined"
                                sx={{
                                    "& .MuiInputBase-input": {
                                        fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                                        fontSize: "0.875rem"
                                    }
                                }}
                            />
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleCloseImportDialog}>Cancel</Button>
                            <Button onClick={handleImportConfirm} variant="contained" color="primary">
                                Import Configuration
                            </Button>
                        </DialogActions>
                    </Dialog>
                </Container>
            </MainLayout>
        </>
    )
}

export default Page
