import { Card, CardContent } from "@mui/material"
import { NextPage } from "next"
import MusicSearchConfigLayout from "@/components/layouts/MusicSearchConfigLayout"
import TestConfigurationTab from "@/components/TestConfigurationTab"

const TestConfigPage: NextPage = () => {
    return (
        <MusicSearchConfigLayout activeTab="test" title="Test Configuration">
            <Card>
                <CardContent>
                    <TestConfigurationTab />
                </CardContent>
            </Card>
        </MusicSearchConfigLayout>
    )
}

export default TestConfigPage