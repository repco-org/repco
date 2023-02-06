# RepcoPostElement

A web component that fetches post data from a specified endpoint, displays the fetched data in cards, and provides the ability to open the original post in a new tab.

## Features

- Fetch post data from a specified endpoint.
- Display the fetched data in cards.
- Provide the ability to open the original post in a new tab.

## Properties

The repco-post-element component has the following properties that can be used to customize its behavior:

* theme: The theme of the post element, either "light" or "dark". The default value is "light".
* layout: The layout of the post element, either "horizontal" or "column". The default value is "column".
* endpoint: The GraphQL endpoint used to fetch the post data. The default value is "https://node1.repco.openaudiosearch.org/graphql".
* count: The number of posts to display. The default value is 10.
* \_defaultThumbnail: The default thumbnail to display for posts that do not have an image as their media asset. The default value is an empty string.
* query: The GraphQL query used to fetch the post data. The default value is a query that fetches the title, content, uid, and media assets of posts.


Examples are provided in the `dev``directory


## Usage
To use repco-post-element, include the following in your HTML file:
```
<script type="module" src="path/to/repco-post-element.js"></script>

```
Then, you can use the repco-post-element component by creating an instance of it in your HTML file:


```html
<repco-post-element
  endpoint="https://node1.repco.openaudiosearch.org/graphql"
  count="5"
></repco-post-element>
```

## Styling
The repco-post-element component can be styled using CSS variables. The following are the default values for each CSS variable:
```
--card-background-color: #f7fafc
--card-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1)
--card-border-color: #cbd5e0
--dark-card-background-color: #383838
--dark-card-color: #f7fafc
--dark-card-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1)
--dark-card-border-color: #cbd5e0
--dark-card-hover-background-color: #1c1c1c
--dark-card-hover-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1)
--dark-card-hover-border-color: #cbd5e0
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
