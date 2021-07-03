// require('dotenv').config
const express = require('express')
const session = require('express-session')
const expressLayout = require('express-ejs-layouts')
const path = require('path')
const app = express();
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const passport = require('passport')
const moment = require('moment')



// session

const flash = require('express-flash')
const MongoDbStore = require('connect-mongodb-session')(session)

const uri = "mongodb+srv://swapnil:swapnil@cluster0.sycob.mongodb.net/rckart?retryWrites=true&w=majority";
const connection = mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => {
        console.log("MongoDB Connected…")
    })
    .catch(err => console.log(err))

// Collection include
const Menu = require('./models/menu');
const User = require('./models/user')
const Order = require('./models/order')
const Clothe = require('./models/clothe')
const Electronic = require('./models/electronic')
const Furniture = require('./models/furniture')
const Book = require('./models/book')
const { json } = require('express');
const guest = require('./middleware/guest')
const auth = require('./middleware/auth')

//mongostore

let mongostore = new MongoDbStore({
    uri: "mongodb+srv://swapnil:swapnil@cluster0.sycob.mongodb.net/rckart?retryWrites=true&w=majority",
    collection: 'mySessions'

})

//Renmae collection name

// const MongoClient = require("mongodb");
// const url = "mongodb+srv://swapnil:swapnil@cluster0.sycob.mongodb.net/rckart?retryWrites=true&w=majority";
// const databasename = "rckart"; // Database name
// MongoClient.connect(url).then((client) => {
  
//     const connect = client.db(databasename);
  
//     // Connect to collection
//     const collection = connect
//         .collection("clothe");
  
//     // Rename the collection name
//     collection.rename("clothes");
  
//     console.log("Updation successful");
// }).catch((err) => {
//     console.log(err.Message);
// })
// Session Store
const session_Life = 1000 * 60 * 60 * 8765  //SESSION LIFE = 1 YEAR
const session_Name = "mySession"
const session_Secret = "mySecret"

app.use(session({
    name: session_Name,
    resave: false,
    // rolling: false,
    saveUninitialized: false,
    secret: session_Secret,
    cookie: {
        maxAge: session_Life,
        // sameSite: "strict",
        // secure: false
    },
    store: mongostore
}))

// Passport config
const passportInit = require('./config/passport');
const user = require('./models/user');
const { read } = require('fs');
const order = require('./models/order');
passportInit(passport)
app.use(passport.initialize())
app.use(passport.session())


app.use(express.urlencoded({ extended: true }))

app.use(flash())
mongostore.on('error', function (error) {
    console.log(error);
});

// let mongostore =  new MongoDbStore({
//     mongooseConnection : db,
//     collection : "sessions"

// })

app.use(express.json())
app.use((req, res, next) => {
    res.locals.session = req.session
    res.locals.user = req.user
    next()
})


app.use("/static", express.static("static"))
app.use("/css", express.static(path.resolve(__dirname, "static/css")));
app.use("/img", express.static(path.resolve(__dirname, "static/img")));
app.use("/js", express.static(path.resolve(__dirname, "static/js")));
app.use(expressLayout)
app.set("view engine", "ejs")
app.use(express.urlencoded({ extended: true }))
app.set("views", path.join(__dirname, "views"))

app.get('/', (req, res) => {
    res.render('home.ejs')
})
app.get('/register', guest, (req, res) => {
    res.render('signin.ejs')
})
app.get('/login', guest, (req, res) => {
    res.render('login.ejs')
})
app.get('/product', (req, res) => {
    Menu.find().then(function (products) {
        console.log(products)
        return res.render('product.ejs', { products: products })
    })
    // res.render('product.ejs')
})
app.post('/update-cart', (req, res) => {
    if (!req.session.cart) {
        req.session.cart = {
            items: {},
            totalQty: 0,
            totalPrice: 0
        }
    }
    let cart = req.session.cart
    if (!cart.items[req.body._id]) {
        console.log("Not exist")
        // cart.items.push({
        //     item : req.body,
        //     qty : 1}
        // )
        cart.items[req.body._id] = {
            item: req.body,
            qty: 1
        }
        cart.totalQty = cart.totalQty + 1
        cart.totalPrice = cart.totalPrice + req.body.price
    }
    else {
        console.log("Exist")
        cart.items[req.body._id].qty = cart.items[req.body._id].qty + 1
        cart.totalQty = cart.totalQty + 1
        cart.totalPrice = cart.totalPrice + req.body.price
    }
    // var convert = JSON.parse(req.body)
    console.log(cart)

    return res.json({ totalQty: req.session.cart.totalQty })
})

app.get('/remove',(req,res)=>{
    // console.log(req.session.cart.items[req.body._id])
    delete req.session.cart
    res.redirect('/')
})

app.get('/book', (req, res) => {
    Book.find().then(function(products) {
        console.log(products)
        return res.render('books.ejs', { products: products })
    })
    // res.render('books.ejs')
})
app.get('/clothing', (req, res) => {
    Clothe.find().then(function(products) {
        console.log(products)
        return res.render('clothing.ejs', { products: products })
    })
    // res.render('clothing.ejs')
})
app.get('/cart', (req, res) => {
    // console.log(session.cart.item)
    res.render('cart.ejs')
})
app.get('/electronic', (req, res) => {
    Electronic.find().then(function(products) {
        console.log(products)
        return res.render('electronics.ejs', { products: products })
    })
    // res.render('electronics.ejs')
})
app.get('/furniture', (req, res) => {
    Furniture.find().then(function(products) {
        console.log(products)
        return res.render('furniture.ejs', { products: products })
    })
    // res.render('furniture.ejs')
})

app.post("/register", async (req, res) => {
    const { name, email, password } = req.body
    if (!name || !email || !password) {
        req.flash('error', 'All fields are required')
        req.flash('name', name)
        req.flash('email', email)
        return res.redirect('/register')
    }

    User.exists({ email: email }, (err, result) => {
        if (result) {
            req.flash('error', 'Email already taken')
            req.flash('name', name)
            req.flash('email', email)
            return res.redirect('/register')
        }
    })

    //Hashing

    const hashedPassword = await bcrypt.hash(password, 10)

    //User create
    const user = new User({
        name: name,
        email: email,
        password: hashedPassword
    })

    user.save().then(() => {
        //login
        return res.redirect('/login')
    }).catch(err => {
        req.flash('error', 'Something went wrong')
        console.log(err)
        return res.redirect('/register')
    })




    console.log(req.body)
})

app.post('/login', (req, res, next) => {
    const {email , password} = req.body
    if (!email || !password) {
        req.flash('error', 'All fields are required')
        return res.redirect('/login')
    }
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            req.flash('error', info.message)
            return next(err)
        }
        if (!user) {
            req.flash('error', info.message)
            return res.redirect('/login')
        }
        req.logIn(user, (err) => {
            if (err) {
                req.flash('error', info.message)
                return next(err)
            }
            console.log("user logged in")
            return res.redirect('/')
        })
    })(req,res,next)
})

// app.get("/logout",guest,(req,res)=>{
    
// })

app.post("/logout",(req,res)=>{
     req.logout()
     console.log('logout user')
     return res.redirect('/login')
}) 

// Orders Route
app.post('/orders' , auth , (req,res)=>{
    const {address} = req.body
    if (!address){
        req.flash('err','All field required')
        return res.redirect('/cart')
    }

    const order = new Order({
        customerId:req.user._id,
        items:req.session.cart.items,
        address:address
    })
    order.save().then(result =>{
        req.flash('success','Order placed successfull')
        delete req.session.cart
        console.log("success")
        return res.redirect('/customer/order')
    }).catch(err=>{
        req.flash('Something went wrong')
        console.log(err)
        return res.redirect('/cart')
    })


    console.log(req.body)  
})

//CustomerOrderPageRoute
app.get('/customer/order',auth, async(req,res)=>{
    const orders = await Order.find({customerId:req.user._id} , null ,{sort : {'createdAt':-1}})
    res.render('order',{orders:orders , moment:moment})
    console.log(orders)
})


app.listen(3000, () => {
    console.log("Server is running at PORT 3000")
});