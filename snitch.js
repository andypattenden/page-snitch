"use strict";

var casper = require("casper").create(),
  options = {
    crawl: casper.cli.get("crawl") || false,
    logAllRequests: casper.cli.get("logAllRequests") || false
  },
  visitedUrls = [],
  pendingUrls = [],
  totalInsecureResources = 0,
  totalPagesWithMixedContent = 0,
  isCurrentPageSecure = true;

// Set the start URL
if (!casper.cli.has("url")) {
  casper.echo("No start URL specified, use --url", "ERROR");
  casper.exit();
  casper.bypass(1);
}

var startUrl = casper.cli.get("url");
var startUrlLink = document.createElement("a");
startUrlLink.href = startUrl;

// Check start URL is actually for a secure site
if (startUrlLink.protocol !== "https:") {
  casper.echo("Start URL specified was http", "ERROR");
  casper.exit();
  casper.bypass(1);
}

/**
 * Fetch links on page
 * 
 * @param {any} page 
 * @returns {Object[]} 
 */
function getLinkUrlsOnPage(page) {
  return page.evaluate(function() {
    return __utils__.findAll("a").map(function(e) {
      var link = document.createElement("a");
      link.href = e.href;
      return link;
    });
  });
}

/**
 * Filter links for other sites or those that have been found/visited already
 * 
 * @param {Object} currentUrlLink 
 * @param {Object[]} links 
 * @returns 
 */
function filterLinks(currentUrlLink, links) {
  return links.filter(function(link) {
    var result = true;

    // Filter out urls on different domain
    if (link.hostname !== currentUrlLink.hostname) {
      result = false;
    }

    // Filter out urls which are the same as the current
    if (
      link.pathname === currentUrlLink.pathname &&
      link.search === currentUrlLink.search
    ) {
      result = false;
    }

    return result;
  });
}

/**
 * Fetch a web page and spider links present
 * 
 * @param {String} url 
 */
function spider(url) {
  // Add the URL to the visited stack
  visitedUrls.push(url);

  // Open the URL
  casper.open(url).then(function() {
    var currentUrlLink = document.createElement("a"),
      linksOnPage = getLinkUrlsOnPage(this);

    // TODO: Check other page resources, iframes, form actions

    currentUrlLink.href = url; // create a link from current url so that it can be broken into url components

    // Find links present on this page and filter them
    linksOnPage = filterLinks(currentUrlLink, linksOnPage);

    // Loop over filtered links on page so that any insecure ones can be logged
    for (var i = 0; i < linksOnPage.length; i++) {
      var link = linksOnPage[i];

      // Add newly found URLs to the stack
      if (
        pendingUrls.indexOf(link.href) < 0 &&
        visitedUrls.indexOf(link.href) < 0
      ) {
        // Alert links which are pointing to insecure site
        if (link.protocol !== "https:") {
          casper.echo("\tLink to insecure page found: " + link.href, "COMMENT");
        }

        pendingUrls.push(link.href);
      }
    }

    !isCurrentPageSecure && totalPagesWithMixedContent++;

    // If there are URLs to be processed
    if (pendingUrls.length > 0 && options.crawl) {
      var nextUrl = pendingUrls.shift();

      casper.echo("==> Testing page: " + nextUrl, "INFO_BAR");

      casper.echo(
        "Total Mixed Content Pages: " +
          totalPagesWithMixedContent +
          " Total Insecure Resources: " +
          totalInsecureResources,
        "INFO"
      );

      isCurrentPageSecure = true;
      spider(nextUrl);
    }
  });
}

casper.echo("==> Testing page: " + startUrl, "INFO_BAR");

// Start spidering
casper.start(startUrl, function() {
  spider(startUrl);
});

// Log resource requests
casper.on("resource.received", function(resource) {
  if (resource.stage === "start") {
    // check resource url is https
    if (resource.url.indexOf("https") < 0) {
      totalInsecureResources++;
      isCurrentPageSecure = false;
      casper.echo(
        "\tERROR: Requested an insecure resource '" + resource.url + "'",
        "WARNING"
      );
    } else if (options.logAllRequests) {
      casper.echo("\tRequested resource '" + resource.url + "'", "INFO");
    }
  }
});

// Start the run
casper.run(function() {
  this.echo("Done");
  this.exit();
});
