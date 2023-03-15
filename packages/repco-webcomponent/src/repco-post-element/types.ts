export interface PostsData {
  contentItems: {
    nodes: PostType[]
  }
}

export interface PostType {
  title: string
  content: string
  uid: string
  mediaAssets: MediaAssetsType
  revision: {
    repo: {
      name: string
    }
  }
}

export interface MediaAssetsType {
  nodes: MediaAssetType[]
}

export interface MediaAssetType {
  mediaType: string
  file: {
    contentUrl: string
  }
}
