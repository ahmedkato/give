const config = ConfigDoc();

BrowserPolicy.framing.disallow();
BrowserPolicy.content.disallowInlineScripts();
BrowserPolicy.content.disallowEval();
BrowserPolicy.content.allowInlineStyles();
BrowserPolicy.content.allowFontDataUrl();

const trusted = [
  'js.stripe.com',
  'api.stripe.com',
  'q.stripe.com',
  'checkout.stripe.com',
  Meteor.settings.public.org_domain,
  'use.typekit.net',
  'p.typekit.net',
  'cdn.heapanalytics.com',
  'heapanalytics.com',
  'd2zah9y47r7bi2.cloudfront.net',
  Meteor.settings.AWS.cfdomain
];


if (config && config.OrgInfo && config.OrgInfo.web.subdomain) {
  trusted.push(config.OrgInfo.web.subdomain + "." +
    config.OrgInfo.web.domain_name);
}

_.each(trusted, function(origin) {
  const secureOrigin = "https://" + origin;
  BrowserPolicy.content.allowOriginForAll(secureOrigin);

  // only trust non https on dev side
  if (Meteor.settings.dev) {
    const nonSecureOrigin = "http://" + origin;
    BrowserPolicy.content.allowOriginForAll(nonSecureOrigin);
  }
});

BrowserPolicy.content.allowOriginForAll("blob:");
const constructedCsp = BrowserPolicy.content._constructCsp();
BrowserPolicy.content.setPolicy(constructedCsp + " media-src blob:;");

/*
BrowserPolicy.content.allowScriptOrigin("heapanalytics.com cdn.heapanalytics.com 'unsafe-inline' 'unsafe-eval'");
BrowserPolicy.content.allowConnectOrigin("heapanalytics.com");
BrowserPolicy.content.allowImageOrigin("heapanalytics.com");
BrowserPolicy.content.allowStyleOrigin("heapanalytics.com");
BrowserPolicy.content.allowFontOrigin("heapanalytics.com");*/
