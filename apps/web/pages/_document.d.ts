import Document, { DocumentProps } from 'next/document';
type MyDocumentProps = DocumentProps;
export default class MyDocument extends Document<MyDocumentProps> {
    render(): import("react").JSX.Element;
}
export {};
//# sourceMappingURL=_document.d.ts.map