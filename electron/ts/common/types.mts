export interface Video {
    limit: boolean;
    title: string;
    url: string;
    height: number;
    width: number;
    size: number;
    frameRate: number;
    // duration: number,
    codecs: string; // "H.264" | "H.265";
    order?: number;
}

export interface VideoInfo {
    title: string;
    description: string;
    imageUrl: string;
    duration: number;
    videos: Array<Video>;
    author?: string;
}