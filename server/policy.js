let config = ConfigDoc();

BrowserPolicy.framing.disallow();
BrowserPolicy.content.disallowInlineScripts();
BrowserPolicy.content.disallowEval();
BrowserPolicy.content.allowInlineStyles();
BrowserPolicy.content.allowFontDataUrl();

var trusted = [
  'js.stripe.com',
  'api.stripe.com',
  'q.stripe.com',
  'checkout.stripe.com',
  Meteor.settings.public.org_domain,
  'kadira.io',
  'enginex.kadira.io',
  'use.typekit.net',
  'p.typekit.net',
  'cdn.heapanalytics.com',
  'heapanalytics.com',
  'd2zah9y47r7bi2.cloudfront.net',
];


if (config && config.OrgInfo && config.OrgInfo.web.subdomain) {
  trusted.push(config.OrgInfo.web.subdomain + "." +
    config.OrgInfo.web.domain_name);
}

_.each(trusted, function(origin) {
  var secureOrigin = "https://" + origin;
  BrowserPolicy.content.allowOriginForAll(secureOrigin);
  
  // only trust non https on dev side
  if (Meteor.settings.dev) {
    let nonSecureOrigin = "http://" + origin;
    BrowserPolicy.content.allowOriginForAll(nonSecureOrigin);
  }
});
