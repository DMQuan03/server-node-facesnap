const mongoose = require("mongoose");

async function connect() {
	try {
		await mongoose.connect(process.env.MONGO_URI, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});

		console.log("MongoDb Connect success");
	} catch (error) {
		console.log("MongoDb Connect failed");
	}
}

module.exports = { connect };
