# repco specs and planning

This repo tracks the effort to digest a shared internal metadata model for Open Audio Search and repco (replication engine for OAS).

## Research status quo

- Collect status quo of freie-radios.net, CBA, XRCB, nearfm

post/media/channel/show/etc plus what metadata fields are there for each type, how are relations defined, images, does description text contain HTML, is it filtered somehow, ...

- Collect status quo of RSS feed generation
- Collect status quo of other read APIs

## Define internal data model

- Oriented at schema.org?
- Compare existing standards
- Define record types, their fields and their relations based on the research
- See the [datamodel draft](datamodel.md)

## Spec out the "RSS oplog"

A reversed RSS feeds that contains linear feed of all *updates* (not sorted by creation but by update datestamp) sorted by an update sequence number. The feed starts at page 0 and counts upwards. Either every feed page or a well-defined API request returns the current *sequence number*.
