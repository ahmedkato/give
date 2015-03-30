Meteor.methods({
    stripeDonation: function(data, paymentDevice, type){
        logger.info("Started stripeDonation");
        /*try {*/
            //Check the form to make sure nothing malicious is being submitted to the server
            Utils.checkFormFields(data);
            console.log(data.paymentInformation.start_date);
            var customerData;
            //Convert donation to more readable format
            var donateTo = Utils.getDonateTo(data.paymentInformation.donateTo);

            if(donateTo === 'Write In') {
                donateTo = data.paymentInformation.writeIn;
            }

            // Does the user exist in the Meteor user's collection?
            var lookupCustomer = Meteor.users.findOne({"emails.address": data.customer.email_address});

            // If the user doesn't exist in the Meteor user's collection, run the below code
            if ( !lookupCustomer ) {
                logger.info("Didn't find that user in the Meteor user's collection.");

                 customerData = Utils.create_customer(data.paymentInformation.token_id, data.customer);
                if(!customerData.object){
                    return {error: customerData.rawType, message: customerData.message};
                }
                Utils.update_card(customerData.id, data.paymentInformation.source_id, data.paymentInformation.saved);
            }
            // If the user does exist in the Meteor user's collection, run the below code
            else{
                logger.info("Found that user in the Meteor user's collection.");
                customerData = Customers.findOne({_id: lookupCustomer.primary_customer_id});
                var device = Utils.link_card_to_customer(customerData._id, data.paymentInformation.token_id, type);
                Utils.update_card(customerData.id, device.id, data.paymentInformation.saved);
            }

            var metadata = {
                created_at: data.paymentInformation.created_at,
                sessionId: data.sessionId,
                URL: data.URL,
                'donateTo': donateTo,
                'donateWith': data.paymentInformation.donateWith,
                'type': data.paymentInformation.type,
                'total_amount': data.paymentInformation.total_amount,
                'amount': data.paymentInformation.amount,
                'fees': data.paymentInformation.fees,
                'coveredTheFees': data.paymentInformation.coverTheFees,
                'customer_id': customerData.id,
                'status': 'pending',
                'frequency': data.paymentInformation.is_recurring,
                'dt_donation_id': null
            };

            data._id = Donations.insert(metadata);
            logger.info("Donation ID: " + data._id);

            var customerInfo = {
                "city": data.customer.city,
                "state": data.customer.region,
                "address_line1": data.customer.address_line1,
                "address_line2": data.customer.address_line2,
                "country": data.customer.country,
                "postal_code": data.customer.postal_code,
                "phone": data.customer.phone_number,
                "business_name": data.customer.org,
                "email": data.customer.email_address,
                "fname": data.customer.fname,
                "lname": data.customer.lname
            };

            for (var attrname in customerInfo) { metadata[attrname] = customerInfo[attrname]; }
            delete metadata.URL;
            delete metadata.created_at;
            delete metadata.sessionId;
            delete metadata.status;
            delete metadata.type;
            delete metadata.total_amount;

            if (data.paymentInformation.is_recurring === "one_time") {

                //Get the card data from balanced and store it
                //var card = Utils.get_card(customerData._id, data.paymentInformation.href);

                //Create a new order
                //var orders = Utils.create_order(data._id, customerData.href);

                //Associate the card with the balanced customer
                //var associate = Utils.create_association(customerData._id, card.href, customerData.href);

                //Charge the card (which also connects this card or bank_account to the customer)
                var charge = Utils.charge(data.paymentInformation.total_amount, data._id, customerData.id, data.paymentInformation.source_id, metadata);
                if(!charge.object){
                    return {error: charge.rawType, message: charge.message};
                }
                Donations.update({_id: data._id}, {$set: {charge_id: charge.id}});
                console.dir(charge);
            }
            else {
                // Print how often it it recurs?
                console.log(data.paymentInformation.is_recurring);

                //Get the check data from balanced and store it
                //var check = Utils.get_check(customerData._id, data.paymentInformation.href);

                //Create a new order
                //var orders = Utils.create_order(data._id, customerData.href);

                //Associate the card with the balanced customer
                //var associate = Utils.create_association(customerData._id, check.href, customerData.href);

                //Start a subscription (which also connects this card, or bank_account to the customer
                console.log("*&*&**&*& " + customerData.id);
                var charge_id =
                    Utils.charge_plan(data.paymentInformation.total_amount,
                        data._id, customerData.id, data.paymentInformation.source_id,
                        data.paymentInformation.is_recurring, data.paymentInformation.start_date, metadata);
                /*if (!charge_id.object) {
                    return {error: charge.rawType, message: charge.message};
                }*/
                return {c: customerData.id, don: data._id, charge: charge_id};
            }
            return {c: customerData.id, don: data._id, charge: charge.id};

        /*} catch (e) {
            logger.error("Got to catch error area of processPayment function." + e + " " + e.reason);
            logger.error("e.category_code = " + e.category_code + " e.descriptoin = " + e.description);
            if(e.category_code) {
                logger.error("Got to catch error area of create_associate. ID: " + data._id + " Category Code: " + e.category_code + ' Description: ' + e.description);
                var debitSubmitted = '';
                if(e.category_code === 'invalid-routing-number'){
                    debitSubmitted = false;
                }
                Donations.update(data._id, {
                    $set: {
                        'failed.category_code': e.category_code,
                        'failed.description': e.description,
                        'failed.eventID': e.request_id,
                        'debit.status': 'failed',
                        'debit.submitted': debitSubmitted
                    }
                });
                throw new Meteor.Error(500, e.category_code, e.description);
            } else {
                throw new Meteor.Error(500, e.reason, e.details);
            }
        }*/
    }
});
