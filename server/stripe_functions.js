_.extend(StripeFunctions, {
  /**
   * Stripe general purpose resource creator
   * Crud (C in CRUD)
   * https://stripe.com/docs/api
   *
   * @method stripe_create
   * @param {String} stripeObject - The main Stripe API Object (e.g. 'customers')
   * @param {Object|String} stripeArgs - One or many arguments to be passed to the Stripe task
   */
  stripe_create: function( stripeObject, stripeArgs ) {
    logger.info("Started stripe_create");
    logger.info(stripeObject, stripeArgs);

    const stripeResource = new Promise(function(resolve, reject) {
      Stripe[stripeObject].create(
        stripeArgs,
        function(err, res) {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        });
    });

    // Fulfill Promise
    return stripeResource.await(
      function(res) {
        logger.info(res);
        return res;
      }, function(err) {
      logger.error(err);
      throw new Meteor.Error(err);
    });
  },
  /**
   * Stripe general purpose resource retriever
   * cRud (R in CRUD)
   * https://stripe.com/docs/api
   *
   * @method stripe_retrieve
   * @param {String} stripeObject - The main Stripe API Object (e.g. 'customers')
   * @param {String} stripeTask - The specific resource within the Stripe Object, (e.g. 'retrieve')
   * @param {Object|String} stripeArgs - One or many arguments to be passed to the Stripe task
   * @param {Object} stripeExpand - The Stripe Object that should be expanded inside the response
   */
  stripe_retrieve: function( stripeObject, stripeTask, stripeArgs, stripeExpand ) {
    logger.info("Started stripe_retrieve");
    logger.info(stripeObject, stripeTask, stripeArgs);

    if (!stripeExpand) {
      const stripeResource = new Promise(function(resolve, reject) {
        Stripe[stripeObject][stripeTask](
          stripeArgs,
          function(err, res) {
            if (err) {
              reject(err);
            } else {
              resolve(res);
            }
          });
      });

      // Fulfill Promise
      return stripeResource.await(
        function(res) {
          logger.info(res);
          return res;
        }, function(err) {
        logger.error(err);
        throw new Meteor.Error(err);
      });
    } else {
      const stripeResource = new Promise(function(resolve, reject) {
        Stripe[stripeObject][stripeTask](
          stripeArgs,
          stripeExpand,
          function(err, res) {
            if (err) {
              reject(err);
            } else {
              resolve(res);
            }
          });
      });

      // Fulfill Promise
      return stripeResource.await(
        function(res) {
          logger.info(res);
          return res;
        }, function(err) {
        logger.error(err);
        throw new Meteor.Error(err);
      });
    }
  },
  /**
   * Stripe general purpose resource updater
   * crUd (U in CRUD)
   * https://stripe.com/docs/api
   *
   * @method stripe_update
   * @param {String} stripeObject - The main Stripe API Object (e.g. 'customers')
   * @param {String} stripeTask - The specific resource within the Stripe Object that should be updated, (e.g. 'updateSubscription')
   * @param {String} stripeID - The id of the specific resource to be updated
   * @param {String} stripeSupportingID - The id of the specific resource that is attached to the primary stripeID
   * @param {Object|String} stripeArgs - One or many arguments to be passed to the Stripe task
   */
  stripe_update: function( stripeObject, stripeTask, stripeID, stripeSupportingID, stripeArgs ) {
    logger.info("Started stripe_update with these parameters: ");
    logger.info(stripeObject, stripeTask, stripeID, stripeSupportingID, stripeArgs);

    if (!stripeSupportingID) {
      const stripeResource = new Promise(function(resolve, reject) {
        Stripe[stripeObject][stripeTask](
          stripeID,
          stripeArgs,
          function(err, res) {
            if (err) {
              reject(err);
            } else {
              resolve(res);
            }
          });
      });

      // Fulfill Promise
      return stripeResource.await(
        function(res) {
          logger.info(res);
          return res;
        }, function(err) {
        logger.error(err);
        throw new Meteor.Error(err);
      });
    } else {
      const stripeResource = new Promise(function(resolve, reject) {
        Stripe[stripeObject][stripeTask](
          stripeID,
          stripeSupportingID,
          stripeArgs,
          function(err, res) {
            if (err) reject(err);
            else resolve(res);
          });
      });

      // Fulfill Promise
      return stripeResource.await(
        function(res) {
          logger.info(res);
          return res;
        }, function(err) {
        logger.error(err);
        throw new Meteor.Error(500, err);
      });
    }
  },
  /**
   * Stripe general purpose resource deleter
   * cruD (D in CRUD)
   * https://stripe.com/docs/api
   *
   * @method stripe_delete
   * @param {String} stripeObject - The main Stripe API Object (e.g. 'customers')
   * @param {String} stripeTask - The specific resource within the Stripe Object that should be updated, (e.g. 'deleteCard')
   * @param {String} stripeID - The id of the specific resource to be updated
   * @param {Object} stripeSupportingID - The id of the specific resource that is attached to the primary stripeID
   */
  stripe_delete: function( stripeObject, stripeTask, stripeID, stripeSupportingID ) {
    logger.info("Started stripe_delete");
    logger.info(stripeObject, stripeTask, stripeID, stripeSupportingID);

    if (!stripeSupportingID) {
      const stripeResource = new Promise(function(resolve, reject) {
        Stripe[stripeObject][stripeTask](
          stripeID,
          function(err, res) {
            if (err) {
              reject(err);
            } else {
              resolve(res);
            }
          });
      });

      // Fulfill Promise
      return stripeResource.await(
        function(res) {
          logger.info(res);
          return res;
        }, function(err) {
        logger.error(err);
        throw new Meteor.Error(500, err);
      });
    } else {
      const stripeResource = new Promise(function(resolve, reject) {
        Stripe[stripeObject][stripeTask](
          stripeID,
          stripeSupportingID,
          function(err, res) {
            if (err) {
              reject(err);
            } else {
              resolve(res);
            }
          });
      });

      // Fulfill Promise
      return stripeResource.await(
        function(res) {
          logger.info(res);
          return res;
        }, function(err) {
        logger.error(err);
        throw new Meteor.Error(500, err);
      });
    }
  },
  'control_flow_of_stripe_event_processing': function( request ) {
    // Setup locally scoped vars for this function
    let check_for_violation,
      event,
      waitForDTUpdate,
      waitForStorage;

    // Get this event from Stripe so we know it wasn't malicious or tampered with
    const STRIPE_REQUEST = StripeFunctions.retrieve_stripe_event( request );
    logger.info("Finished retrieve_stripe_event");

    // Did this event come from Stripe?
    if ( STRIPE_REQUEST ) {
      logger.info(STRIPE_REQUEST.type);
      // Did it come as a pending charge event?
      if (STRIPE_REQUEST.type === 'charge.pending') {
        // Does it violate an out of order rule?
        check_for_violation = StripeFunctions.does_this_charge_event_violate_an_out_of_order_rule(STRIPE_REQUEST);

        // If yes, then we probably received this event in the wrong order,
        // we don't want it to affect our database, so just skip out of processing this event
        if (check_for_violation) {
          return;
        }
      }

      // Wait for the store operation to complete
      waitForStorage = StripeFunctions.store_stripe_event(STRIPE_REQUEST);
      logger.info("Storage status: ", waitForStorage);

      // Send the event to the proper event function
      event = Stripe_Events[STRIPE_REQUEST.type]( STRIPE_REQUEST );

      if (STRIPE_REQUEST.data.object.object === 'charge') {
        logger.info("Sending to DT");
        if (DT_donations.findOne({transaction_id: STRIPE_REQUEST.data.object.id})) {
          // Send the donation change to Donor Tools.
          waitForDTUpdate = Utils.update_dt_donation_status( STRIPE_REQUEST );
        } else {
          // Send the donation to Donor Tools. This function has a retry built
          // in, so also pass 1 for the interval
          StripeFunctions.check_for_necessary_objects_before_inserting_into_dt(
            STRIPE_REQUEST.data.object.id, STRIPE_REQUEST.data.object.customer, 1);
        }
      } else {
        // TODO: not a charge, need to send to a different area, perhaps customer creation?
        // Customer creation doesn't have a corresponding event normally
        // since it is being created with Stripe.js
        return;
      }
    } else {
      // Return since this event either had an error, or it didn't come from Stripe
      logger.info("Exiting control flow, since the event had an error, or didn't come from Stripe");
      throw new Meteor.Error("401", "A request came in, but the event doesn't seem to have come from Stripe!");
    }
  },
  'retrieve_stripe_event': function( webhookEvent ) {
    logger.info("Started retrieve_stripe_event");
    logger.info("Event ID: ", webhookEvent.id);

    // For security purposes, let's verify the event by retrieving it from Stripe.
    const stripeEvent = StripeFunctions.stripe_retrieve('events', 'retrieve', webhookEvent.id, '');
    return stripeEvent;
  },
  'get_invoice': function( invoice_id ) {
    logger.info("Started get_invoice");
    logger.info("Invoice ID: ", invoice_id );

    // Get the invoice from Stripe
    const stripeResource = StripeFunctions.stripe_retrieve('invoices', 'retrieve', invoice_id, '');
    return stripeResource;
  },
  'get_previous_invoice': function( customer_id, invoice_id ) {
    logger.info("Started get_previous_invoice");
    logger.info("Customer ID: ", customer_id );
    logger.info("Invoice ID: ", invoice_id );
    let request;
    if (!invoice_id) {
      request = {customer: customer_id, limit: 1};
    } else {
      request = {customer: customer_id, limit: 1, starting_after: invoice_id};
    }

    // Get the invoice from Stripe
    const stripeResource = StripeFunctions.stripe_retrieve('invoices', 'list',
      request, '');
    return stripeResource;
  },
  /**
   * Update customer with dt_persona_id
   * @method update_customer_metadata
   * @param {String} customer_id    - The Stripe customer id
   * @param {String} dt_persona_id  - The Donor Tools Persona ID of this customer
   */
  'update_customer_metadata': function( customer_id, dt_persona_id ) {
    logger.info("Started update_customer_metadata");
    logger.info("Customer ID: ", customer_id );
    logger.info("DT_persona_id ID: ", dt_persona_id );

    // Update the metadata, dt_persona_id of the customer in Stripe
    const stripeResourceUpdate = StripeFunctions.stripe_update(
      'customers', 'update', customer_id, '', { "metadata": { "dt_persona_id": dt_persona_id } });
    return stripeResourceUpdate;
  },
  'does_this_charge_event_violate_an_out_of_order_rule': function(request_object) {
    logger.info("Started does_this_event_violate_an_out_of_order_rule");

    // Use this function to check to see if this event violates an out of order rule
    logger.info(request_object.data.object.id);

    // Find the stored event
    const charge_cursor = Charges.findOne({_id: request_object.data.object.id});


    // Since we really only care if the event goes from succeeded to pending we
    // really only need to run this test if this event's status is pending
    const check_violation =
    charge_cursor &&
    charge_cursor.status &&
    charge_cursor.status === 'succeeded' ?
      true :
      false;
    logger.info("check_violation results, if true, then it did come in out of order: " + check_violation);

    return check_violation;
  },
  store_stripe_event: function(event_body) {
    logger.info("Started store_stripe_event");

    logger.info(event_body.data.object.id);
    event_body.data.object._id = event_body.data.object.id;

    let resultsOfUpdate, resultsOfUpdate1;
    switch (event_body.data.object.object) {
    case 'balance':
      logger.info("Didn't do anything with this balance event.");
      break;
    case "bank_account":
      resultsOfUpdate = Devices.upsert({_id: event_body.data.object._id}, event_body.data.object);
      break;
    case "card":
      resultsOfUpdate = Devices.upsert({_id: event_body.data.object.id}, event_body.data.object);
      resultsOfUpdate1 = Customers.update({_id: event_body.data.object.customer,
        'sources.data.id': event_body.data.object.id}, {$set: {'sources.data.$': event_body.data.object}});
      break;
    case "charge":
      resultsOfUpdate = Charges.upsert({_id: event_body.data.object.id}, event_body.data.object);
      break;
    case "customer":
      if (event_body.data.object.metadata['balanced.customer_id']) {
        event_body.data.object.metadata.balanced_customer_id = event_body.data.object.metadata['balanced.customer_id'];
        delete event_body.data.object.metadata['balanced.customer_id'];
      }
      logger.info(event_body.data.object);
      resultsOfUpdate = Customers.upsert({_id: event_body.data.object.id}, event_body.data.object);
      break;
    case "invoice":
      resultsOfUpdate = Invoices.upsert({_id: event_body.data.object.id}, event_body.data.object);
      break;
    case "payment":
      resultsOfUpdate = Charges.upsert({_id: event_body.data.object.id}, event_body.data.object);
      break;
    case 'plan':
      logger.info("Didn't do anything with this plan event.");
      break;
    case "refunds":
      resultsOfUpdate = Refunds.upsert({_id: event_body.data.object.id}, event_body.data.object);
      break;
    case "subscription":
      const subscription = Subscriptions.findOne({_id: event_body.data.object.id});
      const subscriptionStatus = subscription.status;
      if (subscriptionStatus !== 'canceled') {
        resultsOfUpdate = Subscriptions.upsert({_id: event_body.data.object.id}, event_body.data.object);
      }
      break;
    case 'transfer':
      logger.info(event_body);
      resultsOfUpdate = Transfers.upsert({_id: event_body.data.object.id}, event_body.data.object);
      const transactions = StripeFunctions.get_transactions_from_transfer(event_body.data.object.id);
      logger.info(transactions);
      StripeFunctions.upsert_stripe_transactions(transactions, event_body.data.object.id);
      break;
    default:
      logger.error("This event didn't fit any of the configured cases, go into store_stripe_event and add the appropriate case.");
    }
    return resultsOfUpdate;
  },
  /**
   * Main method for checking if there is already a user account with this email
   * @method find_user_account_or_make_a_new_one
   * @param {Object} customer - The Stripe customer
   */
  'find_user_account_or_make_a_new_one': function(customer) {
    logger.info("Started find_dt_account_or_make_a_new_one");
    logger.info("customer: ");
    logger.info(customer);

    let email_address, user, user_id, add_user_id_to_customer_metadata;

    // create an email_address variable to be reused below
    email_address = customer.email;

    user = Meteor.users.findOne({'emails.address': email_address});

    // If the user already exists assign the _id to the user_id local var
    // if not then create a user and then assign the same as above
    if ( user ) {
      user_id = user._id;
      Utils.check_for_profile_info_add_if_none(user_id, customer.id);
    } else {
      user_id = Utils.create_user(email_address, customer.id);
      const event = {
        category: 'System',
        type: 'give.account created',
        relatedDoc: user_id,
        userId: user_id,
        relatedCollection: 'Meteor.users',
        page: '/dashboard/users?userID=' + user_id
      };
      Utils.audit_event(event);
      // Set the new user flag
      Meteor.users.update({_id: user_id}, {$set: {newUser: true}});
    }
    // Add the user_id to the Stripe customer metadata
    add_user_id_to_customer_metadata = StripeFunctions.add_user_id_to_customer_metadata(user_id, customer.id);
    logger.info(add_user_id_to_customer_metadata);

    // Send the user_id back to the calling function
    return user_id;
  },
  'add_user_id_to_customer_metadata': function(user_id, customer_id) {
    logger.info("Stared add_user_id_to_customer_metadata");

    const stripeResourceUpdate = StripeFunctions.stripe_update(
      'customers', 'update', customer_id, '', {
        "metadata": {
          "user_id": user_id
        }});
    return stripeResourceUpdate;
  },
  'check_for_necessary_objects_before_inserting_into_dt': function(charge_id, customer_id, interval) {
    logger.info("Started check_for_necessary_objects_before_inserting_into_dt with charge_id: " + charge_id + " and interval of: " + interval);

    let chargeCursor, customerCursor, stripeCustomerRecord, dtPersonaId;

    chargeCursor = Charges.findOne({_id: charge_id});

    customerCursor = Customers.findOne({_id: customer_id});
    logger.info("Metadata: ", customerCursor.metadata);

    if (chargeCursor && customerCursor.metadata && customerCursor.metadata.dt_persona_id) {
      Utils.insert_gift_into_donor_tools( charge_id, customer_id );
    } else if ( interval === 2 ) {
      // Pull the customer record straight from Stripe
      stripeCustomerRecord = Utils.get_stripe_customer( customerCursor.id );
      logger.info("stripeCustomerRecord");
      logger.info(stripeCustomerRecord);

      // Store this version in the collection
      stripeCustomerRecord._id = stripeCustomerRecord.id;
      Customers.upsert({_id: stripeCustomerRecord.id}, stripeCustomerRecord);

      // Wait 15 seconds since we can't find a charge cursor, or we can't find one
      // the customer's Donor Tools id
      Meteor.setTimeout(function() {
        // Increment the interval and send to parent function
        StripeFunctions.check_for_necessary_objects_before_inserting_into_dt( charge_id, customer_id, interval += 1);
      }, 15000);
    } else if ( interval < 5 ) {
      // Wait 15 seconds since we can't find a charge cursor, or we can't find one
      // the customer's Donor Tools id
      Meteor.setTimeout(function() {
        // Increment the interval and send to parent function
        StripeFunctions.check_for_necessary_objects_before_inserting_into_dt( charge_id, customer_id, interval += 1);
      }, 15000);
    } else {
      if (interval % 1 === 0.5) {
        logger.error(500, "There was a problem that prevented the function from getting " +
          "a result from either Donor Tools, or the MongoDB cursors");
        throw new Meteor.Error(500, "There was a problem that prevented the function from getting " +
          "a result from either Donor Tools, or the MongoDB cursors");
      } else {
        // TODO: need to check to see if there is an invoice id on the charge cursor.
        // if there isn't one then this charge likely came from a saved device gift from the user portal
        // In this case we'll need to look for another way to get the persona_id.
        const invoice = StripeFunctions.get_previous_invoice( customer_id, chargeCursor.invoice );

        logger.info("Invoice Object: ");
        logger.info(invoice);
        if (invoice && invoice.data && invoice.data.length > 0) {
          const previous_charge_id = invoice.data[0].charge;
          logger.info("Charge_id: ", previous_charge_id);

          if (previous_charge_id) {
            const dt_donation_cursor = DT_donations.findOne({transaction_id: previous_charge_id});
            logger.info("dt_donation_cursor.persona_id : ", dt_donation_cursor.persona_id );
            dtPersonaId = dt_donation_cursor.persona_id;
          }
        } else {
          dtPersonaId = Utils.find_dt_persona_flow(customerCursor.metadata.email, customer_id);
          logger.info("dtPersonaId : ", dtPersonaId );
          if (!dtPersonaId) {
            logger.error(500, "Couldn't find a charge id on the previous invoice, this is probably a scheduled recurring transaction");
            throw new Meteor.Error(500, "Couldn't find a charge id on the previous invoice, this is probably a scheduled recurring transaction");
          }
        }
        const customerUpdate = Customers.update({_id: customer_id}, { $set: { 'metadata.dt_persona_id': dtPersonaId } });
        StripeFunctions.update_customer_metadata(customer_id, dtPersonaId);
        StripeFunctions.check_for_necessary_objects_before_inserting_into_dt( charge_id, customer_id, interval += 0.5);
      }
    }
  },
  'add_dt_account_id_to_stripe_customer_metadata': function( customer_id, dt_persona_id ) {
    logger.info("Started add_dt_account_id_to_stripe_customer_metadata");
    logger.info("DT Persona ID: ", dt_persona_id);

    const stripeUpdate = StripeFunctions.stripe_update('customers', 'update', customer_id, '',
      {
        "metadata": {
          "dt_persona_id": dt_persona_id
        }
      });
    return stripeUpdate;
  },
  get_transactions_from_transfer: function( id ) {
    logger.info("Started get_transactions_from_transfer");
    logger.info("Transfer id: ", id);

    const stripeGet = StripeFunctions.stripe_retrieve('balance', 'listTransactions',
      { limit: 100, transfer: id }, '');
    return stripeGet;
  },
  upsert_stripe_transactions: function( transactions, transfer_id ) {
    logger.info("Started upsert_stripe_transactions");

    transactions.data.forEach(function(each_transaction) {
      each_transaction.transfer_id = transfer_id;
      Transactions.upsert({_id: each_transaction.id}, each_transaction);
    });
  },
  get_next_or_previous_transfer: function(transfer_id, previous_or_next) {
    logger.info("Started get_next_or_previous_transfer");

    const stripeGet = StripeFunctions.stripe_retrieve('transfers', 'list',
      { limit: 1, [previous_or_next]: transfer_id }, '');

    Transfers.upsert({_id: stripeGet.data[0].id}, stripeGet.data[0]);
    const transactions = StripeFunctions.get_transactions_from_transfer(stripeGet.data[0].id);
    StripeFunctions.upsert_stripe_transactions(transactions, stripeGet.data[0].id);

    return stripeGet;
  }
});
