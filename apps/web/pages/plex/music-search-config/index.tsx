import { Card, CardContent } from "@mui/material"
import { NextPage } from "next"
import MusicSearchConfigLayout from "@/components/layouts/MusicSearchConfigLayout"
import HowItWorksTab from "@/components/MusicSearchConfig/HowItWorksTab"

const MusicSearchConfigIndexPage: NextPage = () => {
    return (
        <MusicSearchConfigLayout activeTab="how-it-works">
            <Card>
                <CardContent>
                    <HowItWorksTab />
                </CardContent>
            </Card>
        </MusicSearchConfigLayout>
    )
}

export default MusicSearchConfigIndexPage