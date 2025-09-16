import { Card, CardContent } from "@mui/material"
import { NextPage } from "next"
import MusicSearchConfigLayout from "@/components/layouts/MusicSearchConfigLayout"
import MatchFilterEditor from "@/components/MatchFilterEditor"


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