import Document, { Head, Html, Main, NextScript } from 'next/document';
export default class MyDocument extends Document {
    render() {
        return (<Html data-color-scheme="dark">
                <Head>
                    <link rel="icon" type="image/png" sizes="32x32" href="/img/favicon-32x32.png"/>
                    <link rel="icon" type="image/png" sizes="16x16" href="/img/favicon-16x16.png"/>
                    <link rel="preconnect" href="https://fonts.googleapis.com"/>
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
                    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@100;200;300;400;500&display=swap" rel="stylesheet"/>
                </Head>
                <body>
                    <Main />
                    <NextScript />
                </body>
            </Html>);
    }
}
//# sourceMappingURL=_document.jsx.map