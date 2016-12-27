Template.DonationToItems.onRendered(function() {
  const config = ConfigDoc();
  const writeInDonationTypeId = config.Settings.DonorTools.writeInDonationTypeId;

  $('[data-toggle="popover"]').popover();

  // setup modal for entering give toward information
  if (writeInDonationTypeId.indexOf(Session.get('params.donateTo')) !== -1 && !(Session.equals('showWriteIn', 'no'))) {
    $('#modal_for_write_in').modal({
      show: true,
      backdrop: 'static'
    });
  }

  // setup modal for entering give toward information
  if ( Session.equals( 'params.donateTo', 'trips' ) ) {
    $( '#modal_for_trips' ).modal( {
      show: true,
      backdrop: 'static'
    } );
  }

  $( "[name='donateTo']" ).change();
});

Template.DonationToItems.helpers( {
  DonationFormItems() {
    return DonationFormItems.find( { item: { $exists: true } } );
  }
});
