export type URIComponentsBase = { uri: string; scheme: URI }
export type URIComponentsRepco = { uid: string }
import * as common from 'repco-common/zod'

// export type URIComponentsDns = { authority: string, path: string }
// export type URIComponentsIpfs = { cid: string, path: string }
// export type URIScheme = 'repco' | 'dns' | 'ipfs'
export type URIScheme = 'repco' | 'uri'

export type URIComponents = {
  uri: string
  scheme: URIScheme
  repco?: URIComponentsRepco
  // dns?: URIComponentsDns
}

export class URI {
  readonly scheme: URIScheme
  readonly repco?: URIComponentsRepco
  readonly uri: string

  static parse(uri: string): URI {
    if (uri.startsWith('repco:e:')) {
      const uid = uri.substring(8)
      return new URI({ uri, scheme: 'repco', repco: { uid } })
    }
    // if (uri.startsWith('dns:')) {
    // }
    return new URI({ uri, scheme: 'uri' })
  }

  static fromEntity(uid: string) {
    const uri = 'repco:e:' + uid
    return new URI(uri)
  }

  static fromURI(uri: string | URL) {
    return new URI(uri.toString())
  }

  static fromLink(link: common.Link) {
    if (link.uid) return URI.fromEntity(link.uid)
    if (link.uri) return URI.fromURI(link.uri)
    throw new Error('Link is empty.')
  }

  // static fromDNS(authority: string, path: string) {
  //   return new URI({ scheme: 'dns', authority, path })
  // }

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
