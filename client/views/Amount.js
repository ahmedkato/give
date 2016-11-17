Template.Amount.helpers({
  amount: function() {
    return Session.get('params.amount');
  },
});

Template.Amount.events({
  'keyup, change [name="amount"]': function() {
    return Give.updateTotal(this._id);
  },
  // disable mousewheel on a input number field when in focus
  // (to prevent Chromium browsers change of the value when scrolling)
  'focus [name="amount"]': function() {
    $('[name="amount"]').on('mousewheel.disableScroll', function(e) {
      e.preventDefault();
    });
  },
  'blur [name="amount"]': function() {
    $('[name="amount"]').on('mousewheel.disableScroll', function(e) {
      e.preventDefault();
    });
    return Give.updateTotal();
  },
  'change #coverTheFees': function() {
    return Give.updateTotal();
  },
  'click #cloneButton'(){
    DonationFormItems.insert({item: $(".clonedInput").length++});
    Meteor.setTimeout(()=>{
      $('#donation_form').parsley();
      $('[data-toggle="popover"]').popover({html: true});
      $('[name="donateToDuplicate"]').change();
    }, 500);
  },
  'click [name="remove-button"]'(){
    DonationFormItems.remove({_id: this._id});
    $('.popover').popover('destroy');
    Meteor.setTimeout(()=>{
      $('[data-toggle="popover"]').popover({html: true});
      Give.updateTotal();
    },200);
  },
  'keyup [name="amount"], change [name="amount"], blur [name="amount"]'(e){
    console.log( $( e.target ).val() );
    DonationFormItems.update( {name: 'first'}, {
      $set: {
        amount: parseInt( ( Give.getCleanValue( e.target ) * 100).toFixed( 0 ), 10 ),
      }
    });
  },
  'keyup [name="splitAmount"], change [name="splitAmount"]'(e){
    console.log( $( e.target ).val() );
    DonationFormItems.update( {_id: this._id}, {
      $set: {
        amount: parseInt( ( Give.getCleanValue( e.target ) * 100).toFixed( 0 ), 10 ),
      }
    });
  },
  'change [name="donateTo"]'(e){
    DonationFormItems.update( {name: 'first'}, {
      $set: {
        donateTo: $( e.target ).val(),
      }
    });
  },
  'change [name="donateToDuplicate"]'(e){
    console.log( $( e.target ).val() );
    console.log( this._id);
    DonationFormItems.update( {_id: this._id }, {
      $set: {
        donateTo: $( e.target ).val()
      }
    } );
  },
});