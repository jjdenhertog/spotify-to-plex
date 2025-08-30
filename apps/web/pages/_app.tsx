import "@/styles/app.scss";
import createEmotionCache from '@/utils/createEmotionCache';
import { CacheProvider } from '@emotion/react';
import CssBaseline from '@mui/material/CssBaseline';
import { createTheme, ThemeProvider } from "@mui/material/styles";
import type { AppProps } from 'next/app';
import Head from 'next/head';

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache();

const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#edaf07',
        },
        secondary: {
            main: '#cccccc',
        }
    },
    typography: {
        fontFamily: 'Noto Sans',
        h1: {
            fontSize: "1.2em",
            lineHeight: "1.4em",
            fontWeight: 400
        },
        h2: {
            fontSize: "1.15em",
            lineHeight: "1.4em",
            fontWeight: 300
        },
        body1: {
            fontSize: '.95em',
            lineHeight: "1.2em",
            fontWeight: 200
        },
        body2: {
            lineHeight: "1.4em",
            fontWeight: 200
        }
    },
    components: {
        MuiPaper: {

        },
        MuiTooltip: {
            defaultProps: {
                arrow: true,
                enterDelay: 0,
                placement: "top",
            }
        },
        MuiTabs: {
            styleOverrides: {
                root: {
                    backgroundColor: 'transparent'
                }
            }
        },
        MuiTab: {
            styleOverrides: {
                root: {
                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                }
            }
        },
        MuiButton: {
            defaultProps: {
                variant: 'outlined'
            },
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 300,
                }
            }
        },
        MuiModal: {
            styleOverrides: {
                backdrop: {
                    backdropFilter: 'none',
                    backgroundColor: 'rgba(0,0,0,0.7)'
                }
            }
        }
    }
});

export default function App({
    Component,
    pageProps,
    emotionCache = clientSideEmotionCache
}: AppProps & { readonly emotionCache?: any }) {
    return (
        <CacheProvider value={emotionCache}>
            <Head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />
                <meta name="viewport" content="initial-scale=1, width=device-width" />
                <meta name="HandheldFriendly" content="True" />
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="MobileOptimized" content="320" />
                <style>{`:root { color-scheme: dark; }`}</style>
            </Head>
            <ThemeProvider theme={theme}>
                <CssBaseline  />
                <Component {...pageProps} />
            </ThemeProvider>
        </CacheProvider>
    )
}
