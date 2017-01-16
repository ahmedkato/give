Template.DonationTo.onCreated(function() {
  this.autorun(()=>{
    this.subscribe("userDTFunds");
  });
});

Template.DonationTo.helpers({
  selectableDesignation() {
    if (Session.get("params.donateTo")) {
      const config = ConfigDoc();
      const givingOptions = config && config.Giving && config.Giving.options;

      const members = [];
      givingOptions.forEach(function( item ) {
        if (item.id) {
          members.push(item);
        }
      });

      const itemExists = $.grep(members, function(e) {
        return e.id === (DonationFormItems.findOne( { name: 'first' } ) &&
          DonationFormItems.findOne( { name: 'first' } ).donateTo);
      }).length;

      const donationSplits = DonationSplits.findOne() && DonationSplits.findOne().splits;
      let itemExistsInSplit;
      if (donationSplits && donationSplits.length > 0) {
        itemExistsInSplit = $.grep(donationSplits, function(e) {return e.id === $("[name='donateTo']").val();}).length;
      }

      if ( (itemExists !== 0) || (itemExistsInSplit && itemExistsInSplit !== 0) ) {
        return true;
      } else {
        return false;
      }
    } else {
      return true;
    }
  },
  firstMemo() {
    const donationItem = DonationFormItems.findOne({name: "first"});
    return donationItem && donationItem.memo;
  }
});

Template.DonationTo.events({
  'change [name="donateTo"]'() {
    const config = ConfigDoc();
    const writeInDonationTypeId = config.Settings.DonorTools.writeInDonationTypeId;

    if (writeInDonationTypeId.indexOf(Number($('[name="donateTo"]').val())) === -1 ) {
      Session.set('showWriteIn', 'no');
      // setup modal for entering give toward information
      if ($('[name="donateTo"]').val() && $('[name="donateTo"]').val().toLowerCase() === 'trips') {
        $('#modal_for_trips').modal({
          show: true,
          backdrop: 'static'
        });
      }
    } else {
      Session.set('showWriteIn', 'yes');
      // setup modal for entering give toward information
      $('#modal_for_write_in').modal({
        show: true,
        backdrop: 'static'
      });
    }
    Session.set('params.donateTo', $('[name="donateTo"]').val());
  }
});

Template.DonationTo.onRendered(function() {
  if (Session.get('params.donateTo')) {
    $('[name="donateTo"]').val(Session.get('params.donateTo'));
  }
  if (Session.get('params.donateWith')) {
    $("#donateWith").val(Session.get('params.donateWith'));
  }
  if (Session.get('params.donateWith') === 'Check') {
    Session.set("paymentMethod", 'Check');
  } else {
    Session.set("paymentMethod", 'Card');
  }
  if (Session.get('params.recurring')) {
    $("#is_recurring").val(Session.get('params.recurring'));
  }
});
