/* eslint-disable custom/no-export-only-files */
import { axiosGet } from './methods/axiosGet';
import { axiosPost } from './methods/axiosPost';
import { axiosPut } from './methods/axiosPut';
import { axiosDelete } from './methods/axiosDelete';

export const AxiosRequest = {
    get: axiosGet,
    post: axiosPost,
    put: axiosPut,
    delete: axiosDelete
}