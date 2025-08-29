import { MusicSearchState } from './types';
import { state } from './stateInstance';

export function setState(newState: Partial<MusicSearchState>): void {
    Object.assign(state, newState);
}