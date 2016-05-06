function setupDonateTo(){
  // This helper doesn't return anything, rather it is used as a reactive
  // helper to retrieve the configuration document
  // It also checks to see if the user used a donateTo=id value that doesn't
  // exist in the designation list. If so, it will find that designation in
  // Donor Tools funds and put it as the selected and only option in the Donation
  // Designation, which prevents users from changing their gift designation if
  // they got to the donate page by a specific campaign link
  let config = ConfigDoc();

  var givingOptions = config && config.Giving && config.Giving.options;

  let donateTo = Session.get("params.donateTo");
  let note = Session.get("params.note");
  let fund = DT_funds.findOne({_id: donateTo});

  if( givingOptions && givingOptions.length > 0 ) {
    if( fund && fund.name ) {
      let fundOptionExistsInGivingOptions = givingOptions.map(function (item){
        return item.id;
      })
        .indexOf(fund.id);
      if(fundOptionExistsInGivingOptions === -1) {
        $( '#donateTo' ).select2( {
          data:             [{ id: donateTo, text: fund.name, type: "option" }],
          dropdownCssClass: 'dropdown-inverse'
        } );
        return;
      }
    }

    $( '#donateTo' ).select2( {
      data:             _.sortBy( givingOptions, 'position' ),
      dropdownCssClass: 'dropdown-inverse',
      placeholder:      "Choose one"
    } );
  }
}

Template.DonationTo.onCreated(function () {
  this.autorun(()=>{
    this.subscribe("userDTFunds");
  });
});

Template.DonationTo.helpers({
  setupDonateToDropwdown: function () {
    setupDonateTo();
  }
});

Template.DonationTo.events({
  'change #donateTo': function() {
    if ($('#donateTo').val() !== 'WriteIn') {
      $('#giftDesignationText').hide();
      Session.set('showWriteIn', 'no');
    } else {
      Session.set('showWriteIn', 'yes');
      // setup modal for entering give toward information
      $('#modal_for_write_in').modal({
        show: true,
        backdrop: 'static'
      }, function(e) {
      });
    }
    Session.set('params.donateTo', $('#donateTo').val());
  }
});

Template.DonationTo.onRendered(function() {
  setupDonateTo();

  if (Session.get('params.donateTo')) {
    $("#donateTo").val(Session.get('params.donateTo'));
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

