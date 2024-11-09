import "@/styles/app.scss";
import { CssVarsProvider, extendTheme } from "@mui/joy";
import type { AppProps } from 'next/app';
import Head from 'next/head';

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {

    const customTheme = extendTheme({
        fontFamily: {
            display: 'Noto Sans', // applies to `h1`–`h4`
            body: 'Noto Sans', // applies to `title-*` and `body-*`
        },
        typography: {
            "body-lg": {
                fontWeight: 200,
                fontSize: '1.2em'
            },
            "body-md": {
                fontSize: '.95em',
                lineHeight: "1.2em",
                fontWeight: 200
            },
            "body-sm": {
                lineHeight: "1.4em",
                fontWeight: 200
            },
            "body-xs": {
                lineHeight: "1.4em",
                fontWeight: 200
            },
            h1: {
                fontSize: "1.2em",
                lineHeight: "1.4em",
                fontWeight: 400
            },
            h2: {
                fontSize: "1.15em",
                lineHeight: "1.4em",
                fontWeight: 300
            }
        },
        components: {
            JoyTooltip: {
                defaultProps: {
                    size: "sm",
                    color: "primary",
                    enterDelay: 0,
                    arrow: true,
                    placement: "top",
                }
            },
            JoyTabs: {
                styleOverrides: {
                    root: {
                        background: 'none'
                    }
                }
            },
            JoyTab: {
                styleOverrides: {
                    root: {
                        background: 'var(--joy-palette-background-surface)'
                    }
                }
            },
            JoyTabPanel: {
                styleOverrides: {
                    root: {
                        background: 'var(--joy-palette-background-surface)'
                    }
                }
            },
            JoyButton: {
                styleOverrides: {
                    root: {
                        fontWeight: 300,
                    }
                }
            },
            JoyInput: {
                styleOverrides: {
                    root: {
                    }
                }
            },
            JoyModal: {
                styleOverrides: {
                    root: {
                        '& .MuiModal-backdrop': {
                            backdropFilter: 'none',
                            background: 'rgba(0,0,0,0.7)'
                        }
                    }
                }
            }
        }
    });

    return (
        <>
            <Head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />
                <meta name="viewport" content="initial-scale=1, width=device-width" />
                <meta name="HandheldFriendly" content="True" />
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="MobileOptimized" content="320" />
                <style>{`:root { color-scheme: dark; }`}</style>
            </Head>
            <CssVarsProvider
                defaultMode="system"
                // the local storage key to use.
                modeStorageKey="plex-openai-system-mode"
                // set as root provider
                disableNestedContext
                theme={customTheme}
            >
                <Component {...pageProps} />
            </CssVarsProvider>
        </>
    )
}
