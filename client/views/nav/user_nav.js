import { clearImage } from '/imports/api/miscFunctions';

Template.UserNav.onCreated(function () {
  this.autorun(()=>{
    Meteor.subscribe('files.images.all');
  });
});

Template.UserNav.onRendered(function () {
  materialadmin.AppOffcanvas.initialize($("#offcanvas-what-is-new"));
  $('[data-toggle="popover"]').popover({html: true});
  let config = ConfigDoc();
  // This area is for loading any analytics
  if (config && config.Services && config.Services.Analytics && config.Services.Analytics.heapId) {
    window.heap = window.heap || [], heap.load = function ( e, t ) {
      window.heap.appid = e, window.heap.config = t = t || {};
      var n = t.forceSSL || "https:" === document.location.protocol, a = document.createElement( "script" );
      a.type = "text/javascript", a.async = !0, a.src = (n ? "https:" : "http:") + "//cdn.heapanalytics.com/js/heap-" + e + ".js";
      var o = document.getElementsByTagName( "script" )[0];
      o.parentNode.insertBefore( a, o );
      for( var r = function ( e ) {
        return function () {
          heap.push( [e].concat( Array.prototype.slice.call( arguments, 0 ) ) )
        }
      }, p = ["clearEventProperties", "identify", "setEventProperties",
              "track",
              "unsetEventProperty"], c = 0; c < p.length; c++ )heap[p[c]] = r( p[c] )
    };
    heap.load( config.Services.Analytics.heapId );
  }

});

Template.UserNav.helpers({
  dismissedNewStuff: function () {
    let newStuffVersion = Meteor.user() && Meteor.user().profile &&
      Meteor.user().profile.newStuffVersion;
    if (newStuffVersion && newStuffVersion > Meteor.settings.public.newStuffVersion) {
      return true;
    } else {
      return false;
    }
  },
  notAdmin() {
    if (Meteor.userId()) {
      return !Roles.userIsInRole( Meteor.userId(), 'admin' );
    }
    return true;
  }
});

Template.UserNav.events({
  'click #nav-password': function(evt){
    evt.preventDefault();
    Router.go('changePwd');
  },
  'click #nav-sign-out': function(evt){
    evt.preventDefault();
    AccountsTemplates.logout();
  },
  'click #nav-profile': function(evt){
    evt.preventDefault();
    Router.go('user.profile');
  },
  'click #nav-subscriptions': function(evt){
    evt.preventDefault();
    Session.set('addingNewCreditCard', false);
    Router.go('subscriptions');
  },
  'click .clear-image': function(e) {
    let type = $(e.currentTarget).data('el-type');
    return clearImage(type);
  }
});


