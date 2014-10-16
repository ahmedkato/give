Template.transaction.helpers({
	name: function () {
		if(this.customer.org){
			return this.customer.org + " " + this.customer.fname + " " + this.customer.lname;
		}else{
			return this.customer.fname + " " + this.customer.lname;
		}
	},
	amount: function () {
		if(this.recurring && this.recurring.subscriptions){
			return this.recurring.subscriptions.amount / 100;
		}else if (this.debit && this.debit.amount){
			return this.debit.amount / 100;	
		}
		
	},
	gift_date: function () {
		return this.created_at
	},
	recurring: function () {
		if(this.recurring) {
			return 'Yes';
		}
		else {
			return 'No';
		}
	},
	recurring_subscription_id: function () {
		if(this.recurring){
			if(this.recurring.subscription){
				return this.recurring.subscription.guid;	
			}
			else if(this.recurring.subscriptions){
				return this.recurring.subscriptions.guid;
			}
		}else{
			return '';
		}
	},
	status: function () {
		if(this.recurring) {
			if(this.recurring.subscription){
				if(this.recurring.subscription.canceled){					
					return "<span id='status' class='label label-default'>Canceled</span>";
				}else if(!this.recurring.subscription.canceled){
					return "<span id='status' class='label label-success'>Active</span>";	
				}
			}else if(this.recurring.subscriptions){
				if(this.recurring.subscriptions.canceled){
					return "<span id='status' class='label label-default'>Canceled</span>";	
				}else if(!this.recurring.subscriptions.canceled){
					return "<span id='status' class='label label-success'>Active</span>";	
				}
			}
		}
		else {
			if(!this.recurring && (this.debit.status === 'succeeded')){
				return "<span id='status' class='label label-success'>Succeeded</span>"
			}else if(!this.recurring && (this.debit.status === 'pending')){
				return "<span id='status' class='label label-warning'>Pending</span>"
			}else if(!this.recurring && (this.debit.status === 'failed')){
				return "<span id='status' class='label label-danger'>Failed</span>"
			}
		}
	},
	detail_record: function () {
		return this._id;		
	}
});
Template.transaction.events({
	'click #delete': function (e, tmpl) {
		e.preventDefault();
		console.log("Started delete process");
		console.log(this._id);
		console.log($('#status').text());

		if(this.recurring && this.recurring.subscriptions && this.recurring.subscriptions.canceled !== true ){
			console.log("Not gonna do it, wouldn't be prudent.");
		}
		/*$('#delete').html('<a id="delete" class="fa fa-spinner fa-spin" href="">');
		Donate.update({_id: this._id}, {$set:{viewable: false}});*/
	},
	'click #view': function(e, tmpl) {

	}
});

Template.transactions.rendered = function () {
	$('.datatable').dataTable();
	$('#mainTable').editableTableWidget(); //this needs to run each time the data on the screen changes, otherwise it doesn't work. 
};

Template.transactions.helpers({
	transaction_item: function () {
		return Donate.find({});
	}
});
	