Template.DonationToItems.helpers( {
  DonationFormItems(){
    return DonationFormItems.find( { item: { $exists: true } } );
  },
});