# Page Snitch

Tool to check a secure webpage or optionally crawl a secure site looking for any content not being served using HTTPS. It will also check forms are being submitted using HTTPS and Iframes loaded using HTTPS (it will not check the iframe source for mixed content).

## Requirements
* [NodeJS](http://nodejs.org) 8+
* [NPM](https://www.npmjs.com/) 5.5+

## Installation

Download or clone the repo
```bash
git clone git@github.com:andypattenden/page-snitch.git
cd page-snitch
npm install
```

## Usage

### Single Page Test
```bash
npm run snitch -- --url=https://www.example.com/page/to/test
```

### Entire site
By default the snitch will only check the page at the URL given. To spider a site and check all pages use the following command:
```bash
npm run snitch -- --url=https://www.example.com --crawl
```

### Log all Requests
By default, only insecure resource requests are logged to the console. To log all requests, use the following command.
```bash
npm run snitch -- --url=https://www.example.com --logAllRequests
```

### Ignore SSL Errors
PhantomJS will return an about:blank page if any SSL errors are encountered, this can be resolved by using the following command.
```bash
npm run snitch-ignore-ssl-errors -- --url=https://www.example.com/page/to/test
```
The above command can be used in conjunction with all other parameters.

### Parameters
* `--url=https://www.example.com` the url of the page to check
* `--crawl` (optional, defaults to `false`) tells the checker to crawl the site from the url given
* `--logAllRequests` (optional, defaults to `false`) outputs all requests to the console. By default only mixed content requests are logged
* `--ignoreForms` (optional, defaults to `false`) prevents checking of form action attributes
* `--ignoreIframes` (optional, defaults to `false`) prevent checking of iframe source attributes
* `--verbose` (optional, defaults to `false`) logs information to console
* `--logLevel=[debug|info|warning|error]` (optional, defaults to `error`) changes log level


## Limitations
Can only test pages accessible via a GET. Pages accessed through POST requests won't be tested.