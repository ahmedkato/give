function setupDonateToDuplicates(){
  // This helper doesn't return anything, rather it is used as a reactive
  // helper to retrieve the configuration document
  let config = ConfigDoc();

  var givingOptions = config && config.Giving && config.Giving.options;

  if( givingOptions && givingOptions.length > 0 ) {

    $( '[name="donateToDuplicate"]' ).select2( {
      data:             _.sortBy( givingOptions, 'position' ),
      dropdownCssClass: 'dropdown-inverse',
      placeholder:      "Choose one"
    } );
  }
}

Template.DonationToDuplicates.helpers({
  setupDonateToDropdown: function () {
    setupDonateToDuplicates();
  }
});

Template.DonationToDuplicates.onRendered(function() {
  setupDonateToDuplicates();
});