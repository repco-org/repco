export interface PostType {
  title: string;
  content: string;
  uid: string;
  mediaAssets: MediaAssetsType;
}

export interface MediaAssetsType {
  nodes: MediaAssetType[];
}

export interface MediaAssetType {
  mediaType: string;
  file: {
    contentUrl: string;
  };
}
