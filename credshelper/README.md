# Helper app to build a test_credentials.json for running tests locally

In the current directory

```sh
$ npm i
$ npm start

```
Make sure CORS policy is disabled (*) in you browser if you want test_credentials.json to include identity data needed by Android tests.

In a browser, open `http://localhost:8080`, enter credentials.

Copy the test credentials to your `test_credentials.json` file!


(*) On chrome install https://chrome.google.com/webstore/detail/allow-control-allow-origi/nlfbmbojpeacfghkpbjhddihlkkiljbi or run chrome --disable-web-security


