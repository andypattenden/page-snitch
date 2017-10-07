# Page Snitch

Tool to check a secure webpage or optionally crawl a secure site looking for any content not being served using HTTPS.

## Requirements
* [NodeJS](http://nodejs.org) 8+
* [NPM](https://www.npmjs.com/) 5.5+

## Installation

```bash
npm install
```

## Usage

### Single Page Test
```bash
npm snitch -- --url=https://www.example.com/page/to/test
```

### Entire site
By default the snitch will only check the page at the URL given. To spider a site and check all pages use the following command:
```bash
npm snitch -- --url=https://www.example.com --crawl
```

### Log all Requests
By default, only insecure resource requests are logged to the console. To log all requests, use the following command.
```bash
npm snitch -- --url=https://www.example.com --logAllRequests
```

### Parameters
* `--url=https://www.example.com` the url of the page to check
* `--crawl` (optional, defaults to `false`) tells the checker to crawl the site from the url given
* `--logAllRequests` (optional, defaults to `false`) outputs all requests to the console. By default only mixed content requests are logged


