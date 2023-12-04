/**
 * Based on https://gitlab.com/paulkiddle/activitypub-http-signatures
 * (c) Paul Kiddle
 * License: ISC

/**
 * Activitypub HTTP Signatures
 * Based on [HTTP Signatures draft 08](https://datatracker.ietf.org/doc/html/draft-cavage-http-signatures-08)
 * @module activitypub-http-signatures
 */
import crypto from 'crypto'
import { Headers, HeadersInit } from 'undici'

// token definitions from definitions in rfc7230 and rfc7235
const token = String.raw`[!#$%&'\*+\-\.\^_\`\|~0-9a-z]+` // Key or value
const qdtext = String.raw`[^"\\\x7F]` // Characters that don't need escaping
const quotedPair = String.raw`\\[\t \x21-\x7E\x80-\xFF]` // Escaped characters
const quotedString = `(?:${qdtext}|${quotedPair})*`
const fieldMatch = new RegExp(
  String.raw`(?<=^|,\s*)(${token})\s*=\s*(?:(${token})|"(${quotedString})")(?=,|$)`,
  'ig',
)
const parseSigFields = (str: string) =>
  Object.fromEntries(
    Array.from(str.matchAll(fieldMatch)).map(
      // capture groups: 1=fieldname, 2=field value if unquoted, 3=field value if quoted
      (v) => [v[1], v[2] ?? v[3].replace(/\\./g, (c) => c[1])],
    ),
  )

const defaultHeaderNames = ['(request-target)', 'host', 'date']

export type Keypair = {
  privateKeyPem: string
  publicKeyPem: string
}

export function generateRsaKeypairPem() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 4096,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  })

  return {
    publicKeyPem: publicKey,
    privateKeyPem: privateKey,
  }
}

export enum Algorithms {
  RsaSha256 = 'rsa-sha256',
}

export type SignerOpts = {
  publicKeyId: string
  privateKey: string
  headerNames: string[]
}

export type SignStringOpts = {
  target: string
  method: string
  headers: Record<string, string>
}

export type SignOpts = {
  url: URL | string
  method: string
  headers: HeadersInit | Record<string, string>
}
/**
 * @private
 * Generate the string to be signed for the signature header
 * @param options	Options
 * @param options.target	The pathname of the request URL (including query and hash strings)
 * @param options.method	The HTTP request method
 * @param options.headers	Object whose keys are http header names and whose values are those headers' values
 * @param headerNames	Names of the headers to use in the signature
 * @returns
 */
function getSignString(
  { target, method, headers }: SignStringOpts,
  headerNames: string[],
) {
  const requestTarget = `${method.toLowerCase()} ${target}`
  headers = {
    ...headers,
    '(request-target)': requestTarget,
  }
  return headerNames
    .map((header) => `${header.toLowerCase()}: ${headers[header]}`)
    .join('\n')
}

export class Sha256Signer {
  #publicKeyId
  #privateKey
  #headerNames

  /**
   * Class for signing a request and returning the signature header
   * @param options	Config options
   * @param options.publicKeyId	URI for public key that must be used for verification
   * @param options.privateKey	Private key to use for signing
   * @param options.headerNames	Names of headers to use in generating signature
   */
  constructor({ publicKeyId, privateKey, headerNames }: SignerOpts) {
    this.#publicKeyId = publicKeyId
    this.#privateKey = privateKey
    this.#headerNames = headerNames ?? defaultHeaderNames
  }

  /**
   * Generate the signature header for an outgoing message
   * @param reqOptions	Request options
   * @param reqOptions.url	The full URL of the request to sign
   * @param reqOptions.method	Method of the request
   * @param reqOptions.headers	Dict of headers used in the request
   * @returns Value for the signature header
   */
  sign({ url, method, headers }: SignOpts) {
    const { pathname, search } = new URL(url)
    const target = `${pathname}${search}`
    const headerNames = this.#headerNames
    const headersRecord = Object.fromEntries(new Headers(headers).entries())

    const stringToSign = getSignString(
      {
        target,
        method,
        headers: headersRecord,
      },
      headerNames,
    )

    const signature = this.#signSha256(this.#privateKey, stringToSign).toString(
      'base64',
    )

    return `keyId="${this.#publicKeyId}",headers="${headerNames.join(
      ' ',
    )}",signature="${signature.replace(/"/g, '\\"')}",algorithm="rsa-sha256"`
  }

  /**
   * @private
   * Sign a string with a private key using sha256 alg
   * @param privateKey Private key
   * @param stringToSign String to sign
   * @returns Signature buffer
   */
  #signSha256(privateKey: string, stringToSign: string) {
    const signer = crypto.createSign('sha256')
    signer.update(stringToSign)
    const signature = signer.sign(privateKey)
    signer.end()
    return signature
  }
}

/**
 * Incoming request parser and Signature factory.
 * If you wish to support more signature types you can extend this class
 * and overide getSignatureClass.
 */
export class Parser {
  /**
   * Parse an incomming request's http signature header
   * @param	options
   * @param	pathname (and query string) of the request URL
   * @param	reqOptions.method	Method of the request
   * @param	reqOptions.headers	Dict of headers used in the request
   * @returns  Object representing the signature
   * @throws	{UnkownAlgorithmError}	If the algorithm used isn't one we know how to verify
   */
  parse({ headers, method, url }: SignOpts) {
    const headersRecord = Object.fromEntries(new Headers(headers).entries())
    const fields = parseSigFields(headersRecord.signature)
    const headerNames = (fields.headers ?? 'date').split(/\s+/)
    const signature = Buffer.from(fields.signature, 'base64')
    const signString = getSignString(
      { target: url.toString(), method, headers: headersRecord },
      headerNames,
    )
    const keyId = fields.keyId
    const algorithm = fields.algorithm ?? 'rsa-sha256'

    return this.#getSignatureClass(algorithm, {
      signature,
      string: signString,
      keyId,
    })
  }

  /**
   * Construct the signature class for a given algorithm.
   * Override this method if you want to support additional
   * algorithms.
   * @param algorithm The algorithm used by the signed request
   * @param options
   * @param options.signature	The signature as a buffer
   * @param options.string	The string that was signed
   * @param options.keyId	The ID of the public key to be used for verification
   * @returns
   * @throws	{UnkownAlgorithmError}	If an unknown algorithm was used
   */
  #getSignatureClass(
    algorithm: string,
    { signature, string, keyId }: Sha256SignatureOpts,
  ) {
    if (algorithm === 'rsa-sha256') {
      return new Sha256Signature({ signature, string, keyId })
    } else {
      throw new UnkownAlgorithmError(
        `Don't know how to verify ${algorithm} signatures.`,
      )
    }
  }
}

export class UnkownAlgorithmError extends Error {}

export class Signature {
  #keyId

  constructor(keyId: string) {
    this.#keyId = keyId
  }

  get keyId() {
    return this.#keyId
  }
}

export type Sha256SignatureOpts = {
  signature: Uint8Array
  string: string
  keyId: string
}

export class Sha256Signature extends Signature {
  #signature
  #string

  /**
   * Class representing the HTTP signature
   * @param options
   * @param options.signature	The signature as a buffer
   * @param options.string	The string that was signed
   * @param options.keyId	The ID of the public key to be used for verification
   */
  constructor({ signature, string, keyId }: Sha256SignatureOpts) {
    super(keyId)
    this.#signature = signature
    this.#string = string
  }

  /**
   * @property {string} keyId The ID of the public key that can verify the signature
   */

  /**
   * Verify the signature using a public key
   * @param publicKey The public key matching the signature's keyId
   * @returns
   */
  verify(publicKey: string) {
    const signature = this.#signature
    const signedString = this.#string
    const verifier = crypto.createVerify('sha256')
    verifier.write(signedString)
    verifier.end()

    return verifier.verify(publicKey, signature)
  }
}

/**
 * Default export: new instance of Parser class
 */
export default new Parser()
