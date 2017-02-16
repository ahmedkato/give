import { setDocHeight, updateSearchVal } from '/imports/api/miscFunctions';


AutoForm.hooks({
  'edit-user-form': {
    onSuccess: function(operation, result) {
      Session.set("addingNew", false);
      Bert.alert( result, 'success', 'growl-bottom-right' );
      Router.go("/dashboard/users");
    },

    onError: function(operation, error) {
      console.log(error);
      console.log(operation);

      Bert.alert( error.message, 'danger', 'growl-bottom-right' );
    },
    onSubmit: function() {
      return this.event.preventDefault();
    }
  }
});

Template.ManageUsers.onCreated(function() {
  Session.set("documentLimit", 10);

  this.autorun(()=> {
    if (Session.get("params.userID")) {
      if ( Meteor.users.findOne( { _id: Session.get( "params.userID" ) } ) &&
        Meteor.users.findOne( { _id: Session.get( "params.userID" ) } ).persona_info ) {
        Session.set( "persona_info_exists", true );
        try {
          const selectedUser = Meteor.users.find({_id: Session.get("params.userID")});

          const selectedPersonaInfo = selectedUser && selectedUser.persona_info;
          const selectedPersonaIds = selectedUser && selectedUser.persona_ids;

          if (!selectedPersonaInfo || !selectedPersonaIds ||
            ( selectedPersonaInfo && selectedPersonaInfo.length < 1 ) ||
            ( selectedPersonaInfo && selectedPersonaInfo.length <
            ( selectedPersonaIds && selectedPersonaIds.length ) ) ||
            ( selectedPersonaInfo && selectedPersonaInfo.length <
            ( selectedUser && selectedUser.persona_id && selectedUser.persona_id.length ) ) && !Session.get("got_all_donations") ) {
            console.log("Got here");
            Meteor.call('update_user_document_by_adding_persona_details_for_each_persona_id', Session.get("params.userID"), function(error, result) {
              if (result) {
                if (result === 'Not a DT user') {
                  Session.set("NotDTUser", true);
                  return;
                }
                console.log(result);
                Session.set("got_all_donations", true);
                // Hack here to reload the page. I'm not sure why the reactivity isn't
                // showing the new information, when the persona_info is pulled down
                // for now we just reload the page and the problem is resolved.
                // location.reload();
              } else {
                console.log(error);
                throw new Meteor.Error("400", "Couldn't retrieve any Donor Tools information for this user.");
              }
            });
          }
          Meteor.call("get_all_donations_for_this_donor", Session.get("params.userID"), function(error, result) {
            if (result) {
              console.log(result);
              Session.set("got_all_donations", true);
            } else {
              console.log(error);
            }
          });
        } catch (e) {
          throw new Meteor.Error(500, e);
        }
      } else {
        Session.set( "persona_info_exists", false );
      }
      Session.set("showSingleUserDashboard", true);
    } else {
      Session.set('params.userID', '');
      Session.set("showSingleUserDashboard", false);
    }

    this.subscribe( 'all_users', Session.get('params.userID'), Session.get("searchValue"), Session.get("documentLimit") );
    this.subscribe('roles');
    this.subscribe('userStripeData', Session.get('params.userID'));
    this.subscribe('userDTFunds');
  });
});

Template.ManageUsers.onRendered(function() {
  setDocHeight();
});

Template.ManageUsers.helpers({
  user: function() {
    return Meteor.users.findOne({_id: Session.get("params.userID")});
  },
  users: function() {
    return Meteor.users.find();
  },
  schema: function() {
    return Schema.UpdateUserFormSchema;
  },
  roles: function() {
    return Meteor.roles.find();
  },
  user_roles: function() {
    return this.roles;
  },
  selected: function() {
    const editUserID = Session.get("params.userID");
    if (editUserID) {
      const thisUser = Meteor.users.findOne({_id: editUserID});
      if ( thisUser && thisUser.roles && thisUser.roles.indexOf( this.name ) > -1 ) {
        return 'selected';
      }
    } else {
      return;
    }
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
  toggleUserText: function() {
    if (this.state && this.state.status && this.state.status === 'disabled') {
      return "Enable User";
    } else {
      return "Disable User";
    }
  },
  disabledIfDisabled: function() {
    if (this.state && this.state.status && this.state.status === 'disabled') {
      return "disabled";
    } else {
      return "";
    }
  },
  showSingleUser: function() {
    return Session.equals("showSingleUserDashboard", true);
  },
  persona_info: function() {
    return Session.equals("persona_info_exists", true);
  },
  showAdminModal() {
    return Session.get("gift_user_id");
  }
});

Template.ManageUsers.events({
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
  'click .addingNewUser': function( e ) {
    e.preventDefault();
    const addingNew = $(".addingNewUser").data("add");
    Session.set("addingNew", addingNew);
  },
  'click .addingNewRole': function( e ) {
    e.preventDefault();
    const addingNew = $(".addingNewRole").data("add");
    Session.set("addingNew", addingNew);
  },
  'click .edit-user': function() {
    if (Meteor.users.findOne({_id: this._id}) && ( (
      Meteor.users.findOne({_id: this._id}).persona_ids
      && Meteor.users.findOne({_id: this._id}).persona_ids.length > 0)
      || ( Meteor.users.findOne({_id: this._id}).persona_info && Meteor.users.findOne({_id: this._id}).persona_info.length > 0 ) ) ) {
      Router.go('/dashboard/user/' + this._id);
    } else {
      Session.set("params.userID", this._id);
      Session.set("showSingleUserDashboard", true);
      Session.set("NotDTUser", true);
      $(window).unbind('scroll');
    }
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
    setDocHeight();
    Session.delete("params.userID");
    Session.delete("activeTab");

    if (Router.current().params.query && Router.current().params.query.userID) {
      Router.go('ManageUsers');
    }
    Session.set("addingNew", false);
    Session.delete("showSingleUserDashboard");
    Session.delete("got_all_donations");
    Session.delete("NotDTUser");
    Session.delete("persona_info_exists");
  },
  'click .clear-button': function() {
    $(".search").val("").change();
  },
  'keyup, change .search': _.debounce(function() {
    updateSearchVal();
  }, 300),
  'click .new-gift'(e) {
    e.preventDefault();
    Router.go('admin.give', {}, {query: {userID: this._id}});
  }
});

Template.ManageUsers.onDestroyed(function() {
  Session.delete("gift_user_id");
  Session.delete("searchValue");
  $(window).unbind('scroll');
});
