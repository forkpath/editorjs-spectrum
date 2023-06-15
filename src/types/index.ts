import { BlockToolData } from '@editorjs/editorjs';

/**
 * spectrum Tool's input and output data format
 */
export interface spectrumData extends BlockToolData {
    url: string;
    description: string;
    caption?: string
}

/**
 * spectrum Tool's configuration object that passed through the initial Editor config
 */
export interface spectrumConfig {
    url: string;
    method: 'POST' | 'GET' | 'PUT' | 'DELETE' | 'PATCH';
    credentials: {
        [key: string]: string
    };
}

export interface Nodes {
    wrapper: HTMLElement | null;
    btn: HTMLElement | null;
    img: HTMLImageElement | null;
    caption: HTMLElement | null;
    imgGallery: HTMLElement | null;
}
