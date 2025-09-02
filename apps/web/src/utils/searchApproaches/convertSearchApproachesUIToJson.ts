type SearchApproachConfig = {
    id: string;
    filtered?: boolean;
    trim?: boolean;
    removeQuotes?: boolean;
};

export function convertSearchApproachesUIToJson(ui: SearchApproachConfig[]): SearchApproachConfig[] {
    return ui;
}