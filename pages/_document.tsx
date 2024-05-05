import { getInitColorSchemeScript } from '@mui/joy';
import { Head, Html, Main, NextScript } from 'next/document';
export default function MyDocument() {

    return (
        <Html data-color-scheme="dark">
            <Head>
                <link rel="icon" type="image/png" sizes="32x32" href="/img/favicon-32x32.png" />
                <link rel="icon" type="image/png" sizes="16x16" href="/img/favicon-16x16.png" />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" />
                <link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@100;200;300;400;500&display=swap" rel="stylesheet"></link>
            </Head>
            <body>
                {getInitColorSchemeScript({ defaultMode: 'system' })}
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}