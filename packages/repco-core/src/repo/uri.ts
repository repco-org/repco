export type URIComponentsRepco = { entityUid: string }
// export type URIComponentsRepco = { entityUid: string } | { revisionId: string }
export type URIComponentsBase = { uri: string; scheme: URI }
export type URIScheme = 'repco' | 'uri'

export type URIComponents = {
  scheme: URIScheme
  uri: string
  repco?: URIComponentsRepco
}

export class URI {
  readonly scheme: URIScheme
  readonly repco?: URIComponentsRepco
  readonly uri: string

  static parse(uri: string): URI {
    if (uri.startsWith('repco:e:')) {
      const entityUid = uri.substring(8)
      return new URI({ uri, scheme: 'repco', repco: { entityUid } })
    }
    // if (uri.startsWith('repco:r:')) {
    //   const revisionId = uri.substring(8)
    //   return { uri, scheme: 'repco', repco: { revisionId } }
    // }
    return new URI({ uri, scheme: 'uri' })
  }

  static fromEntity(uid: string) {
    const uri = 'repco:e:' + uid
    return new URI(uri)
  }
  
  static fromURL(url: string | URL) {
    return new URI(url.toString())
  }

  static fromUUID(uuid: string) {
    return new URI('uuid:' + uuid)
  }

  constructor(components: string | URIComponents | URI) {
    if (typeof components === 'string') components = URI.parse(components)
    this.uri = components.uri
    this.repco = components.repco
    this.scheme = components.scheme
  }

  toString() {
    return this.uri
  }
}
