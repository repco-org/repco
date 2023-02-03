# repco-recommander-box

A web component to show a list of recommended posts. This is still WIP and not ready for production right now.

## Usage

To use the `repco-recommander-box` component, add the following code to your HTML file:

```html
<script type="module" src="./dist/src/post-element.js"></script>
<repco-recommander-box></repco-recommander-box>
```

Use the `post-element` tag in your HTML file. You can customize the display of the component by setting its attributes:

- `count`: the number of posts to display (default is `10` also maximum right now)
- `defaultThumbnail`: the default thumbnail image URL to display if a post does not have a thumbnail (default is ` `)
- `url`: the URL of the GraphQL API to retrieve the posts from (default is `https://node1.repco.openaudiosearch.org/graphql`)

Examples are provided in the `dev``directory

## Building the Component

1. Install the deopendecies using yarn:

```
yarn install
```

2. Build the component using yarn:

```
yarn build
```

3. [Optional] to build in watch mode:

```
yarn buld:watch
```

## Development

To start a local development server, run:

```
yarn dev
```

## Linting & Formatting

To lint the code, run:

```
yarn lint
```

To format the code, run:

```
yarn format
```
