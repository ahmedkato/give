import { setDocHeight } from '/imports/api/miscFunctions.js';

Template.Timeline.helpers({
  audits() {
    return Audit_trail.find({}, {sort: {time: -1}});
  },
  auditsExist() {
    return Audit_trail.findOne();
  },
  greenBlueOrangeRed() {
    if (this.subtype === 'succeeded' ||
      this.subtype === 'account created' ||
      this.subtype === 'change') {
      return 'success';
    }
    if (this.subtype === 'scheduled' || this.subtype === 'email sent' ||
    !this.subtype) {
      return 'info';
    }
    if (this.subtype === 'pending' || this.subtype === 'refunded') {
      return 'warning';
    }
    if (this.subtype === 'failed') {
      return 'danger';
    }
  },
  auditCategoryIcon() {
    if (this.category === 'Stripe') {
      return 'fa fa-cc-stripe';
    }
    if (this.category === 'System' || this.category === 'DonorTools') {
      return 'fa fa-cogs';
    }
    if (this.category === 'Admin') {
      return 'fa fa-user';
    }
    if (this.category === 'User') {
      return 'fa fa-user';
    }
    if (this.category === 'Email') {
      return 'fa fa-envelope-o';
    }
  },
  subTypeStyle() {
    if (this && this.subtype && this.subtype.indexOf(" ") > -1) {
      return 'info';
    } else {
      return this.subtype;
    }
  },
  auditEventTitle() {
    let story = this.relatedCollection;
    if (this.type && this.type === 'charge') {
      const charge = Charges.findOne({_id: this.relatedDoc});
      if (charge && charge.customer) {
        const customer = Customers.findOne({_id: charge.customer});
        if (customer) {
          story = customer.metadata.fname + " " + customer.metadata.lname;
          story = story + "'s gift of $";
          story = story + (charge.amount / 100);
          if (this.subtype === 'pending') {
            story = story + ' is pending';
          }
          if (this.subtype === 'succeeded') {
            story = story + ' has succeeded';
          }
          if (this.subtype === 'failed') {
            story = story + ' has failed';
          }
          if (this.subtype === 'refunded') {
            story = story + ' has been refunded';
          }
        }
      }
    }
    if (this.type && this.type === 'config') {
      const admin = Meteor.users.findOne({_id: this.userId});
      if (admin) {
        story = 'A configuration change was made by an admin with the email address: ' +
          admin.emails[0].address;
      } else {
        story = 'A configuration change was made by an admin';
      }
    }
    if (this.category === 'Email') {
      let emailSentTo = "";
      if((typeof this.emailSentTo) === "string") {
        emailSentTo = this.emailSentTo;
      } else {
        emailSentTo = this.emailSentTo.map(function(item) {
          return item['email'];
        });
        emailSentTo = (emailSentTo.toString()).replace(/(^,)|(,$)/g, "");
      }
      const subtypeInfo = this.subtype ? this.subtype : '';
      story = 'A ' + this.type + " " + subtypeInfo + ' email was sent to ' + emailSentTo;
    }
    if (this.category === 'System' || this.category === 'DonorTools') {
      const subtypeInfo = this.subtype === 'account created' ? 'account was created' : '';
      story = 'A ' + this.type + " " + subtypeInfo;
    }
    return story;
  },
  buttonTitle() {
    if (this.type && this.type === 'charge') {
      const charge = Charges.findOne( { _id: this.relatedDoc } );
      let frequency;
      if (charge && charge.metadata && charge.metadata.frequency) {
        frequency = charge.metadata.frequency.replace( "_", " " );
      } else {
        frequency = 'Gift';
      }
      return frequency;
    }
    if (this.type && this.type === 'config') {
      return 'Config';
    } else {
      return 'See more...';
    }
  },
  buttonLink() {
    if (this.page) {
      return this.page;
    }
  }
});

Template.Timeline.onCreated(function() {
  Session.set("documentLimit", 25);
  this.autorun(()=>{
    this.subscribe('auditTrail', Session.get("documentLimit"));
  });
});

Template.Timeline.onRendered(function() {
  setDocHeight();
});

Template.Timeline.onDestroyed(function() {
  Session.delete("documentLimit");
  $(window).unbind("scroll");
});
