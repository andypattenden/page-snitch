"use strict";

var casper = require("casper").create(),
  options = {
    crawl: casper.cli.get("crawl") || false,
    logAllRequests: casper.cli.get("logAllRequests") || false,
    ignoreIframes: casper.cli.get("ignoreIframes") || false,
    ignoreForms: casper.cli.get("ignoreForms") || false
  },
  visitedUrls = [],
  pendingUrls = [],
  totalInsecureResourceRequests = 0,
  totalInsecureForms = 0,
  totalInsecureIframes = 0,
  totalInsecureLinks = 0,
  totalPagesWithMixedContent = 0,
  isCurrentPageSecure = true;

// Set the start URL
if (!casper.cli.has("url")) {
  casper.echo("No start URL specified, use --url", "ERROR");
  casper.exit();
  casper.bypass(1);
}

var startUrl = casper.cli.get("url");

// Check start URL is actually for a secure site
if (!isUrlSecure(startUrl)) {
  casper.echo("Start URL specified was http", "ERROR");
  casper.exit();
  casper.bypass(1);
}

/**
 * Parses a URL string and returns an object containing parts of URL
 * 
 * @param {String} url 
 * @returns {Object}
 */
function parseUrl(url) {
  var link = document.createElement("a");
  link.href = url;

  return link;
}

/**
 * Fetch links on page
 * 
 * @param {any} page 
 * @returns {String[]} 
 */
function getLinkUrlsOnPage(page) {
  return page.evaluate(function() {
    return __utils__.findAll("a").map(function(e) {
      return e.href;
    });
  });
}

/**
 * Filter links for other sites or those that have been found/visited already
 * 
 * @param {Object} url 
 * @param {String[]} links 
 * @returns 
 */
function filterLinks(url, urlsToFilter) {
  return urlsToFilter.filter(function(urlToFilter) {
    var result = true,
      parsedUrl = parseUrl(url),
      parsedUrlToFilter = parseUrl(urlToFilter);

    // Filter out urls on different domain
    if (parsedUrlToFilter.hostname !== parsedUrl.hostname) {
      result = false;
    }

    // Filter out urls which are the same as the current
    if (
      parsedUrlToFilter.pathname === parsedUrl.pathname &&
      parsedUrlToFilter.search === parsedUrl.search
    ) {
      result = false;
    }

    return result;
  });
}

/**
 * Fetch form actions on page
 * 
 * @param {any} page 
 * @returns {String[]} 
 */
function getFormActions(page) {
  return page.evaluate(function() {
    return __utils__.findAll("form").map(function(e) {
      return e.action;
    });
  });
}

/**
 * Fetch iframe sources on page
 * 
 * @param {any} page 
 * @returns {String[]} 
 */
function getIframeSources(page) {
  return page.evaluate(function() {
    return __utils__.findAll("iframe").map(function(e) {
      return e.source;
    });
  });
}

/**
 * Checks if a URL is secure
 * 
 * @param {String} url 
 * @returns {boolean} 
 */
function isUrlSecure(url) {
  var parsedUrl = parseUrl(url);

  if (parsedUrl.protocol !== "data:" && parsedUrl.protocol !== "https:") {
    return false;
  }

  return true;
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
    var linksOnPage = getLinkUrlsOnPage(this),
      formActions,
      iframeSources;

    // Find links present on this page and filter them
    linksOnPage = filterLinks(url, linksOnPage);

    // Loop over filtered links on page so that any insecure ones can be logged
    for (var i = 0; i < linksOnPage.length; i++) {
      var link = linksOnPage[i];

      // Add newly found URLs to the stack
      if (pendingUrls.indexOf(link) < 0 && visitedUrls.indexOf(link) < 0) {
        // Alert links which are pointing to insecure site
        if (!isUrlSecure(link)) {
          totalInsecureLinks++;
          casper.echo("\t[INSECURE PAGE LINK] " + link, "COMMENT");
        }

        pendingUrls.push(link);
      }
    }

    if (!options.ignoreForms) {
      // Check form actions for insecure

      formActions = getFormActions(this);
      for (var j = 0; j < formActions.length; j++) {
        var action = formActions[j];

        if (!isUrlSecure(action)) {
          isCurrentPageSecure = false;
          totalInsecureForms++;
          casper.echo("\t[INSECURE FORM ACTION]" + action, "ERROR");
        }
      }
    }

    if (!options.ignoreIframes) {
      // Check iframes for insecure sources
      iframeSources = getIframeSources(this);

      for (var k = 0; k < iframeSources.length; k++) {
        var iframeSource = iframeSources[k];

        if (!isUrlSecure(iframeSource)) {
          isCurrentPageSecure = false;
          totalInsecureIframes++;
          casper.echo("\t[INSECURE IFRAME SOURCE] " + iframeSource, "ERROR");
        }
      }
    }

    if (isCurrentPageSecure) {
      casper.echo("[PAGE OK] " + url, "GREEN_BAR");
    } else {
      casper.echo("[INSECURE PAGE] " + url, "ERROR");
      totalPagesWithMixedContent++;
    }

    casper.echo("");

    // If there are URLs to be processed
    if (pendingUrls.length > 0 && options.crawl) {
      var nextUrl = pendingUrls.shift();

      casper.echo("TESTING " + nextUrl, "INFO_BAR");
      isCurrentPageSecure = true;
      spider(nextUrl);
    }
  });
}

casper.echo("TESTING " + startUrl, "INFO_BAR");

// Start spidering
casper.start(startUrl, function() {
  spider(startUrl);
});

// Log resource requests
casper.on("resource.received", function(resource) {
  if (resource.stage === "start") {
    // check resource url is https
    if (!isUrlSecure(resource.url)) {
      totalInsecureResourceRequests++;
      isCurrentPageSecure = false;
      casper.echo("\t[INSECURE RESOURCE] " + resource.url, "WARNING");
    } else if (options.logAllRequests) {
      casper.echo("\t[SECURE RESOURCE] " + resource.url, "TRACE");
    }
  }
});

// Start the run
casper.run(function() {
  var logType =
    totalInsecureResourceRequests > 0 ||
    totalInsecureForms > 0 ||
    totalInsecureIframes > 0
      ? "ERROR"
      : "GREEN_BAR";

  // Total Pages Tested: ##, Total Mixed Content Pages: ##, Total Insecure Resources: ##, Total Insecure Forms: ##, Total Insecure Iframes: ##
  var msg =
    " SUMMARY :: Total Pages Tested: " +
    visitedUrls.length +
    ", Total Mixed Content Pages: " +
    totalPagesWithMixedContent +
    ", Total Insecure Resource Requests: " +
    totalInsecureResourceRequests;

  if (!options.ignoreForms) {
    msg += ", Total Insecure Forms: " + totalInsecureForms;
  }

  if (!options.ignoreIframes) {
    msg += ", Total Insecure iframes: " + totalInsecureIframes;
  }

  msg += ", Total Insecure Links: " + totalInsecureLinks + " ";

  this.echo(msg, logType);
  this.exit();
});
