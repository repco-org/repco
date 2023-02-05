# RepcoPostElement

A web component that fetches post data from a specified endpoint, displays the fetched data in cards, and provides the ability to open the original post in a new tab.

## Features

- Fetch post data from a specified endpoint.
- Display the fetched data in cards.
- Provide the ability to open the original post in a new tab.

## Properties

- `layout`: Specifies the layout of the cards, either `column` (default) or `horizontal`.
- `endpoint`: Specifies the URL of the endpoint to fetch post data from (default: `https://node1.repco.openaudiosearch.org/graphql`).
- `count`: Specifies the maximum number of cards to display (default: `10`).
- `_defaultThumbnail`: Specifies a default thumbnail image to use if no image is available in the post data.
- `query`: Specifies the GraphQL query to be sent to the endpoint.


Examples are provided in the `dev``directory


## Usage

```html
<repco-post-element
  endpoint="https://node1.repco.openaudiosearch.org/graphql"
  count="5"
></repco-post-element>
```


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
