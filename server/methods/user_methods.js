Meteor.methods({
  stripeUpdateSubscription: function (customer_id, subscription_id, token_id, status, device_type) {
    logger.info("Started method stripeUpdateSubscription.");
    if(this.userId){
      // Check our arguments against their expected patterns. This is especially
      // important here because we're dealing with sensitive customer information.
      check(customer_id, String);
      check(subscription_id, String);
      check(token_id, String);
      check(status, String);
      check(device_type, String);

      if(status === 'canceled'){
        var subscription_amount = Subscriptions.findOne({_id: subscription_id}).quantity;
        var subscription_metadata = Subscriptions.findOne({_id: subscription_id}).metadata;
        subscription_metadata.donateWith = "Card";
        var subscription_plan = Subscriptions.findOne({_id: subscription_id}).plan.name;
        var created_subscription = Utils.stripe_create_subscription(customer_id, token_id, subscription_plan, subscription_amount, subscription_metadata);
        if(!created_subscription.object){
          return {error: created_subscription.rawType, message: created_subscription.message};
        }
        else {
          Subscriptions.update({_id: subscription_id}, {$set: {'metadata.replaced': true, 'metadata.replaced_with': created_subscription._id}});
          return 'success';
        }
      } else {
        var updated_subscription = Utils.update_stripe_customer_subscription(customer_id, subscription_id, token_id, device_type);
        console.log(updated_subscription);
        if(!updated_subscription.object){
          return {error: updated_subscription.rawType, message: updated_subscription.message};
        } else {
          Subscriptions.update({_id: updated_subscription.id}, {$set: updated_subscription});
          return 'success';
        }
      }
    } else {
      return Meteor.Error(403, "Not logged in");
    }
  },
  stripeUpdateCard: function (updated_data) {
    logger.info("Started method stripeUpdateCard.");

    if(this.userId){
      // Check our arguments against their expected patterns. This is especially
      // important here because we're dealing with sensitive customer information.
      check(updated_data, {
        customer_id: String,
        subscription_id: String,
        status: String,
        card: String,
        exp_month: String,
        exp_year: String
      });
      console.log(updated_data.status);

      var subscription_amount = Subscriptions.findOne({_id: updated_data.subscription_id}).quantity;
      var subscription_metadata = Subscriptions.findOne({_id: updated_data.subscription_id}).metadata;
      subscription_metadata.donateWith = "Card";
      var subscription_plan = Subscriptions.findOne({_id: updated_data.subscription_id}).plan.name;
      if (updated_data.status === 'canceled') {
        var updated_card = Utils.update_stripe_customer_card(updated_data);
        if (!updated_card.object) {
          return {error: updated_card.rawType, message: updated_card.message};
        } else {
          var created_subscription = Utils.stripe_create_subscription(updated_data.customer_id, updated_data.card, subscription_plan, subscription_amount, subscription_metadata);
          if (!created_subscription.object) {
            return {error: created_subscription.rawType, message: created_subscription.message};
          }
          else {
            Subscriptions.update({_id: updated_data.subscription_id}, {$set: {'metadata.replaced': true, 'metadata.replaced_with': created_subscription._id}});
            return 'new';
          }
        }
      } else {
        var updated_card = Utils.update_stripe_customer_card(updated_data);
        // Store the updated information with both the device and the customer records that use that device.
        Devices.update({_id: updated_card.id}, updated_card);
        var result_of_update = Customers.update({_id: updated_card.customer, 'sources.data.id': updated_card.id}, {$set: {'sources.data.$': updated_card}});
        Utils.update_stripe_customer_default_source(updated_card.customer, updated_card.id);

        if (!updated_card.object) {
          return {error: updated_card.rawType, message: updated_card.message};
        } else {
          return 'success';
        }
      }
    }
    throw new Meteor.Error(403, "Not logged in");
  },
  stripeUpdateBank: function (bank, subscription_id, save_payment) {
    logger.info("Started method stripeUpdateBank.");

    if (this.userId) {
      // Check our arguments against their expected patterns. This is especially
      // important here because we're dealing with sensitive customer information.
      check( bank, String );
      check( subscription_id, String );
      check( save_payment, Boolean );

      try {
        let subscription = Subscriptions.findOne( { _id: subscription_id } );
        let subscription_amount = subscription.quantity;
        let subscription_status = subscription.status;
        let subscription_metadata = subscription.metadata;
        subscription_metadata.donateWith = "Check";
        let subscription_plan = subscription.plan.name;
        let customer_id = subscription.customer;
        let bank_token = bank;

        if( subscription_status === 'canceled' ) {
          var updated_bank = Utils.update_stripe_customer_bank( customer_id, bank, save_payment );
          if( !updated_bank.object ) {
            return {
              error:   updated_bank.rawType,
              message: updated_bank.message
            };
          } else {
            var created_subscription = Utils.stripe_create_subscription( customer_id, bank, subscription_plan, subscription_amount, subscription_metadata );
            if( !created_subscription.object ) {
              return {
                error:   created_subscription.rawType,
                message: created_subscription.message
              };
            } else {
              Subscriptions.update( { _id: subscription_id }, {
                $set: {
                  'metadata.replaced':      true,
                  'metadata.replaced_with': created_subscription._id
                }
              } );
              return 'new';
            }
          }
        } else {
          let updated_bank = Utils.update_stripe_customer_bank( customer_id, bank_token );
          Utils.update_stripe_bank_metadata( customer_id, updated_bank.id, save_payment );
          Utils.update_stripe_customer_default_source( customer_id, updated_bank.id );

          if( !updated_bank.object ) {
            return {
              error:   updated_bank.rawType,
              message: updated_bank.message
            };
          } else {
            Subscriptions.update( { _id: subscription.id }, {
              $set: {
                'metadata.donateWith': subscription_metadata.donateWith
              }
            } );
            return 'success';
          }
        }
      } catch( e ) {
        console.log( e );
        throw new Meteor.Error( e.statusCode, e.message, e.type );
      }
    }
      throw new Meteor.Error(403, "Not logged in");
    },
  stripeRestartBankSubscription: function(restart_data) {
    logger.info("Started method stripeRestartBankSubscription.");

    if (this.userId) {
      // Check our arguments against their expected patterns. This is especially
      // important here because we're dealing with sensitive customer information.
      check( restart_data, {
        customer_id: String,
        subscription_id: String,
        status: String,
        bank: String
      } );
      console.log( restart_data.status );

      if( restart_data.status === 'canceled' ) {
        var subscription_amount = Subscriptions.findOne( { _id: restart_data.subscription_id } ).quantity;
        var subscription_metadata = Subscriptions.findOne( { _id: restart_data.subscription_id } ).metadata;
        var subscription_plan = Subscriptions.findOne( { _id: restart_data.subscription_id } ).plan.name;

        var created_subscription = Utils.stripe_create_subscription( restart_data.customer_id, restart_data.bank, subscription_plan, subscription_amount, subscription_metadata );
        if( !created_subscription.object ) {
          return {
            error:   created_subscription.rawType,
            message: created_subscription.message
          };
        }
        else {
          Subscriptions.update( { _id: restart_data.subscription_id }, {
            $set: {
              'metadata.replaced':      true,
              'metadata.replaced_with': created_subscription._id
            }
          } );
          return 'new';
        }
      } else {
        throw new Meteor.Error( 500, "This gift is already not in the canceled state" );
      }
    }
    throw new Meteor.Error(403, "Not logged in");
  },
  stripeCancelSubscription: function (customer_id, subscription_id, reason) {
    logger.info("Started method stripeCancelSubscription.");

    if (this.userId) {
      check( customer_id, String );
      check( subscription_id, String );
      check( reason, String );

      var cancel_subscription = Utils.cancel_stripe_subscription( customer_id, subscription_id, reason );
      if( !cancel_subscription.object ) {
        return {
          error:   cancel_subscription.rawType,
          message: cancel_subscription.message
        };
      } else {
        return 'success';
      }
    }
    throw new Meteor.Error(403, "Not logged in");
  },
  get_all_donations_for_this_donor: function(id) {
    logger.info( "Started method get_all_donations_for_this_donor." );
    if (this.userId) {
      check( id, Match.Optional( String ) );

      var userID;
      this.unblock();

      if (id) {
        if( Roles.userIsInRole( this.userId, ['admin'] ) ) {
          userID = id;
        } else {
          logger.warn( "ID detected when not logged in as an admin" );
          throw new Meteor.Error(402, "You can't do that.");
          return;
        }
      } else {
        userID = this.userId;
      }
      let persona_ids = Meteor.users.findOne( { _id: userID } ) &&
        Meteor.users.findOne( { _id: userID } ).persona_ids;

      let persona_id = Meteor.users.findOne( { _id: userID } ) &&
        Meteor.users.findOne( { _id: userID } ).persona_id;

      if (persona_ids && persona_ids.length && persona_ids.length >= 1) {
        Utils.get_all_dt_donations( persona_ids );
        return "got em";
      } else if (persona_id && persona_id.length && persona_id.length >= 1) {
        Utils.get_all_dt_donations( persona_id );
        return "got em";
      } else {
        return "no persona_ids found";
      }
    }
    throw new Meteor.Error(403, "Not logged in");
  },
  process_bank_manually: function(bankInfo) {
    logger.info("Started method get_all_donations_for_this_donor.");
    check(bankInfo, {
      name: String,
      account_holder_name: String,
      account_holder_type: String,
      account_type: Match.Optional(String),
      account_number: String,
      routing_number: String,
      address_line1: String,
      address_line2: Match.Optional(String),
      address_city: String,
      address_state: String,
      address_zip: String,
      country: Match.Optional(String)
    });
    console.log("Got past check");
    let bank = BankAccounts.insert(bankInfo);
    return bank;
  },
  putProfileAddress: function(activeTab) {
    logger.info("Started method get_all_donations_for_this_donor.");

    check(activeTab, Match.Optional(String));
    if (this.userId) {
      let persona, persona_info, address;

      if( activeTab ) {
        persona_info = Meteor.users.findOne( { _id: this.userId } ) && Meteor.users.findOne( { _id: this.userId } ).persona_info;
        persona = _.where( persona_info, { id: Number( activeTab ) } );
      } else {
        persona_info = Meteor.users.findOne() && Meteor.users.findOne().persona_info;
        if( persona_info && persona_info.length > 0 ) {
          persona = persona_info[0];
        }
      }

      if( persona ) {
        let street_address = persona.addresses[0].street_address;
        street_address = street_address.split( "\n" );
        address = {
          city:        persona.addresses[0].city,
          state:       persona.addresses[0].state,
          postal_code: persona.addresses[0].postal_code,
          address_line1:       street_address[0],
          address_line2:       street_address[1]
        };
        return Meteor.users.update( { _id: this.userId }, { $set: { 'profile.address': address } } );
      }
    }
    return;
  }
});

