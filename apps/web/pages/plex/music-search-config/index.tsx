import { Card, CardContent } from "@mui/material"
import { NextPage } from "next"
import dynamic from "next/dynamic"
import MusicSearchConfigLayout from "../../../components/layouts/MusicSearchConfigLayout"

const HowItWorksTab = dynamic(() => import("../../../src/components/HowItWorksTab"), {
    ssr: false
})

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