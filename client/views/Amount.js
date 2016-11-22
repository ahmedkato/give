Template.Amount.helpers({
  amount: function() {
    if(!Session.get('subscription')){
      return Session.get('params.amount');
    } else {
      if(Session.get("change_amount")){
        return Session.get('change_amount') / 100;
      } else {
        return DonationFormItems.findOne({name: 'first'}) && DonationFormItems.findOne({name: 'first'}).amount / 100;
      }
    }
  },
});

Template.Amount.events({
  'keyup, change [name="amount"]': function() {
    Give.updateTotal();
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
    DonationFormItems.insert({item: $(".clonedInput").length++, amount: ""});
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
    DonationFormItems.update( {name: 'first'}, {
      $set: {
        amount: parseInt( ( Give.getCleanValue( e.target ) * 100).toFixed( 0 ), 10 ),
      }
    });
  },
  'keyup [name="splitAmount"], change [name="splitAmount"]'(e){
    DonationFormItems.update( {_id: this._id}, {
      $set: {
        amount: parseInt( ( Give.getCleanValue( e.target ) * 100).toFixed( 0 ), 10 ),
      }
    });
  },
  'change [name="donateTo"]'(e){
    if (DonationFormItems && DonationFormItems.findOne()){
      DonationFormItems.update( {name: 'first'}, {
        $set: {
          donateTo: $( e.target ).val(),
        }
      });
    }
  },
  'change [name="donateToDuplicate"]'(e){
    DonationFormItems.update( {_id: this._id }, {
      $set: {
        donateTo: $( e.target ).val()
      }
    } );
  },
});