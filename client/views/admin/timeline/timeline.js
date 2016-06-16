Template.Timeline.helpers({
  audits(){
    return Audit_trail.find();
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
    if (this.category === 'Admin') {
      return 'fa fa-user';
    }
    if (this.category === 'User') {
      return 'fa fa-user';
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
  },
  auditEventTitle(){
    let story = this.relatedCollection;
    if (this.type && this.type === 'charge') {
      let charge = Charges.findOne({_id: this.relatedDoc});
      if (charge && charge.customer) {
        let customer = Customers.findOne({_id: charge.customer});
        story = "";
        story = customer.metadata.fname + " " + customer.metadata.lname;
        story = story + "'s gift of $";
        story = story + (charge.amount / 100);
      }
    }
    if (this.type && this.type === 'config') {
      let admin = Meteor.users.findOne({_id: this.user_id});
      if (admin) {
        story = 'A configuration change was made by the admin with this email address: ' +
          admin.emails[0].address
      } else {
        story = 'A configuration change was made by an admin';
      }
    }
    return story
  },
  buttonTitle(){
    if (this.type && this.type === 'charge') {
      let charge = Charges.findOne( { _id: this.relatedDoc } );
      let frequency = charge.metadata.frequency.replace( "_", " " );
      return frequency;
    }
    if (this.type && this.type === 'config') {
      return 'Config';
    }
  }
  
});

Template.Timeline.onCreated(function () {
  this.autorun(()=>{
    this.subscribe('auditTrail');
  });
});