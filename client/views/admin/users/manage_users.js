import { setDocHeight, updateSearchVal } from '/imports/api/miscFunctions';

Template.ManageUsers.onCreated(function() {
  Session.set("documentLimit", 25);

  this.autorun(()=> {
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
  checkForAdminRole() {
    if (Roles.userIsInRole(Meteor.user(), 'super-admin')) {
      return true;
    }
  },
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
    Router.go('/dashboard/user/' + this._id);
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
  Session.delete("NotDTUser");
  $(window).unbind('scroll');
});
