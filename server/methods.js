/*
 * Data: Read Users
 * Methods for reading user data in the database.
 */

Meteor.methods({

    checkUserPlan: function(user){
        // Check our user argument against our expected pattern.
        check(user, String);

        // Query for our user and get their current plan information.
        var getUser      = Meteor.users.findOne({"_id": user}, {fields: {"subscription": 1}}),
            subscription = getUser.subscription;

        // Find the correct plan in our plans array (defined in /settings.json).
        var availablePlans = Meteor.settings.public.plans;
        var currentPlan    = _.find(availablePlans, function(plan){ return plan.name == subscription.plan.name; });
        var limit          = currentPlan.limit;
        var amount         = currentPlan.amount.usd;

        // If we get a plan and limit back, return them to the client for use. Here,
        // we use a ternary to check whether the limit is greater than one so that
        // we can append the correct contextual string to it.
        if( subscription && limit ){
            var planData = {
                subscription: subscription,
                limit: limit > 1 ? limit + " lists" : limit + " list",
                amount: amount
            }
            return planData;
        } else {
            return false;
        }
    }

});
