# repco-cli

Contains the current commandline interface to control repco and provides methods to manage and administer repros and datasources.

```javascript
USAGE: repco <command> [opts] [args...]

COMMANDS:
Manage repco repositories
repo create         Create a repo
repo mirror         Mirror an existing repo
repo list           List repos
repo info           Info on a repo
repo car-import     Import a CAR file into a repo
repo car-export     Export repo to CAR file
repo log-revisions  Print all revisions as JSON
repo delete         Delete a repo and all children

Manage datasources
ds add           Add a datasource
ds ingest        Ingest content from datasources
ds list-plugins  List datasource plugins

server   Start the repco API server Development helpers debug create-content  Create dummy content
```
