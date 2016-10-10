[![Codacy Badge](https://www.codacy.com/project/badge/cd0a18c7433547279f5409d4ec3297c1)](https://www.codacy.com/app/c316/give)


An opinionated donation app for Non-profits using <a href="https://stripe.com">Stripe</a> 
written in <a href="https://meteor.com">Meteor</a>.


## About

Give is used by non-profits to take donations using Stripe. Which includes Credit/Debit Cards, ACH. 

## Problems addressed

Non-profits want to allow anyone to give with or without an account. 
However, we also want to give them credit for doing so. This is a problem. 
How do we track givers while letting them give without an account? The answer is;
 we do all the hard work. First, we will end up with a lot of customers in Stripe
  since each time a person gives without logging in we can't know if they've given before. 
  We don't want the donor to wait around for us to query over to DonorTools to check, so we create
  a Stripe customer every time someone gives and they aren't logged in.
Second, we want to do our best to make sure we don't have duplicates in our CMS,
 so we search backwards and forwards to see if we can find them there. Users don't
 always know what they should and shouldn't do when entering their information in our forms
 so we try to parse out the different versions of their name, but always create a new 
 account in DonorTools and locally if they use a different email address then one of those
 in their DonorTools Person record. 

If we think this is a new person, we insert them into the CMS as a new person 
and send off an email to the support admin letting them know we just inserted a 
new person. Chances are we'll end up with newly inserted people who really shouldn't
 be new people at all. Users misspell things, they change their address and phone
  numbers and sometimes give under shortened version of their names. (and these 
  are just a few reasons we'll still get duplicates)
  
Knowing we'll have duplicates we have to merge those accounts in both DonorTools and in Give.
Use the "Merge DT accounts" button in the Dashboard for this.


## Setup

Once you have this repo cloned you'll want to setup a settings.json file. This 
is where your Donor Tools and Stripe settings go (you can use the [example](#settings) below 
to get started) as well as your organization's domain name and other settings. 

Before running this app edit the server/fixtures.js file and change the email 
address to your address and a set a temporary password there too.

Run the app with ```meteor --settings settings.json```

Once you are logged in you should see the "Start Here!" label on the "Organization 
Info." button. Click that and complete the form.

Each time you complete a section, more of the app is unlocked.

After the Organization Info. form is completed you'll see the Settings and Giving 
Options buttons. 

You'll want to complete the Settings form first, then the Giving Options. The 
Giving Options section pulls in all the Donor Tools funds so that you can use 
them to create all the giving options you want donors to be able to choose. 

We use S3 to store files. We also use graphicsmagick to make a thumbnail size version of
the images that are uploaded. Make sure your linux server has this installed. 
Or if you are using docker you can use my docker image, which has graphicsmagick installed.
https://github.com/c316/meteor-graphicsmagick

## Webhooks 

In order to get updates about charges, transfers and many other resources via Stripe 
you'll need to point a webhook in the 
<a href="https://dashboard.stripe.com/dashboard">Stripe dashboard</a> to 
https://yourSiteURL/webhooks/stripe

## TODO

Move these to the configuration and out of the settings.json file

  newStuffVersion

Document Services
  Papertrail
  TrackJS
  Kadira
  Heap

Document Setup process

Document Limitations of Integration with Stripe (No micro-deposit or Plaid at the moment)

## Example

https://give.trashmountain.com/landing

This is a live giving page, which is being used by Trash Mountain Project. 

## Settings <a name="settings"></a>

Here is an example settings.json file. Each of the fields are required.

```
{
  "dev": "****TEST****", // If you are using this settings.json file on the dev side include this text, if on the live side, leave it blank.
  "AWS": {
    "cfdomain": "YOURsubdomain.cloudfront.net",
    "key": "YOURs3key",
    "secret": "YOURs3secret",
    "bucket": "YOURbucketName",
    "region": "YOURS3Region",
    "folder": "YOURFolder"
  },
  "donor_tools_user": "",
  "donor_tools_password": "",
  "stripe": {
    "secret": "Secret Stripe key"
  },
  "public": {
    "dev": "****TEST****", // If you are using this settings.json file on the dev side include this text, if on the live side, leave it blank.
    "newStuffVersion": "e.g. '0.9' This is used to show the user new updates and then increment those updates.", // This is being deprecated
    "org_domain": "Your org domain, for example 'trashmountain.com'",
    "stripe_publishable: "publishable Stripe Key",
    "File": {
      "path": "assets/app/uploads/Images" // This is the temporary file storage path used before uploading to S3
    }
  }
}
```

## More

These are the integrations built into Give already

Payment Processing, including recurring gifts - Stripe

Mandrill (MailChimp's transactional email service) - Transactional emails (used for receipting and failure notices)

DonorTools, a CRM for non-profits.

You will need an account with each of these providers in order to use Give. 
The accounts are free up to a point. Stripe doesn't charge you a monthly fee, 
only a fee per transaction (2.9% + .30 per transaction for credit/debit cards). 
ACH fees are $0.80 per charge and there is no fee for transfers to your own bank account after charging the customer. 

## License

MIT
