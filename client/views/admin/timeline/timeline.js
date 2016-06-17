import { getDocHeight } from '/client/imports/miscFunctions.js';

Template.Timeline.helpers({
  audits(){
    return Audit_trail.find({}, {sort: {time: -1}});
  },
  auditsExist(){
    return Audit_trail.findOne();
  },
  auditTypeIcon(){
    if (this.type === 'charge') {
      return 'fa fa-dollar';
    }
    if (this.type === 'config') {
      return 'fa fa-sliders';
    }
  },
  auditCategoryIcon(){
    if (this.category === 'Stripe') {
      return 'fa fa-cc-stripe';
    }
    if (this.category === 'System') {
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
  auditStyle(){
    if (this.category === 'Stripe') {
      return 'style-success';
    }
    if (this.category === 'System') {
      return 'style-info';
    }
    if (this.category === 'Admin') {
      return 'style-primary';
    }
    if (this.category === 'User') {
      return 'style-primary';
    }
    if (this.category === 'Email') {
      return 'style-info';
    }
  },
  auditEventTitle(){
    let story = this.relatedCollection;
    if (this.type && this.type === 'charge') {
      let charge = Charges.findOne({_id: this.relatedDoc});
      if (charge && charge.customer) {
        let customer = Customers.findOne({_id: charge.customer});
        if (customer) {
          story = "";
          story = customer.metadata.fname + " " + customer.metadata.lname;
          story = story + "'s gift of $";
          story = story + (charge.amount / 100);
        }
      }
    }
    if (this.type && this.type === 'config') {
      let admin = Meteor.users.findOne({_id: this.userId});
      if (admin) {
        story = 'A configuration change was made by an admin with the email address: ' +
          admin.emails[0].address
      } else {
        story = 'A configuration change was made by an admin';
      }
    }

    if (this.category === 'Email') {
      story = 'An email was sent to ' + this.emailSentTo;
    }
    return story
  },
  buttonTitle(){
    if (this.type && this.type === 'charge') {
      let charge = Charges.findOne( { _id: this.relatedDoc } );
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
    }
  },
  buttonLink(){
    if (this.type) {
      if( this.type === 'charge' ) {
        return '/thanks?charge=' + this.relatedDoc;
      }
      if( this.type === 'config' ) {
        return this.page;
      }
    }
  }
});

Template.Timeline.onCreated(function () {
  Session.set("documentLimit", 10);
  this.autorun(()=>{
    this.subscribe('auditTrail', Session.get("documentLimit"));
  });
});

Template.Timeline.onRendered(function () {
  $(window).scroll(function() {
    if(($(window).scrollTop() + $(window).height() == getDocHeight()) ||
      ($(window).scrollTop() + window.innerHeight == getDocHeight())) {
      console.log("bottom!");
      let documentLimit = Session.get("documentLimit");
      Session.set("documentLimit", documentLimit += 10);
    }
  });
});

Template.Timeline.onDestroyed(function (){
  Session.delete("documentLimit");
});