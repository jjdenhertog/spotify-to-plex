import { Card, CardContent, Divider } from "@mui/material"
import { NextPage } from "next"
import MusicSearchConfigLayout from "@/components/layouts/MusicSearchConfigLayout"
import TextProcessingEditor from "@/components/MusicSearchConfig/TextProcessingEditor"
import SearchApproachesEditor from "@/components/MusicSearchConfig/SearchApproachesEditor"

const TextProcessingPage: NextPage = () => {
    return (
        <MusicSearchConfigLayout activeTab="text-processing" title="Text Processing & Search Approaches">
            <Card>
                <CardContent>
                    <TextProcessingEditor />
                    <Divider sx={{ my: 4 }} />
                    <SearchApproachesEditor />
                </CardContent>
            </Card>
        </MusicSearchConfigLayout>
    )
}

export default TextProcessingPage