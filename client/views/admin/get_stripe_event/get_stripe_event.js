/*****************************************************************************/
/* GetStripeEvent: Event Handlers */
/*****************************************************************************/
Template.GetStripeEvent.events({
    'submit form': function (e) {
        e.preventDefault();

        console.log("Form Submited");
        console.log($('#event-id').val());
        console.log($('#event-process').is( ":checked" ));

        Meteor.call("GetStripeEvent", $('#event-id').val() ,$('#event-process').is( ":checked" ) , function(err, result){
            if(err){
                console.log(err);
            } else {
                console.log(result);
                $('#get_event_form')[0].reset();
                Bert.alert("Got it", "success");
            }
        })
    }
});