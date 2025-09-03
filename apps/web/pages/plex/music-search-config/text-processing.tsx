import { Card, CardContent } from "@mui/material"
import { NextPage } from "next"
import dynamic from "next/dynamic"
import MusicSearchConfigLayout from "../../../components/layouts/MusicSearchConfigLayout"

const TextProcessingAndSearchEditor = dynamic(() => import("../../../src/components/TextProcessingAndSearchEditor"), {
    ssr: false
})

const TextProcessingPage: NextPage = () => {
    return (
        <MusicSearchConfigLayout activeTab="text-processing" title="Text Processing & Search Approaches">
            <Card>
                <CardContent>
                    <TextProcessingAndSearchEditor />
                </CardContent>
            </Card>
        </MusicSearchConfigLayout>
    )
}

export default TextProcessingPage