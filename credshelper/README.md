# Helper app to build a test_credentials.json for running tests locally

## First time
In the current directory
```sh
$ npm i
```

## Running server
In the current directory
```sh
$ npm start
```

## Getting json for your test_credentials.json file
In a browser, open `http://localhost:8080`, pick your login host and click `Start Login Flow` button.
In popup, enter credentials.
After the approval screen, the popup should close and the main window will show you the json for your `test_credentials.json` file.

NB: the `test_credentials.json` file on Android contains additional fields. To get those additional fields, a call to the identity URL is made. This will only work if your browser has CORS policy disabled. To disable CORS, simply run chrome with the `--disable-web-security` flag.

