import { Card, CardContent } from "@mui/material"
import { NextPage } from "next"
import dynamic from "next/dynamic"
import MusicSearchConfigLayout from "../../../components/layouts/MusicSearchConfigLayout"

const TestConfigurationTab = dynamic(() => import("../../../src/components/TestConfigurationTab"), {
    ssr: false
})

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