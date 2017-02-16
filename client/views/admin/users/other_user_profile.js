import parsley from 'parsleyjs';

Template.OtherUserProfile.onCreated(function() {
  this.autorun(()=>{
    this.subscribe('roles');
    this.subscribe('userStripeData', Session.get('params.userID'));
    this.subscribe('userDTFunds');
    this.subscribe('userDT', Session.get('params.userID'));
  });

  Meteor.setTimeout(function() {
    $('#myTabs a:first').tab('show');
    $('#myTabs li:first').addClass('active');
  }, 1000);
});

Template.OtherUserProfile.helpers({
  user: function() {
    return Meteor.users.findOne({_id: Session.get("params.userID")});
  },
  donation: function() {
    return Donations.find({}, {sort: {created_at: 1}});
  },
  total_amount: function() {
    return this.total_amount / 100;
  },
  dt_gifts: function() {
    const donations = DT_donations.find({persona_id: this.id});
    const fullSplitList = [];
    let number_of_gifts = 0;
    let total_given = 0;
    donations.forEach(function(element) {
      if (element.payment_status === "succeeded" ||
      element.payment_status === "pending" ||
      element.payment_status === "" ||
      element.payment_status == null) {
        number_of_gifts++;
        element.splits.forEach(function(value) {
          total_given += value.amount_in_cents;
          if (!_.contains(fullSplitList, value.fund_id)) {
            fullSplitList.push(value.fund_id);
          }
        });
      }
    });
    return {categories: fullSplitList.length, number_of_gifts: number_of_gifts, total_given: total_given};
  },
  customer: function() {
    return Customers.findOne();
  },
  address_line2: function() {
    if (Meteor.users.findOne({_id: Session.get("params.userID")}) &&
      Meteor.users.findOne({_id: Session.get("params.userID")}).profile.address.address_line2) {
      return '<span class="">' +
        Meteor.users.findOne({_id: Session.get("params.userID")}).profile.address.address_line2 +
        '</span> <br>';
    } else return;
  },
  email: function() {
    if (Meteor.users.findOne({_id: Session.get("params.userID")}) && Meteor.users.findOne({_id: Session.get("params.userID")}).emails[0].address) {
      return Meteor.users.findOne({_id: Session.get("params.userID")}).emails[0].address;
    } else return;
  },
  business_name: function() {
    if (Meteor.users.findOne({_id: Session.get("params.userID")}) && Meteor.users.findOne({_id: Session.get("params.userID")}).profile.business_name) {
      return '<h5>' + Meteor.users.findOne({_id: Session.get("params.userID")}).profile.business_name + '</h5>';
    } else return;
  },
  company_name: function() {
    if (this.company_name) {
      return '<h5>' + this.company_name + '</h5>';
    } else return;
  },
  dt_donations: function() {
    const page = Session.get('dt_donations_cursor');
    return DT_donations.find({'persona_id': this.id}, {sort: {received_on: -1}, limit: 10, skip: page});
  },
  split: function() {
    return this.splits;
  },
  redText: function() {
    if (this.payment_status && this.payment_status === 'pending') {
      return 'orange-text';
    } else if (this.payment_status && this.payment_status === 'failed') {
      return 'red-text';
    }
  },
  receipt_link: function() {
    let charge_id, customer_id;
    if (this.transaction_id && Charges.findOne({_id: this.transaction_id})) {
      charge_id = this.transaction_id;
      customer_id = Charges.findOne({_id: charge_id}).customer;
      return '/thanks?c=' + customer_id + '&charge=' + charge_id;
    } else {
      return;
    }
  },
  clickable_row: function() {
    if (this.transaction_id && Charges.findOne({_id: this.transaction_id})) {
      return 'clickable_row';
    } else {
      return;
    }
  },
  personas: function() {
    if (Session.get("params.userID")) {
      return Meteor.users.findOne({_id: Session.get("params.userID")}) &&
        Meteor.users.findOne({_id: Session.get("params.userID")}).persona_info;
    }
  },
  company_or_name: function() {
    // TODO: need to fix this to look at the persona info, not the profile info
    // var user = Meteor.users.findOne({_id: Session.get("params.userID")});
    return this.company_name ? this.company_name :
      this.names ? this.names[0].first_name + ' ' + this.names[0].last_name :
      '';
  },
  street_address: function() {
    let street_address = this.addresses[0].street_address;
    street_address = street_address.split("\n");
    return street_address;
  },
  disabledUserFA: function() {
    if (!this.state) {
      return '<i class="fa fa-lock"></i>';
    }
    if (this.state && this.state.status && this.state.status === 'disabled') {
      return '<i class="fa fa-unlock"></i>';
    } else {
      return '<i class="fa fa-lock"></i>';
    }
  },
  roles: function() {
    return Meteor.roles.find();
  },
  selected: function() {
    const self = this;
    const this_user = Meteor.users.findOne({_id: Session.get("params.userID")});
    if (this_user) {
      const roles = this_user.roles;
      if (roles) {
        if (roles.indexOf(self.name) > -1) {
          return 'selected';
        }
      }
    }
  }
});

Template.OtherUserProfile.events({
  'click .disable-enable-user': function() {
    console.log("got remove");

    const self = this;

    let toggleState;

    if (self.state && self.state.status && self.state.status === 'disabled') {
      toggleState = 'enabled';
    } else {
      toggleState = 'disabled';
    }

    swal({
      title: "Are you sure?",
      text: "Are you sure you want to " + toggleState.slice(0, -1) + " this user?",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes",
      cancelButtonText: "Nevermind",
      closeOnConfirm: false,
      closeOnCancel: true,
      showLoaderOnConfirm: true
    }, function(isConfirm) {
      if (isConfirm) {
        Meteor.call( 'set_user_state', self._id, toggleState, function( error, response ) {
          if ( error ) {
            console.log(error);
            swal("Error", "Something went wrong", "error");
          } else {
            console.log(response);
            swal({title: "Done", text: "The user was " + toggleState + ".", type: 'success'}, function() {
              // self.state.status === 'enabled' because self is a copy of the
              // data that was set when we started this call
              if (self.state.status === 'enabled' &&
                Session.equals("showSingleUserDashboard", true)) {
                $(".cancel-button").click();
              }
            });
          }
        });
      }
    });
  },
  'click .forgot-password': function(e) {
    const resetButton = $(e.currentTarget).button('loading');
    const self = this;

    swal({
      title: "Are you sure?",
      text: "Are you sure you want to send a password reset to this user?",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: "Yes, send it!",
      cancelButtonText: "Nevermind",
      closeOnConfirm: false,
      closeOnCancel: true,
      showLoaderOnConfirm: true
    }, function(isConfirm) {
      if (isConfirm) {
        Accounts.forgotPassword({email: self.emails[0].address}, function( err ) {
          if (err) console.error(err);
          else swal("Sent", "The user was sent a password reset email.", 'success');
          resetButton.button( 'reset' );
        } );
      } else {
        resetButton.button( 'reset' );
      }
    });
  },
  'click .cancel-button': function() {
    console.log("Clicked cancel");
    Session.delete("params.userID");
    Session.delete("activeTab");
    Router.go('ManageUsers');

    Session.set("addingNew", false);
    Session.delete("showSingleUserDashboard");
    Session.delete("got_all_donations");
    Session.delete("NotDTUser");
    Session.delete("persona_info_exists");
  },
  'click #viewHistory': function() {
    Session.set("showHistory", false);
  },
  'click .edit_address': function() {
    // setup modal for entering give toward information
    $('#modal_for_address_change').modal({show: true, static: true});
  },
  'submit form': function(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    const fields = {
      address: {
        'address_line1': $('#line1').val(),
        'address_line2': $('#line2').val(),
        'city': $('#city').val(),
        'state': $('#state').val(),
        'postal_code': $('#zip').val()
      },
      phone: $('#phone').val()
    };

    $(':submit').button('loading');

    Meteor.call('update_customer',
      fields,
      Number(Session.get('activeTab')),
      Session.get('params.userID'), function(error, result) {
        if (result) {
          $('#modal_for_address_change').modal('hide');
          $(':submit').button("reset");
          Bert.alert("This user is being updated now.", "success");
        } else {
          console.log(error);
          $(':submit').button("reset");
          Bert.alert("That didn't work. Please try again. If it still doesn't work, " +
          "then please let us know, we'll check into this error." + error, "danger");
        }
      });
  },
  'click .previous': function(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    if (Number(Session.get('dt_donations_cursor') > 9)) {
      Session.set('dt_donations_cursor', Number(Session.get('dt_donations_cursor') - 10));
    }
  },
  'click .next': function(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    Session.set('dt_donations_cursor', Number(Session.get('dt_donations_cursor') + 10));
  },
  'click .clickable_row': function() {
    const transaction_id = this.transaction_id;
    Router.go($(".clickable_row[data-dt-transaction-id='" + transaction_id + "']").data("href"));
  },
  'click #myTabs a': function() {
    Session.set('activeTab', this.id);
  },
  'click #update_roles': function(e) {
    e.preventDefault();

    $("#update_roles").button("loading");
    const roles = $("#select-roles").val();

    Meteor.call('update_user_roles', roles, Session.get("params.userID"), function(error, result) {
      if (result) {
        console.log(result);
        $("#update_roles").button("reset");
        Bert.alert("This user's roles have been updated.", "success");
      } else {
        console.log(error);
        $("#update_roles").button("reset");
        Bert.alert("That didn't work. Please try again. If it still doesn't work, " +
          "then please let us know, we'll check into this error." + error, "danger");
      }
    });
  }
});

Template.OtherUserProfile.onRendered(function() {
  const selected_user = Meteor.users.findOne({_id: Session.get("params.userID")});
  if (!selected_user) {
    return;
  }

  if (!selected_user.persona_info ||
    ( selected_user && selected_user.persona_info && selected_user.persona_info.length < 1 ) ||
    ( selected_user && selected_user.persona_info && selected_user.persona_info.length <
    ( selected_user && selected_user.persona_ids && selected_user.persona_ids.length ) ) ||
    ( selected_user && selected_user.persona_info && selected_user.persona_info.length <
    ( selected_user && selected_user.persona_id && selected_user.persona_id.length ) ) ) {
    Meteor.call( 'update_user_document_by_adding_persona_details_for_each_persona_id', Session.get("params.userID"), function( error, result ) {
      if ( result ) {
        if (result === 'Not a DT user') {
          Session.set("NotDTUser", true);
          return;
        }
        Session.set("got_all_donations", true);
        Meteor.setTimeout(function() {
          Session.set( "showSingleUserDashboard", true);
        }, 0);
        Session.set("showSingleUserDashboard", false);
      } else {
        console.log( error );
      }
    } );
  } else if (!Session.equals("got_all_donations", true)) {
    Meteor.call("get_all_donations_for_this_donor", Session.get("params.userID"), function(error, result) {
      if ( result ) {
        Session.set("got_all_donations", true);
      } else {
        console.log( error );
      }
    });
  }

  Session.setDefault('dt_donations_cursor', 0);
  Session.set("showHistory", true);

  // Make sure the user can't enter anything, except what would go in a phone number field
  $("[name='profile.phone']").mask("(999)999-9999");

  // Setup parsley form validation
  $('#userAddressForm').parsley();

  $('[data-toggle="popover"]').popover({html: true});


  $('.tab-pane:first').addClass('active');

  Session.set('activeTab', $('.active a').attr('value'));
});

