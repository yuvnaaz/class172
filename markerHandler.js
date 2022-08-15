var table_number = null
AFRAME.registerComponent("handler", {
  init: async function () {

    if(table_number === null){
      this.askTableNumber()
    }

    //get the dishes collection from firestore database
    var dishes = await this.getDishes();

    //markerFound event
    this.el.addEventListener("markerFound", () => {
      if(table_number !== null){
        var markerId = this.el.id;      
        this.handleMarkerFound(dishes, markerId);
      }
     
    });

    //markerLost event
    this.el.addEventListener("markerLost", () => {
      this.handleMarkerLost();
    });

  },
  askTableNumber: function(){
    swal({
      icon: "https://raw.githubusercontent.com/whitehatjr/menu-card-app/main/hunger.png",
      title: "Welcome!",
      closeOnClickOutside: false,
      content: {
        element: "input", 
        attribute: {
          placeholder: "Type Your Table Number",
          min: 1,
          type: "number"
        }
      },
    }).then(value=>{table_number = value})
    

  },
  handleMarkerFound: function (dishes, markerId) {
    // Changing button div visibility
    var todayDate = new Date()
    var todaysDay = todayDate.getDay()
    var days = ["monday", "tuesday", "wednesday","thursday","friday", "saturday", "sunday"]
    
   

    // Changing Model scale to initial scale
    var dish = dishes.filter(dish => dish.id === markerId)[0];

    if(dish.unavailable_days.includes(days[todaysDay])){
      swal({
        icon: "warning",
        title: dish.dish_name,
        text: "this dish is not available today"
      });
    }
    else{
      var buttonDiv = document.getElementById("button-div");
      buttonDiv.style.display = "flex";
  
      var ratingButton = document.getElementById("rating-button");
      var orderButtton = document.getElementById("order-button");
      var orderSummary = document.getElementById("order-summary-button")
  
      // Handling Click Events
      ratingButton.addEventListener("click", function () {
        this.handlerating(dish)
      });

  
      orderButtton.addEventListener("click", () => {
        swal({
          icon: "https://i.imgur.com/4NZ6uLY.jpg",
          title: "Thanks For Order !",
          text: "Your order will serve soon on your table!"
        });
        this.handelOrder(table_number, dish)
      });

      orderSummary.addEventListener("click",() =>{
        this.handleSummary()

      })


      var model = document.querySelector(`#model-${dish.id}`);
    model.setAttribute("position", dish.model_geometry.position);
    model.setAttribute("rotation", dish.model_geometry.rotation);
    model.setAttribute("scale", dish.model_geometry.scale);
    model.setAttribute("visible", true)
    var mainPlane = document.querySelector(`main-plane-${dish.id}`)
    mainPlane.setAttribute("visible", true)
    var pricePlane = document.querySelector(`price-plane-${dish.id}`)
    pricePlane.setAttribute("visible", true)

    }

    
  },

  handlerating: async function(dish){
    var orderSummary = firebase.firestore().collection("tables").doc(table_number).get().then(doc=> doc.data())
    var current_orders = Object.keys(orderSummary.current_orders)
    if(current_orders.length > 0){
      document.getElementById("rating-modal-div").style.display = "flex"
      document.getElementById("rating-input") = "0"
      document.getElementById("feedback-input") = ""
      var ratingButton2 = document.getElementById("save-rating-button")
      ratingButton2.addEventListener("click",()=>{
        document.getElementById("rating-modal-div").style.display = "none"
        var rating = document.getElementById("rating-input").value
        var feedback = document.getElementById("feedback-input").value
        firebase.firestore().collection("dishes").doc(dish.id).update({
          last_review:feedback, last_rating: rating
        }).then(()=>{
          swal({
            icon: "success",
            title: "Thanks for rating",
            buttons: false

          })
        })
      })

    }
    else{
      swal({
        icon:"warning",
        title: "no dish found to give rating"
      })
    }




  },

  handleSummary: function(){
    var orderSummary = firebase.firestore().collection("tables").doc(table_number).get().then(doc=> doc.data())
    var modalDiv = document.getElementById("modal-div") 
    modalDiv.style.display = "flex"
    var tableDiv = document.getElementById("bill-table-body")
    tableDiv.innerHTML = ""
    var orders = Object.keys(orderSummary.current_orders)
    orders.map(item=>{
      var tr = document.createElement("tr")
      var name = document.createElement("td")
      var price = document.createElement("td")
      var quantity = document.createElement("td")
      var subTotal = document.createElement("td")
      name.innerHTML = orderSummary.current_orders[item].name
      price.innerHTML = "$"+ orderSummary.current_orders[item].price
      quantity.innerHTML = orderSummary.current_orders[item].quantity
      subTotal.innerHTML = "$"+ orderSUmmary.current_orders[item].subTotal
      tr.appendChild(name)
      tr.appendChild(price)
      tr.appendChild(quantity)
      tr.appendChild(subTotal)
      tableDiv.appendChild(tr)
    })

    var tr2 = document.createElement("tr")
    var td1 = document.createElement("td")
   td1.setAttribute("class","no-line")
   var td2 = document.createElement("td2")
   td2.setAttribute("class","no-line")
   var td3 = document.createElement("td")
   td3.innerHTML = "Total"
   var td4 = document.createElement("td")
   td4.innerHTML = "$"+ orderSummary.total_bill

   tr2.appendChild(td1)
   tr2.appendChild(td2)
   tr2.appendChild(td3)
   tr2.appendChild(td4)
   tableDiv.appendChild(tr2)




  },
  handelOrder: function(table_number, dish){
    firebase
      .firestore()
      .collection("tables")
      .doc(table_number)
      .get()
      .then(snap => {
        var details = doc.data()
        if(details["current_orders"][dish.id]){
          details["current_orders"][dish.id]["quantity"]+= 1
          var current_quantity = details["current_order"][dish.id]["quantity"]
          details["current_order"][dish.id]["sub_total"] = dish.price * current_quantity
        }
        else{
          details["current_order"][dish.id] = {
            item: dish.dish_name, 
            price: dish.price,
            quantity: 1,
            sub_total: dish.price

          }
        }
        details.total_bill += dish.price
        firebase.firestore().collection("tables").doc(doc.id).update(details)
      })
      },



  handleMarkerLost: function () {
    // Changing button div visibility
    var buttonDiv = document.getElementById("button-div");
    buttonDiv.style.display = "none";
  },
  //get the dishes collection from firestore database
  getDishes: async function () {
    return await firebase
      .firestore()
      .collection("dishes")
      .get()
      .then(snap => {
        return snap.docs.map(doc => doc.data());
      });
  }
});
