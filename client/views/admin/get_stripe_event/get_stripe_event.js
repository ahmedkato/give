/*****************************************************************************/
/* GetStripeEvent: Event Handlers */
/*****************************************************************************/
Template.GetStripeEvent.events({
    'submit form': function (e) {
        e.preventDefault();

        console.log("Form Submited");
        console.log($('#event-id').val());

        Meteor.call("GetStripeEvent", $('#event-id').val(), function(err, result){
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