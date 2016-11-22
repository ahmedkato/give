Template.DonationTo.onCreated(function () {
  this.autorun(()=>{
    this.subscribe("userDTFunds");
  });
});

Template.DonationTo.events({
  'change [name="donateTo"]': function() {

    let config = ConfigDoc();
    let writeInDonationTypeId = config.Settings.DonorTools.writeInDonationTypeId;

    if (writeInDonationTypeId.indexOf(Number($('[name="donateTo"]').val())) === -1 ) {
      $('#giftNoteText').hide();
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
  if(Session.get('params.donateWith') === 'Check') {
    Session.set("paymentMethod", 'Check');
  } else {
    Session.set("paymentMethod", 'Card');
  }
  if(Session.get('params.recurring')) {
    $("#is_recurring").val(Session.get('params.recurring'));
  }
});
