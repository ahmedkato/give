_.extend(Utils, {
    getDonateTo: function (donateTo) {
        var returnToCalled;
        switch (donateTo) {
            case 'WriteIn':
                return 'Write In';
            case 'JoshuaBechard':
                returnToCalled = 'Joshua Bechard';
                return returnToCalled;
                break;
            case 'JamesHishmeh':
                returnToCalled = 'James Hishmeh';
                return returnToCalled;
                break;
            case 'WillieBrooks':
                returnToCalled = 'Willie Brooks';
                return returnToCalled;
                break;
            case 'WhereMostNeeded':
                returnToCalled = 'Where Most Needed';
                return returnToCalled;
                break;
            case 'TimmCollins':
                returnToCalled = 'Timm Collins';
                return returnToCalled;
                break;
            case 'JonDeMeo':
                returnToCalled = 'Jon DeMeo';
                return returnToCalled;
                break;
            case 'BrettDurbin':
                returnToCalled = 'Brett Durbin';
                return returnToCalled;
                break;
            case 'JohnKazaklis':
                returnToCalled = 'John Kazaklis';
                return returnToCalled;
                break;
            case 'ChrisMammoliti':
                returnToCalled = 'Chris Mammoliti';
                return returnToCalled;
                break;
            case 'ShelleySetchell':
                returnToCalled = 'Shelley Setchell';
                return returnToCalled;
                break;
            case 'IsaacTarwater':
                returnToCalled = 'Isaac Tarwater';
                return returnToCalled;
                break;
            case 'UrgentOperationalNeeds':
                returnToCalled = 'Urgent Operational Needs';
                return returnToCalled;
                break;
            case 'DRUrgent':
                returnToCalled = 'DR Urgent';
                return returnToCalled;
                break;
            case 'DRCS':
                returnToCalled = 'Santiago, DR - Community Sponsorship';
                return returnToCalled;
                break;
            case 'DRInfrastructure':
                returnToCalled = 'DR Infrastructure';
                return returnToCalled;
                break;
            case 'HondurasUrgent':
                returnToCalled = 'Honduras Urgent';
                return returnToCalled;
                break;
            case 'HondurasCS':
                returnToCalled = 'Honduras Community Sponsorship';
                return returnToCalled;
                break;
            case 'HondurasInfrastructure':
                returnToCalled = 'Honduras Infrastructure';
                return returnToCalled;
                break;
            case 'PhilippinesUrgent':
                returnToCalled = 'Philippines Urgent';
                return returnToCalled;
                break;
            case 'PhilippinesCS':
                returnToCalled = 'Tanza, Philippines - Community Sponsorship';
                return returnToCalled;
                break;
            case 'PhilippinesInfrastructure':
                returnToCalled = 'Philippines Infrastructure';
                return returnToCalled;
                break;
            default:
                returnToCalled = 'Where Most Needed';
                return returnToCalled;
        }
    },
    create_customer: function (paymentDevice, customerInfo) {
        logger.info("Inside create_customer.");

        var stripeCustomer = new Future();
        var type;
        if (paymentDevice.slice(0, 2) === 'to') {
            type = "card";
            Stripe.customers.create({
                card: paymentDevice,
                email: customerInfo.email_address,
                metadata: {
                    "city": customerInfo.city,
                    "state": customerInfo.region,
                    "address_line1": customerInfo.address_line1,
                    "address_line2": customerInfo.address_line2,
                    "country": customerInfo.country,
                    "postal_code": customerInfo.postal_code,
                    "phone": customerInfo.phone_number,
                    "business_name": customerInfo.org,
                    "email": customerInfo.email_address,
                    "fname": customerInfo.fname,
                    "lname": customerInfo.lname
                }
            }, function (error, customer) {
                if (error) {
                    //console.dir(error);
                    stripeCustomer.return(error);
                } else {
                    stripeCustomer.return(customer);
                }
            });
        } else if (paymentDevice.slice(0, 2) === 'bt') {
            /**/
            console.log("Bank_account");
            type = "bank_account";
            Stripe.customers.create({
                bank_account: paymentDevice,
                email: customerInfo.email_address,
                metadata: {
                    "city": customerInfo.city,
                    "state": customerInfo.region,
                    "address_line1": customerInfo.address_line1,
                    "address_line2": customerInfo.address_line2,
                    "postal_code": customerInfo.postal_code,
                    "country": customerInfo.country,
                    "phone": customerInfo.phone_number,
                    "business_name": customerInfo.org,
                    "email": customerInfo.email_address,
                    "fname": customerInfo.fname,
                    "lname": customerInfo.lname
                }
            }, function (error, customer) {
                if (error) {
                    //console.dir(error);
                    stripeCustomer.return(error);
                } else {
                    stripeCustomer.return(customer);
                }
            });
        } else {
            throw new Meteor.Error('Token-match', "Sorry, that token doesn't match any know prefix.");
        }
        stripeCustomer = stripeCustomer.wait();
        if (!stripeCustomer.object) {
            throw new Meteor.Error(stripeCustomer.rawType, stripeCustomer.message);
        }
        stripeCustomer._id = stripeCustomer.id;

        Customers.insert(stripeCustomer);
        logger.info("Customer_id: " + stripeCustomer.id);
        return stripeCustomer;
    },
    charge: function (total, donation_id, customer_id, payment_id, metadata) {
        logger.info("Inside charge.");

        var stripeCharge = new Future();

        Stripe.charges.create({
            amount: total,
            currency: "usd",
            customer: customer_id,
            source: payment_id,
            metadata: metadata
        }, function (error, charge) {
            if (error) {
                //console.dir(error);
                stripeCharge.return(error);
            } else {
                stripeCharge.return(charge);
            }
        });
        stripeCharge = stripeCharge.wait();
        if (!stripeCharge.object) {
            throw new Meteor.Error(stripeCharge.rawType, stripeCharge.message);
        }
        stripeCharge._id = stripeCharge.id;

        // Add charge response from Stripe to the collection
        Charges.insert(stripeCharge);
        logger.info("Finished Stripe charge. Charges ID: " + stripeCharge._id);
        return stripeCharge;
    },
    charge_plan: function (total, donation_id, customer_id, payment_id, frequency, start_date, metadata) {
        logger.info("Inside charge_plan.");
        console.log(start_date);

        var plan, subscription_frequency;
        subscription_frequency = frequency;

        switch (subscription_frequency) {
            case "monthly":
                plan = Meteor.settings.stripe.plan.monthly;
                break;
            case "weekly":
                plan = Meteor.settings.stripe.plan.weekly;
                break;
            case "daily":
                plan = Meteor.settings.stripe.plan.daily;
                break;
        }

        var attributes = {
            plan: plan,
            quantity: total,
            metadata: metadata
        };
        if (start_date === 'today') {
        } else {
            attributes.trial_end = start_date;
        }
        var stripeChargePlan = new Future();
        Stripe.customers.createSubscription(
            customer_id,
            attributes,
            function (error, charge) {
                if (error) {
                    //console.dir(error);
                    stripeChargePlan.return(error);
                } else {
                    stripeChargePlan.return(charge);
                }
            });
        stripeChargePlan = stripeChargePlan.wait();
        if (!stripeChargePlan.object) {
            throw new Meteor.Error(stripeChargePlan.rawType, stripeChargePlan.message);
        }
        stripeChargePlan._id = stripeChargePlan.id;
        console.log("Stripe charge Plan information");
        console.dir(stripeChargePlan);
        // Add charge response from Stripe to the collection
        Subscriptions.insert(stripeChargePlan);
        Donations.update({_id: donation_id}, {$set: {subscription_id: stripeChargePlan.id}});
        if (start_date === 'today') {
            var stripeInvoiceList = new Future();
            // Query Stripe to get the first invoice from this new subscription
            Stripe.invoices.list(
                {customer: customer_id, limit: 1},
                function (error, invoice) {
                    if (error) {
                        stripeInvoiceList.return(error);
                    } else {
                        stripeInvoiceList.return(invoice);
                    }
                });

            stripeInvoiceList = stripeInvoiceList.wait();

            logger.info("Finished Stripe charge_plan. Subscription ID: " + stripeChargePlan.id);
            return stripeInvoiceList.data[0];
        } else {
            Utils.send_scheduled_email(donation_id, stripeChargePlan.id, subscription_frequency, total);
            return 'scheduled';
        }
    },
    audit_email: function (id, type, failure_message, failure_code) {
        if (type === 'charge.pending') {
            Audit_trail.update({charge_id: id}, {
                    $set: {
                        'charge.pending.sent': true,
                        'charge.pending.time': new Date()
                    }
                },
                {
                    upsert: true
                }
            );
        } else if (type === 'charge.succeeded') {
            Audit_trail.update({charge_id: id}, {
                    $set: {
                        'charge.succeeded.sent': true,
                        'charge.succeeded.time': new Date()
                    }
                },
                {
                    upsert: true
                }
            );
        } else if (type === 'large_gift') {
            Audit_trail.update({charge_id: id}, {
                    $set: {
                        'charge.large_gift.sent': true,
                        'charge.large_gift.time': new Date()
                    }
                },
                {
                    upsert: true
                }
            );
        } else if (type === 'charge.failed') {
            Audit_trail.update({charge_id: id}, {
                $set: {
                    'charge.failed.sent':       true,
                    'charge.failed.time':       new Date(),
                    'charge.failure_message':   failure_message,
                    'charge.failure_code':      failure_code
                }
            }, {
                upsert: true
            });
        }
        else if (type === 'subscription.scheduled') {
            Audit_trail.update({subscription_id: id}, {
                $set: {
                    'subscription_scheduled.sent': true,
                    'subscription_scheduled.time': new Date()
                }
            }, {
                upsert: true
            });
        }
    },
    get_frequency_and_subscription: function (invoice_id) {
        logger.info("Started get_frequency");

        var return_this = {};
        return_this.subscription = Invoices.findOne({_id: invoice_id}) && Invoices.findOne({_id: invoice_id}).subscription;
        return_this.frequency = return_this.subscription &&
            Subscriptions.findOne({_id: return_this.subscription}) &&
            Subscriptions.findOne({_id: return_this.subscription}).plan.interval;

        if (return_this.frequency == null || return_this.subscription == null) {
            var get_invoice = Utils.get_invoice(invoice_id);
            if(get_invoice && get_invoice.subscription){
                return_this.subscription = get_invoice.subscription;
                return_this.frequency = get_invoice.lines.data[0].plan.interval;
                return return_this;
            } else{
                logger.error("Something went wrong, there doesn't seem to be an invoice with that id, exiting");
                return;
            }

        }
        return return_this;
    },
    store_stripe_event: function (event_body) {
        logger.info("Started store_stripe_event");
        
        console.dir(event_body);
        event_body.data.object._id = event_body.data.object.id;

        switch(event_body.data.object.object){
            case "customer":
                Customers.upsert({_id: event_body.data.object._id}, event_body.data.object);
                break;
            case "invoice":
                Invoices.upsert({_id: event_body.data.object._id}, event_body.data.object);
                break;
            case "charge":
                Charges.upsert({_id: event_body.data.object._id}, event_body.data.object);
                break;
            case "card":
                Devices.upsert({_id: event_body.data.object._id}, event_body.data.object);
                break;
            case "bank_account":
                Devices.upsert({_id: event_body.data.object._id}, event_body.data.object);
                break;
            case "subscription":
                Subscriptions.upsert({_id: event_body.data.object._id}, event_body.data.object);
                break;
            default:
                logger.error("This event didn't fit any of the configured cases, go into store_stripe_event and add the appropriate case.");

        }
        
    },
    charge_events: function(stripeEvent){
        logger.info("Started charge_events");

        var sync_request = Utils.store_stripe_event(stripeEvent);

        var frequency_and_subscription;
        if(stripeEvent.data.object.invoice) {

            // Get the frequency_and_subscription of this charge, since it is part of a subscription.
            frequency_and_subscription = Utils.get_frequency_and_subscription(stripeEvent.data.object.invoice);
            if(frequency_and_subscription){
                Utils.send_donation_email(true, stripeEvent.data.object.id, stripeEvent.data.object.amount, stripeEvent.type,
                    stripeEvent, frequency_and_subscription.frequency, frequency_and_subscription.subscription);
                return;
            } else {
                // null frequency_and_subscription means that either the frequency or the subscription couldn't be found using the invoice id.
                throw new Meteor.error("This event needs to be sent again, since we couldn't find enough information to send an email.");
                return;
            }
        } else {
            Utils.send_donation_email(false, stripeEvent.data.object.id, stripeEvent.data.object.amount, stripeEvent.type,
                stripeEvent, "One Time", null);
            return;
        }
    },
    link_card_to_customer: function(customer_id, token_id, type, customerInfo){
        logger.info("Started link_card_to_customer");

        var stripeCreateCard = new Future();
        var payment_device = {};

        if(type === 'card') {
            payment_device.card = token_id;
        } else{
            payment_device.bank_account = token_id;
        }

        Stripe.customers.createCard(
            customer_id,
            payment_device,
            function (error, card) {
                if (error) {
                    //console.dir(error);
                    stripeCreateCard.return(error);
                } else {
                    stripeCreateCard.return(card);
                }
            }
        );

        stripeCreateCard = stripeCreateCard.wait();

        if (!stripeCreateCard.object) {
            if(stripeCreateCard.message === "A bank account with that routing number and account number already exists for this customer."){
                logger.info("Woops, that is a duplicate account, running the create customer function to fix this.");
                var customer = Utils.create_customer(token_id, customerInfo);
                return customer;
            }
            throw new Meteor.Error(stripeCreateCard.rawType, stripeCreateCard.message);
        }

        stripeCreateCard._id = stripeCreateCard.id;
        console.dir(stripeCreateCard);

        return stripeCreateCard;
    },
    update_card: function(customer_id, card_id, saved){
        logger.info("Started update_card");
        logger.info("Customer: " + customer_id + " card_id: " + card_id + " saved: " + saved);

        var stripeUpdatedCard = new Future();

        Stripe.customers.updateCard(
            customer_id,
            card_id,{
                metadata: {
                    saved: saved
                }
            },
            function (error, card) {
                if (error) {
                    //console.dir(error);
                    stripeUpdatedCard.return(error);
                } else {
                    stripeUpdatedCard.return(card);
                }
            }
        );

        stripeUpdatedCard = stripeUpdatedCard.wait();

        if (!stripeUpdatedCard.object) {
            throw new Meteor.Error(stripeUpdatedCard.rawType, stripeUpdatedCard.message);
        }

        stripeUpdatedCard._id = stripeUpdatedCard.id;
        console.dir(stripeUpdatedCard);

        return stripeUpdatedCard;
    },
    add_meta_from_subscription_to_charge: function(stripeEvent) {
        logger.info("Started add_meta_from_subscription_to_charge");

        // setup a cursor for this subscription
        var subscription_cursor = Subscriptions.findOne({_id: stripeEvent.data.object.subscription});

        // update the charges document to add the metadata, this way the related gift information is attached to the charge
        Charges.update({_id: stripeEvent.data.object.charge}, {$set: subscription_cursor.metadata});
    },
    stripe_get_subscription: function(invoice_id){
        logger.info("Started stripe_get_subscription");

    },
    update_stripe_customer: function(form, customer_id){
        logger.info("Inside update_stripe_customer.");
        console.log(form.address.city);

        var stripeCustomerUpdate = new Future();

        Stripe.customers.update(customer_id, {
                "metadata": {
                    "city":            form.address.city,
                    "state":           form.address.state,
                    "address_line1":   form.address.address_line1,
                    "address_line2":   form.address.address_line2,
                    "postal_code":     form.address.postal_code,
                    "phone":           form.phone
                }
            }, function (error, customer) {
                if (error) {
                    //console.dir(error);
                    stripeCustomerUpdate.return(error);
                } else {
                    stripeCustomerUpdate.return(customer);
                }
            }
        );

        stripeCustomerUpdate = stripeCustomerUpdate.wait();

        if (!stripeCustomerUpdate.object) {
            throw new Meteor.Error(stripeCustomerUpdate.rawType, stripeCustomerUpdate.message);
        }

        console.dir(stripeCustomerUpdate);

        return stripeCustomerUpdate;
    },
    update_stripe_customer_user: function(customer_id, user_id){
        logger.info("Inside update_stripe_customer_user.");
        console.log(user_id);

        var stripeCustomerUserUpdate = new Future();

        Stripe.customers.update(customer_id, {
                "metadata": {
                    "user_id": user_id
                }
            }, function (error, customer) {
                if (error) {
                    //console.dir(error);
                    stripeCustomerUserUpdate.return(error);
                } else {
                    stripeCustomerUserUpdate.return(customer);
                }
            }
        );

        stripeCustomerUserUpdate = stripeCustomerUserUpdate.wait();

        if (!stripeCustomerUserUpdate.object) {
            throw new Meteor.Error(stripeCustomerUserUpdate.rawType, stripeCustomerUserUpdate.message);
        }

        console.dir(stripeCustomerUserUpdate);

        return stripeCustomerUserUpdate;
    },
    check_charge_status: function(charge_id){
        logger.info("Inside check_charge_status");

        // Because the pending status is the only one that couldn't have been the second event thrown we need to check
        // if there is already a stored charge and if so then I don't want to override it with a pending status
        var check_status = Charges.find({_id: charge_id});

        if(check_status){
            return true;
        }
        else{
            return false;
        }
    },
    get_invoice: function(invoice_id){
        logger.info("Inside get_invoice");

        var stripeInvoice = new Future();

        Stripe.invocices.retrieve(invoice_id,
            function (error, invoice) {
                if (error) {
                    //console.dir(error);
                    stripeInvoice.return(error);
                } else {
                    stripeInvoice.return(invoice);
                }
            }
        );

        stripeInvoice = stripeInvoice.wait();

        if (!stripeInvoice.object) {
            throw new Meteor.Error(stripeInvoice.rawType, stripeInvoice.message);
        }

        console.dir(stripeInvoice);

        return stripeInvoice;
    }
});
