// importing express
const express = require("express");
const validator = require("validator");

// creating a server
const app = express();

// set render method to ejs
// for rendering ejs we need view engine
// for it to work the folder name should be views and should contain the files to be rendered
// ejs is run by view engine like chrome is run by v8 engine
app.set("view engine", "ejs");

// these lines help take out the body if sending some data
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// home route
app.get("/", (req, res) => {
    res.send("Welcome to my app");
})

// login page 
app.get("/login", (req, res) => {
    // return res.send("Login page");
    // instead of just sending a string, we want to render the template for login from ejs file
    return res.render("login");
})

app.post("/login", (req, res) => {
    return res.render("login");
})

app.get("/register", (req, res) => {
    // return res.send("Register page");
    return res.render("register");
})

// validating the information by the user in the form
const cleanUpAndValidate = ({name, email, username, password}) => {
    // want to return a promise so that if any error happens then can handle it with try catch or .then .catch and send it to client side
    return new Promise((resolve, reject) => {
        if (typeof email != "string") reject("Invalid email");
        if (typeof name != "string") reject("Invalid name");
        if (typeof username != "string") reject("Invalid username");
        if (typeof password != "string") reject("Invalid password");

        // if of string type but empty string
        if (!email || !password || !username) reject("Invalid data");

        // use validator package to validate email
        // package checks only for email format and not if the email is authentic or not
        if (!validator.isEmail(email)) reject("Invalid email format");

        if (username.length < 5) reject("Username too short");
        if (username.length > 50) reject("Username too long");
        if (password.length < 5) reject("Password too short");
        if (password.length > 200) reject("Password too long");

        // if everything correcta
        resolve();
    })
    // there is no need for a promise in manual validation that is done, but is required only for validator package
}

app.post("/register", async (req, res) => {
    console.log(req.body);
    // destructuring the info that we are getting in terminal which is filled in the form, after that form is submitted and post request is made and we get the information
    const {name, email, username, password} = req.body;
    
    // since below func is async hence need to await for it so that it can validate before moving forward, hence have to mention async in parent function
    try {
        await cleanUpAndValidate({name, email, username, password});
    }
    catch(err) {
        return res.send(
            {
                status: 400,
                message: err
            }
        )
    }
    // since retuning a promise we also need to catch it. since .then and .catch will become very messy hence after this all code has to be written in .then block, we use try catch block

    return res.send(
        {
            status: 200,
            message: "User registered"
        }
    );
})

// listening to server
app.listen(8000, () => {
    console.log("Listening to port 8000");
})