import { Card, CardContent } from "@mui/material"
import { NextPage } from "next"
import dynamic from "next/dynamic"
import MusicSearchConfigLayout from "../../../components/layouts/MusicSearchConfigLayout"

const MatchFilterEditor = dynamic(() => import("../../../src/components/MatchFilterEditor"), {
    ssr: false
})

const MatchFiltersPage: NextPage = () => {
    return (
        <MusicSearchConfigLayout activeTab="match-filters" title="Match Filters">
            <Card>
                <CardContent>
                    <MatchFilterEditor />
                </CardContent>
            </Card>
        </MusicSearchConfigLayout>
    )
}

export default MatchFiltersPage