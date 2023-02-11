# repco-docs-website

Documentation website for Repco.

## Development

This is a [Remix](https://remix.run) app that renders content from markdown files, organized in folders. It also indexes the content in [Meilisearch](https://docs.meilisearch.com/).

* Start meilisearch: `docker compose up -d`
* Start Remix in development mode: `yarn dev`

Then open http://localhost:3000 in your browser.

The content is loaded from the [docs folder in the repo root](../../docs). Pages can include frontmatter in yaml format. The following keys are supported:

* `title`: Currently used as menu link. Include a regular `#` heading for the page title.
* `date`: Publication date, displayed in the page header
* `weight`: Used to sort pages within a folder

Folders are used for grouping and navigation. A folder can optionally have a `index.md` file that is treated as meta data for the folder itself. Currently only frontmatter is supported with `title` and `weight` keys. Markdown content is ignored.
