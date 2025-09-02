type SearchApproachConfig = {
    id: string;
    filtered?: boolean;
    trim?: boolean;
    removeQuotes?: boolean;
};

export function convertSearchApproachesJsonToUI(json: SearchApproachConfig[]): SearchApproachConfig[] {
    return json;
}