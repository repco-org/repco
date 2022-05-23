# IDs in repco

*Status: Draft*

## Canonical ID

* each entity needs to have a canonical unique ID which has to be a URI.
* for each repo a spec/mechanism should be defined on what this canonical ID for each entity is
  * the canonical ID has to be a URI, and preferably is encoded as a URN
* if entities have a canonical URL, transform that into a URN
* if entities have a primary numerical ID, derive a URN pattern from the repo's DNS domain

examples:

https://cba.media/556557
becomes
urn:repco:cba.media:episode:556557

## Additional alternative IDs

* For each entity, always store all external ids as a list of URI strings.
  * Index these to match against in queries.
* Repco defines a spec on how to derive a UUID from the entity's canonical URI to have a uniform 16 bytes ID for internal representation
* If the entity already has a UUID, use that
* If not, take the first 16 bytes of the sha256 hash of the primary entity URI string
