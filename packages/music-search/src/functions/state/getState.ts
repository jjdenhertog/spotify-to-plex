import { MusicSearchState } from './types';
import { state } from './stateInstance';

export function getState(): MusicSearchState {
    return state;
}