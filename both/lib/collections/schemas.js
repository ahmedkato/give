function configBasicsSetup() {
  // Not using the function 'ConfigDoc()' to assign this because this runs on both
  // the client and the server
  let config = Config.findOne( {
    'OrgInfo.web.domain_name': Meteor.settings.public.org_domain
  });

  if (config &&
    config.Settings &&
    config.Settings.DonorTools &&
    config.Settings.Stripe &&
    config.Settings.DonorTools.usernameExists &&
    config.Settings.DonorTools.passwordExists &&
    config.Settings.Stripe.keysPublishableExists &&
    config.Settings.Stripe.keysSecretExists &&
    config.Giving && config.Giving.options) {
    return true;
  }
  return false;
}

Schema = {};

Schema.OrgInfo = new SimpleSchema({
  "name": {
    type: String,
    label: "Name",
    max: 100
  },
  "full_name": {
    type: String,
    label: "Full Name (e.g., with ', Inc.' at the end)",
    max: 100
  },
  "logoURL": {
    type: String,
    optional: true,
    autoform: {
      disabled: true,
      afFieldInput: {
        type: "hidden"
      },
      afFormGroup: {
        label: false
      }
    }
  },
  "phone": {
    type: String,
    label: "Phone"
  },
  "is_501c3": {
    type: Boolean,
    label: "Are you a 501(c)3 non-profit organization?",
    autoform: {
      type: "boolean-radios",
      trueLabel: "Yes, We are.",
      falseLabel: "No, we aren't"
    }
  },
  "ein": {
    type: String,
    label: "EIN",
    max: 10,
    optional: true
  },
  "address": {
    type: Object,
    label: "Address",
    optional: true,
    autoform: {
      panelClass: "panel"
    }
  },
  "address.line_1": {
    type: String,
    label: "Address Line 1",
    max: 100
  },
  "address.line_2": {
    type: String,
    label: "Address Line 2",
    max: 100,
    optional: true
  },
  "address.city": {
    type: String,
    label: "City",
    max: 50
  },
  "address.state_short": {
    type: String,
    label: "State",
    allowedValues: ["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
                    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
                    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
                    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
                    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"],
    autoform: {
      afFieldInput: {
        firstOption: "(Select a State)"
      }
    }
  },
  "address.zip": {
    type: String,
    label: "Zip",
    max: 15
  },
  "mission_statement": {
    type: String,
    label: "Mission Statement",
    optional: true,
    autoform: {
      afFieldInput: {
        type: "textarea",
        rows: 5
      }
    }
  },
  "emails": {
    type: Object,
    label: "Emails used for below scenarios",
    optional: true,
    autoform: {
      panelClass: "panel"
    }
  },
  "emails.support": {
    type: String,
    label: "Technical support address",
    regEx: SimpleSchema.RegEx.Email
  },
  "emails.contact": {
    type: String,
    label: "Main contact address",
    regEx: SimpleSchema.RegEx.Email
  },
  "emails.canceledGift": {
    type: Array,
    label: "Notify for any canceled gifts",
    optional: true
  },
  "emails.canceledGift.$": {
    type: String,
    label: "Notify for any canceled gifts",
    regEx: SimpleSchema.RegEx.Email,
    optional: true
  },
  "emails.otherSupportAddresses": {
    type: Array,
    label: "Any additional support address you would like to be CC'd",
    optional: true
  },
  "emails.otherSupportAddresses.$": {
    type: String,
    regEx: SimpleSchema.RegEx.Email,
    optional: true
  },
  "emails.bccAddress": {
    type: String,
    regEx: SimpleSchema.RegEx.Email,
    optional: true
  },
  "emails.largeGiftThreshold": {
    type: Number,
    optional: true,
    autoform: {
      placeholder: "Any gift at or above this gift amount will trigger the large gift email"
    }
  },
  "emails.largeGift": {
    type: Array,
    label: "If a gift is at or above the large gift threshold, send a notice to these addresses.",
    optional: true
  },
  "emails.largeGift.$": {
    type: String,
    regEx: SimpleSchema.RegEx.Email,
    optional: true
  },
  "web": {
    type: Object,
    label: "Your website info.",
    autoform: {
      panelClass: "panel-info"
    }
  },
  "web.domain_name": {
    type: String,
    label: "Domain name",
    autoform: {
      value: Meteor.settings.public.org_domain,
      readonly: true
    }
  },
  "web.subdomain": {
    type: String,
    label: "The subdomain you would like 'Give' to run at",
    optional: true
  }
});

Schema.Giving = new SimpleSchema({
  options: {
    type: Array,
    optional: true,
    autoform: {
      omit: true
    }
  },
  "options.$": {
    type: Object,
    optional: true,
    autoform: {
      omit: true
    }
  },
  "options.$.description": {
    type: String,
    optional: true,
    autoform: {
      omit: true
    }
  },
  "options.$.currentGroup": {
    type: String,
    optional: true,
    autoform: {
      omit: true
    }
  },
  "options.$.id": {
    type: String,
    optional: true,
    autoform: {
      omit: true
    }
  },
  "options.$.groupId": {
    type: String,
    optional: true,
    autoform: {
      omit: true
    }
  },
  "options.$.text": {
    type: String,
    optional: true,
    autoform: {
      omit: true
    }
  },
  "options.$.type": {
    type: String,
    optional: true,
    autoform: {
      omit: true
    }
  },
  "options.$.position": {
    type: Number,
    optional: true,
    autoform: {
      omit: true
    }
  },
  "options.$.guideTitle": {
    type: String,
    optional: true,
    autoform: {
      omit: true
    }
  },
  "options.$.guideDescription": {
    type: String,
    optional: true,
    autoform: {
      omit: true
    }
  },
  "options.$.guideIcon": {
    type: String,
    optional: true,
    autoform: {
      omit: true
    }
  },
  "options.$.guideShow": {
    type: Boolean,
    optional: true,
    autoform: {
      omit: true
    }
  },
  guide: {
    type: Array,
    optional: true,
    blackbox: true,
    autoform: {
      omit: true
    }
  },
  "guide.$": {
    type: Object,
    optional: true,
    blackbox: true,
    autoform: {
      omit: true
    }
  }
});

Schema.Services = new SimpleSchema({
  Email: {
    type: Object,
    optional: true,
    autoform: {
      panelClass: "panel-info"
    }
  },
  "Email.emailSendMethod": {
    type: String,
    label: "What service do you want to use to send emails?",
    optional: true,
    allowedValues: ["Mandrill"] // add these later "mailgun", "sendgrid"
  },
  "Email.mandrillUsername": {
    type: String,
    label: "Mandrill username",
    optional: true,
    regEx: SimpleSchema.RegEx.Email
  },
  "Email.mandrillKey": {
    type: String,
    label: "Mandrill key",
    optional: true
  },
  "Email.notices": {
    type: String,
    label: "Generic email notice template.",
    optional: true
  },
  "Email.welcome": {
    type: String,
    label: "New giver welcome email. Entering name here activates this email for new givers.",
    optional: true
  },
  "Email.enrollmentName": {
    type: String,
    label: "The template name of the new user email.",
    optional: true
  },
  "Email.failedPayment": {
    type: String,
    label: "The template name of the failed payment email.",
    optional: true
  },
  "Email.pending": {
    type: String,
    label: "The template name used for acknowledgement email after an ACH gift is given.",
    optional: true
  },
  "Email.receipt": {
    type: String,
    label: "The template name of the receipt email.",
    optional: true
  },
  "Email.resetPasswordName": {
    type: String,
    label: "The template name of the password reset email.",
    optional: true
  },
  "Email.scheduled": {
    type: String,
    label: "The template name of the scheduled email.",
    optional: true
  },
  "Email.newFundraiser": {
    type: String,
    label: "The template name of an email notice for new fundraisers.",
    optional: true
  },
  Kadira: {
    type: Object,
    optional: true,
    autoform: {
      panelClass: "panel-info"
    }
  },
  "Kadira.appId": {
    type: String,
    label: "App ID",
    optional: true
  },
  "Kadira.appSecret": {
    type: String,
    label: "App Secret",
    optional: true
  },
  Papertrail: {
    type: Object,
    optional: true,
    autoform: {
      panelClass: "panel-info",
      afFieldInput: {
        class: 'slim-borders'
      }
    }
  },
  "Papertrail.host": {
    type: String,
    label: "Host",
    optional: true,
    autoform: {
      placeholder: "Your Papertrailapp host address (e.g., logs.papertrailapp.com)"
    },
    regEx: SimpleSchema.RegEx.Domain
  },
  "Papertrail.port": {
    type: Number,
    label: "Port",
    optional: true
  },
  "Papertrail.sendLogsFromClientToPapertrail": {
    type: Boolean,
    label: "Send logs from the client to papertrail?",
    optional: true
  },
  Analytics: {
    type: Object,
    label: "Analytics and Error tracking",
    optional: true,
    autoform: {
      panelClass: "panel-info",
      afFieldInput: {
        class: 'slim-borders'
      }
    }
  },
  "Analytics.heapId": {
    type: String,
    label: "Heap ID",
    optional: true
  }
});

Schema.Settings = new SimpleSchema({
  ach_verification_type: {
    type: String,
    label: "Which type of ACH verification do you prefer?",
    allowedValues: ["none", "manual"], // add these later "micro-deposit", "plaid"
    optional: true,
    autoform: {
      afFieldInput: {
        firstOption: "(Select a type)"
      }
    }
  },
  showDonatePage: {
    type: Boolean,
    optional: true,
    label: "Show the donation page to guests? (this option will be disabled if you haven't setup your giving options first)",
    autoform: {
      'data-toggle': 'switch',
      'data-on-text': 'Yes',
      'data-off-text': 'No',
      disabled: function() {
        return !configBasicsSetup();
      }
    },
    autoValue: function () {
      if (!configBasicsSetup()) {
        return false;
      }
    }
  },
  doNotAllowOneTimeACH: {
    type: Boolean,
    optional: true,
    label: "Prevent one-time ACH gifts",
    autoform: {
      'data-toggle': 'switch',
      'data-on-text': 'Yes',
      'data-off-text': 'No'
    }
  },
  collectBankAccountType: {
    type: Boolean,
    optional: true,
    label: "Collect bank account type from ACH gifts (checking or savings)",
    autoform: {
      'data-toggle': 'switch',
      'data-on-text': 'Yes',
      'data-off-text': 'No'
    }
  },
  forceACHDay: {
    type: String,
    label: "Day of month that ACH can occur on",
    allowedValues: ['any','1','2','3','4','5','6','7','8','9','10','11','12',
                    '13','14','15','16','17','18','19','20','21','22','23',
                    '24','25','26','27','28'],
    optional: true,
    autoform: {
      defaultValue: 'any'
    }
  },
  DonorTools: {
    type: Object,
    optional: true,
    autoform: {
      panelClass: "panel-info"
    }
  },
  "DonorTools.usernameExists": {
    type: Boolean,
    optional: true,
    autoform: {
      disabled: true,
      afFieldInput: {
        type: "hidden"
      },
      afFormGroup: {
        label: false
      }
    }
  },
  "DonorTools.passwordExists": {
    type: Boolean,
    optional: true,
    autoform: {
      disabled: true,
      afFieldInput: {
        type: "hidden"
      },
      afFormGroup: {
        label: false
      }
    }
  },
  "DonorTools.url": {
    type: String,
    label: "URL",
    optional: true,
    autoform: {
      placeholder: "Your Donor Tools Website Address, something like this 'https://your_part_here.donortools.com'"
    },
    regEx: SimpleSchema.RegEx.Url
  },
  "DonorTools.customDataTypeId": {
    type: Number,
    label: "Custom Data Type ID for Give",
    optional: true,
    autoform: {
      placeholder: "Go to your Donor Tools page and then to /settings/donation_type to find or create the ID"
    }
  },
  "DonorTools.achFundIDForNonStripe": {
    type: Number,
    label: "If not using Stripe for ACH, enter the data type ID for ACH",
    optional: true,
    autoform: {
      placeholder: "The data type ID for manual ACH"
    }
  },
  "DonorTools.defaultFundId": {
    type: Number,
    label: "Default Fund ID",
    optional: true,
    autoform: {
      placeholder: "The fund ID you'd like to use if no other match can be found"
    }
  },
  "DonorTools.defaultSourceIdForIndividualDonor": {
    type: Number,
    label: "Default Individual Source ID",
    optional: true,
    autoform: {
      placeholder: "The source ID you'd like to use for an individual's gift"
    }
  },
  "DonorTools.defaultSourceIdForOrganizationDonor": {
    type: Number,
    label: "Default Organization Source ID",
    optional: true,
    autoform: {
      placeholder: "The source ID you'd like to use for an organization's gift"
    }
  },
  "DonorTools.failedDonationTypeId": {
    type: Number,
    label: "Failed Data Type ID",
    autoform: {
      placeholder: "If a gift fails it will be updated with this data type ID"
    },
    optional: true
  },
  "DonorTools.writeInDonationTypeId": {
    type: Number,
    label: "Donation fund used to prompt user to add a note",
    autoform: {
      placeholder: "Might use for 'other'"
    },
    optional: true
  },
  Stripe: {
    type: Object,
    optional: true,
    autoform: {
      panelClass: "panel-info",
      afFieldInput: {
        type: "hidden",
        class: 'slim-borders'
      }
    }
  },
  "Stripe.keysPublishableExists": {
    type: Boolean,
    optional: true,
    autoform: {
      disabled: true,
      afFieldInput: {
        type: "hidden"
      },
      afFormGroup: {
        label: false
      }
    }
  },
  "Stripe.keysSecretExists": {
    type: Boolean,
    optional: true,
    autoform: {
      disabled: true,
      afFieldInput: {
        type: "hidden"
      },
      afFormGroup: {
        label: false
      }
    }
  }
});

Schema.Trips = new SimpleSchema({
  active: {
    type: Boolean,
    optional: true,
    autoform: {
      defaultValue: true,
      type: "hidden"
    }
  },
  fundId: {
    type: String,
    label: 'Select a Trip',
    autoform: {
      options: function() {
        return DT_funds.find({}, {sort: {name: 1}}).map( function(r) {
          return { label: r.name, value: r.id };
        });
      }
    }
  },
  fundAdmin: {
    type: String,
    optional: true,
    autoform: {
      afFieldInput: {
        type: "hidden"
      },
      afFormGroup: {
        label: false
      }
    }
  },
  fundTotal: {
    type: Number,
    optional: true,
    decimal: true,
    autoform: {
      afFieldInput: {
        type: "hidden"
      },
      afFormGroup: {
        label: false
      }
    }
  },
  startDate: {
    type: Date,
    label: "Start Date",
    autoform: {
      afFieldInput: {
        type: "bootstrap-datepicker",
        datePickerOptions: {
          autoclose: true
        }
      }
    }
  },
  endDate: {
    type: Date,
    label: "End Date",
    autoform: {
      afFieldInput: {
        type: "bootstrap-datepicker",
        datePickerOptions: {
          autoclose: true
        }
      }
    }
  },
  deadlines: {
    type: Array
  },
  "deadlines.$": {
    type: Object
  },
  "deadlines.$.id": {
    type: String,
    autoValue: function() {
      if( this.isInsert ) {
        return Random.id([6]);
      }
    },
    autoform: {
      afFieldInput: {
        type: "hidden"
      },
      afFormGroup: {
        label: false
      }
    }
  },
  "deadlines.$.name": {
    type: String,
    autoform: {
      placeholder: "Name or description"
    }
  },
  "deadlines.$.amount": {
    type: Number,
    autoform: {
      placeholder: "Individual deadline amount"
    }
  },
  "deadlines.$.dueDate": {
    type: Date,
    label: "When is this deadline?",
    autoform: {
      afFieldInput: {
        type: "bootstrap-datepicker",
        datePickerOptions: {
          autoclose: true
        }
      }
    }
  }
});

Schema.Config = new SimpleSchema({
  "Giving": {
    type: Schema.Giving,
    optional: true,
    autoform: {
      panelClass: "panel-primary",
      afFieldInput: {
        class: 'slim-borders'
      }
    }
  },
  "OrgInfo": {
    type: Schema.OrgInfo,
    optional: true,
    autoform: {
      panelClass: "panel-primary",
      afFieldInput: {
        class: 'slim-borders'
      }
    }
  },
  "Settings": {
    type: Schema.Settings,
    optional: true,
    autoform: {
      panelClass: "panel-primary",
      afFieldInput: {
        class: 'slim-borders'
      }
    }
  },
  "Services": {
    type: Schema.Services,
    optional: true,
    autoform: {
      panelClass: "panel-primary",
      afFieldInput: {
        class: 'slim-borders'
      }
    }
  }
});

Schema.UserProfile = new SimpleSchema({
  fname: {
    type: String,
    optional: true,
    label: 'First Name'
  },
  lname: {
    type: String,
    optional: true,
    label: 'Last Name'
  },
  address: {
    type: Object,
    optional: true
  },
  'address.address_line1': {
    type: String,
    optional: true,
    label: 'Address Line 1'
  },
  'address.address_line2': {
    type: String,
    optional: true,
    label: 'Address Line 2'
  },
  'address.city': {
    type: String,
    optional: true,
    label: 'City'
  },
  'address.state': {
    type: String,
    optional: true,
    label: 'State'
  },
  'address.country': {
    type: String,
    optional: true,
    label: 'Country'
  },
  'address.postal_code': {
    type: String,
    optional: true,
    regEx: SimpleSchema.RegEx.ZipCode,
    label: 'Postal Code'
  },
  business_name: {
    type: String,
    optional: true,
    label: 'Organization Name'
  },
  phone: {
    type: String,
    optional: true,
    label: 'Phone Number'
  },
  newStuffVersion: {
    type: String,
    optional: true,
    autoform: {
      afFieldInput: {
        type: "hidden"
      },
      afFormGroup: {
        label: false
      }
    }
  }
});

Schema.User = new SimpleSchema({
  createdAt: {
    type: Date,
    optional: false,
    autoform: {
      value: new Date(),
      type: "hidden"
    }
  },
  emails: {
    type: Array,
    autoform: {
      omit: true
    }
  },
  "emails.$": {
    type: Object,
    autoform: {
      afFieldInput: {
        type: "hidden"
      },
      afFormGroup: {
        label: false
      }
    }
  },
  "emails.$.address": {
    type: String,
    regEx: SimpleSchema.RegEx.Email,
    autoform: {
      afFieldInput: {
        type: "hidden"
      },
      afFormGroup: {
        label: false
      }
    }
  },
  "emails.$.verified": {
    type: Boolean,
    autoform: {
      afFieldInput: {
        type: "hidden"
      },
      afFormGroup: {
        label: false
      }
    }
  },
  newUser: {
    type: Boolean,
    optional: true,
    autoform: {
      afFieldInput: {
        type: "hidden"
      },
      afFormGroup: {
        label: false
      }
    }
  },
  profile: {
    type: Schema.UserProfile,
    optional: true
  },
  // Make sure this services field is in your schema if you're using any of the accounts packages
  services: {
    type: Object,
    optional: true,
    blackbox: true,
    autoform: {
      omit: true
    }
  },
  state: {
    type: Object,
    optional: true,
    autoform: {
      omit: true,
      afFieldInput: {
        type: "hidden"
      },
      afFormGroup: {
        label: false
      }
    }
  },
  'state.status': {
    type: String,
    optional: true,
    autoform: {
      afFieldInput: {
        type: "hidden"
      },
      afFormGroup: {
        label: false
      }
    },
    defaultValue: 'invited'
  },
  'state.updatedOn': {
    type: Date,
    optional: true,
    autoform: {
      afFieldInput: {
        type: "hidden"
      },
      afFormGroup: {
        label: false
      }
    }
  },
  roles: {
    type: Array,
    optional: true
  },
  "roles.$": {
    type: String,
    optional: true
  },
  persona_ids: {
    type: Array,
    optional: true,
    autoform: {
      omit: true
    }
  },
  "persona_ids.$": {
    type: Number,
    optional: true,
    autoform: {
      afFieldInput: {
        type: "hidden"
      },
      afFormGroup: {
        label: false
      }
    }
  },
  persona_id: {
    type: Array,
    optional: true,
    autoform: {
      omit: true
    }
  },
  "persona_id.$": {
    type: Number,
    optional: true,
    autoform: {
      afFieldInput: {
        type: "hidden"
      },
      afFormGroup: {
        label: false
      }
    }
  },
  persona_info: {
    type: Array,
    optional: true,
    blackbox: true,
    autoform: {
      omit: true
    }
  },
  'persona_info.$': {
    type: Object,
    optional: true,
    blackbox: true,
    autoform: {
      omit: true
    }
  },
  primary_customer_id: {
    type: String,
    optional: true,
    autoform: {
      afFieldInput: {
        type: "hidden"
      },
      afFormGroup: {
        label: false
      }
    }
  },
  emailSubscriptions: {
    type: Array,
    optional: true,
    autoform: {
      omit: true
    }
  },
  "emailSubscriptions.$": {
    type: Object,
    optional: true,
    autoform: {
      afFieldInput: {
        type: "hidden"
      },
      afFormGroup: {
        label: false
      }
    }
  },
  "emailSubscriptions.$.id": {
    type: String,
    optional: true,
    autoform: {
      afFieldInput: {
        type: "hidden"
      },
      afFormGroup: {
        label: false
      }
    }
  },
  "emailSubscriptions.$.frequency": {
    type: String,
    optional: true,
    autoform: {
      afFieldInput: {
        type: "hidden"
      },
      afFormGroup: {
        label: false
      }
    }
  }
});

Schema.CreateUserFormSchema = new SimpleSchema({
  email: {
    type: String,
    label: 'Email Address',
    regEx: SimpleSchema.RegEx.Email
  },
  profile: {
    type: Schema.UserProfile,
    optional: true
  },
  state: {
    type: Object,
    autoform: {
      afFieldInput: {
        type: "hidden"
      },
      afFormGroup: {
        label: false
      }
    }
  },
  "state.status": {
    type: String,
    autoform: {
      type: "select",
      options: function() {
        return [
          { label: "invited", value: "invited" }
        ];
      }
    },
    defaultValue: 'invited'
  },
  roles: {
    type: Array,
    label: 'Roles: Hold down the Ctrl (windows) / Command (Mac) button to select multiple roles',
    autoform: {
      options: function() {
        return Meteor.roles.find().map( function(r) {
          return { label: r.name, value: r.name };
        });
      }
    }
  },
  "roles.$": {
    type: String
  }
});

Schema.UpdateUserFormSchema = new SimpleSchema({
  emails: {
    type: Array,
    autoform: {
      omit: true
    }
  },
  "emails.$": {
    type: Object,
    autoform: {
      afFieldInput: {
        type: "hidden"
      },
      afFormGroup: {
        label: false
      }
    }
  },
  "emails.$.address": {
    type: String,
    regEx: SimpleSchema.RegEx.Email
  },
  "emails.$.verified": {
    type: Boolean,
    autoform: {
      afFieldInput: {
        type: "hidden"
      },
      afFormGroup: {
        label: false
      }
    }
  },
  profile: {
    type: Schema.UserProfile,
    optional: true
  },
  state: {
    type: Object,
    autoform: {
      afFieldInput: {
        type: "hidden"
      },
      afFormGroup: {
        label: false
      }
    }
  },
  'state.status': {
    type: String,
    autoform: {
      type: "select",
      options: function () {
        return [
          {label: "enabled", value: "enabled"},
          {label: "invited", value: "invited"},
          {label: "disabled", value: "disabled"}
        ];
      }
    }
  },
  roles: {
    type: Array,
    optional: true,
    label: 'Roles: Hold down the Ctrl (windows) / Command (Mac) button to select multiple roles',
    autoform: {
      options: function() {
        return Meteor.roles.find().map(function(r) {
          return { label: r.name, value: r.name };
        } );
      }
    }
  },
  "roles.$": {
    type: String
  }
});

Schema.OrgInfoForm = new SimpleSchema({
  "OrgInfo": {
    type: Schema.OrgInfo,
    optional: true,
    autoform: {
      panelClass: "panel-primary",
      afFieldInput: {
        class: 'slim-borders'
      }
    }
  }
});

Schema.ServicesForm = new SimpleSchema({
  "Services": {
    type: Schema.Services,
    optional: true,
    autoform: {
      panelClass: "panel panel-primary",
      afFieldInput: {
        class: 'slim-borders'
      }
    }
  }
});

Schema.SettingsForm = new SimpleSchema({
  "Settings": {
    type: Schema.Settings,
    optional: true,
    autoform: {
      panelClass: "panel panel-primary",
      afFieldInput: {
        class: 'slim-borders'
      }
    }
  }
});

Schema.Fundraisers = new SimpleSchema( {
  trips: {
    type: Array,
    optional: true,
    autoform: {
      type: "hidden"
    }
  },
  'trips.$': {
    type: Object,
    optional: true
  },
  'trips.$.id': {
    type: String,
    optional: true
  },
  'trips.$.adjustments': {
    type: Array,
    optional: true
  },
  'trips.$.adjustments.$': {
    type: Object,
    optional: true
  },
  'trips.$.adjustments.$.id': {
    type: String,
    optional: true
  },
  'trips.$.adjustments.$.amount': {
    type: String,
    optional: true
  },
  addedBy: {
    type:     String,
    optional: true,
    autoform: {
      afFieldInput: {
        type: "hidden"
      },
      afFormGroup:  {
        label: false
      }
    }
  },
  fname: {
    type: String,
    label: "First Name",
    autoform: {
      afFormGroup: {
        autofocus: true
      }
    }
  },
  lname: {
    type: String,
    label: "Last Name"
  },
  email: {
    type: String,
    label: "Email Address",
    regEx: SimpleSchema.RegEx.Email
  }
});

Schema.CreateFundraisersFormSchema = new SimpleSchema({
  addParticipants: {
    type: Array,
    label: "",
    autoform: {
      afFormGroup: {
        label: false
      }
    }
  },
  "addParticipants.$": {
    type: Schema.Fundraisers,
    optional: true,
    label: "",
    autoform: {
      afFormGroup: {
        label: false
      }
    }
  }
});

Meteor.users.attachSchema(Schema.User);

Config.attachSchema(Schema.Config);
