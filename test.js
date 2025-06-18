// const mongoose = require('mongoose');

// mongoose.connect("mongodb+srv://babyTrackerDev:babyTrackerDev@babytracker.ucvqdzt.mongodb.net/?ssl=false&retryWrites=true&w=majority&appName=BabyTracker")

//   .then(() => console.log('Connected!'))
//   .catch((err) => console.error('❌ Error:', err));



console.log("00000000000");
  var MongoClient = require('mongodb').MongoClient;
// Connect to the db
console.log("AAAAAAAAAAAA");
MongoClient.connect("mongodb://localhost:27017/", function(err, db) {
    if(err) { return console.dir(err); } //handling errors


    console.log("11111111");
    var collection = db.collection('babytracker'); //selecting the collection
    console.log("2222222222");
    

    var doc = {"email" : 999, "name" : "Ran" }; //valid JSON ibject

    collection.insert(doc,function(err, result) {
        if(err) throw Error;
        console.log(result); //we are getting back the object inserted
    });


    collection.find({"x":999}).toArray(function(err, items) { //foreach
        console.log(items);
    });

});

console.log("AAAAAAAAAAAA");