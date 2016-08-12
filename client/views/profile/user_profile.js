import parsley from 'parsleyjs';

var userProfileTutorialSteps = [
  {
    template: Template.tutorial_user_profile_step1,
    onLoad: function() {
      console.log("The tutorial has started!");
    }
  },
  {
    template: Template.tutorial_user_profile_step2,
    spot: "#giving_section"
  },
  {
    template: Template.tutorial_user_profile_step3,
    spot: "#giving_history"
  },
  {
    template: Template.tutorial_user_profile_step4,
    spot: "#nav-subscriptions"
  }
];

Template.UserProfile.helpers({
    user: function () {
        return Meteor.user();
    },
    showHistory: function () {
        return Session.get("showHistory");
    },
    donation: function () {
        return Donations.find({}, {sort: {created_at: 1}});
    },
    total_amount: function () {
        return this.total_amount / 100;
    },
    dt_gifts: function () {
        var donations = DT_donations.find({persona_id: this.id});
        var fullSplitList = [];
        var number_of_gifts = 0;
        var total_given = 0;
        donations.forEach(function (element){
          if(element.payment_status === "succeeded" ||
            element.payment_status === "pending" ||
            element.payment_status === "" ||
            element.payment_status == null ){
            number_of_gifts++;
            element.splits.forEach(function (value){
                  total_given += value.amount_in_cents;
                if(!_.contains(fullSplitList, value.fund_id)){
                    fullSplitList.push(value.fund_id)}
            });
          }

        });
        return {categories: fullSplitList.length, number_of_gifts: number_of_gifts, total_given: total_given};
    },
    customer: function () {
        return Customers.findOne();
    },
    address_line2: function () {
        if(Meteor.user() && Meteor.user().profile.address.address_line2) {
            return '<span class="">' + Meteor.user().profile.address.address_line2 + '</span> <br>';
        } else return;
    },
    email: function () {
        if(Meteor.user() && Meteor.user().emails[0].address) {
            return Meteor.user().emails[0].address;
        } else return;
    },
    business_name: function () {
        if(Meteor.user() && Meteor.user().profile.business_name) {
            return '<h5>' + Meteor.user().profile.business_name + '</h5>';
        }
        else return;
    },
    company_name: function () {
        if(this.company_name) {
            return '<h5>' + this.company_name + '</h5>';
        }
        else return;
    },
    dt_donations: function() {
        var page = Session.get('dt_donations_cursor');
        return DT_donations.find({'persona_id': this.id}, {sort: {received_on: -1}, limit: 10, skip: page});
    },
    split: function () {
        return this.splits;
    },
    fundName: function() {
        if(DT_funds.findOne({_id: this.fund_id.toString()}) && DT_funds.findOne({_id: this.fund_id.toString()}).name){
            return DT_funds.findOne({_id: this.fund_id.toString()}).name;
        }
        else return '<span style="color: red;">Finding fund...</span>';
    },
    redText: function(){
        if(this.payment_status && this.payment_status === 'pending'){
            return 'orange-text';
        } else if(this.payment_status && this.payment_status === 'failed'){
            return 'red-text';
        }
    },
    receipt_link: function() {
        var charge_id, customer_id;
        if(this.transaction_id && Charges.findOne({_id: this.transaction_id})){
            charge_id = this.transaction_id;
            customer_id = Charges.findOne({_id: charge_id}).customer;
            return '/thanks?c=' + customer_id + '&charge=' + charge_id;
        }else{
            return;
        }
    },
    clickable_row: function() {
        if(this.transaction_id && Charges.findOne({_id: this.transaction_id})){
            return 'clickable_row';
        }
        else{
            return;
        }
    },
    personas : function () {
        if(Meteor.user() && Meteor.user().persona_info){
            return Meteor.user().persona_info;
        } else {
          return;
        }
    },
    company_or_name: function () {
        var user = Meteor.user();
        return this.company_name ? this.company_name : this.names ? this.names[0].first_name + ' ' + this.names[0].last_name : user.profile.fname + ' ' + user.profile.lname;
    },
    street_address: function () {
        var street_address = this.addresses[0].street_address;
        street_address = street_address.split("\n");
        return street_address;
    },
  not_dt_user: function () {
    if(Session.equals("NotDTUser", true)){
      return true;
    }
  },
  options: {
    id: "userTutorial",
    steps: userProfileTutorialSteps,
    onFinish: function() {
      console.log("Finish clicked!");
      Meteor.setTimeout( function () {
        // Test debouncing
        Session.set('tutorialEnabled', false);
      }, 1000);
    }
  }
});

Template.UserProfile.events({
  'click #viewHistory': function() {
      Session.set("showHistory", false);
  },
  'click .edit_address': function () {
    //setup modal for entering give toward information
    $('#modal_for_address_change').modal({show: true, static: true});
  },
  'submit form': function (evt) {
    evt.preventDefault();
    evt.stopPropagation();
    var fields = {
      address: {
        'address_line1':    $('#line1').val(),
        'address_line2':    $('#line2').val(),
        'city':             $('#city').val(),
        'state':            $('#state').val(),
        'postal_code':      $('#zip').val()
      },
      phone: $('#phone').val()
    };

    $(':submit').button('loading');
    
    Meteor.call('update_customer', fields, Number(Session.get('activeTab')), function(error, result){
     if(result){
       console.log(result);
       $('#modal_for_address_change').modal('hide');
       $(':submit').button("reset");
       Bert.alert("We have updated your profile, thanks.", "success");
     } else {
       console.log(error);
       $(':submit').button("reset");
       Bert.alert("That didn't work. Please try again. If it still doesn't work, " +
           "then please let us know, we'll check into this error." + error, "danger");
     }
    });
  },
  'click .previous': function(evt){
    evt.preventDefault();
    evt.stopPropagation();
    if(Number(Session.get('dt_donations_cursor')> 9)){
      Session.set('dt_donations_cursor', Number(Session.get('dt_donations_cursor')-10));
    }
  },
  'click .next': function(evt){
    evt.preventDefault();
    evt.stopPropagation();
    Session.set('dt_donations_cursor', Number(Session.get('dt_donations_cursor')+10));
  },
  'click .clickable_row': function(){
    var transaction_id = this.transaction_id;
    Router.go($(".clickable_row[data-dt-transaction-id='" + transaction_id + "']").data("href"));
  },
  'click #myTabs a': function () {
    Session.set('activeTab', this.id);
  }
});

Template.UserProfile.onRendered(function() {
  let selectedUser = Meteor.user();

  let selectedPersonaInfo = selectedUser && selectedUser.persona_info;
  let selectedPersonaIds = selectedUser && selectedUser.persona_ids;
  if (!selectedPersonaInfo ||
    ( selectedPersonaInfo && selectedPersonaInfo.length < 1 ) ||
    ( selectedPersonaInfo && selectedPersonaInfo.length <
    ( selectedPersonaIds && selectedPersonaIds.length ) ) ||
    ( selectedPersonaInfo && selectedPersonaInfo.length <
    ( selectedUser && selectedUser.persona_id && selectedUser.persona_id.length ) ) ) {
    Meteor.call( 'update_user_document_by_adding_persona_details_for_each_persona_id', function ( error, result ) {
      if( result ) {
        if(result === 'Not a DT user'){
          Session.set("NotDTUser", true);
          return;
        }
        console.log( result );
        Session.set("got_all_donations", true);
        // Hack here to reload the page. I'm not sure why the reactivity isn't
        // showing the new information, when the persona_info is pulled down
        // for now we just reload the page and the problem is resolved.
        location.reload();
      } else {
        console.log( error );
        throw new Meteor.Error("400", "Couldn't retrieve any Donor Tools information for this user.");
      }
    } );
  } else if(!Session.equals("got_all_donations", true)) {
    Meteor.call( "get_all_donations_for_this_donor", function ( error, result ) {
      if( result ) {
        console.log( result );
        Session.set( "got_all_donations", true );
      } else {
        console.log( error );
      }
    } );

    if( Meteor.user() && Meteor.user().profile && !Meteor.user().profile.address ) {
      let activeTab = Session.get( 'activeTab' );
      Meteor.call( "putProfileAddress", activeTab ? activeTab : '', function ( err, res ) {
        if( err ) {
          console.error( err );
        } else {
          console.log( res );
        }
      } );
    }
  }

  Session.setDefault('dt_donations_cursor', 0);
  Session.set("showHistory", true);

  // Setup parsley form validation
  $('#userAddressForm').parsley();

  $('[data-toggle="popover"]').popover({html: true});

  $('#myTabs li:first').addClass('active');

  $("a[href='" + Session.get('activeTab') + "' ]").addClass('active');

  $('.tab-pane:first').addClass('active');

  Session.set('activeTab', $('.active a').attr('value'));
});

Template.UserProfile.onDestroyed(function () {
  Session.delete( 'NotDTUser' );
  Session.delete( 'activeTab' );
  Session.delete( 'got_all_donations' );
  Session.delete( 'dt_donations_cursor' );
  Session.delete( 'showHistory' );
});