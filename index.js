const express = require("express")
const app = express()
const MongoClient = require('mongodb').MongoClient;
const mongourl = "mongodb+srv://danny:asd8988665@cluster0.5rjsh.mongodb.net/project?retryWrites=true&w=majority"
const dbName = 'project';
const mongoose = require('mongoose');
const ObjectID = require('mongodb').ObjectID;
const client = new MongoClient(mongourl)
const assert = require('assert')
const bodyParser = require('body-parser')
const session = require('express-session')
const flash = require('express-flash')
const fs = require('fs')
const formidable = require('formidable');
const path = require('path')
const multer = require('multer')
const inventoryModel = require('./model/inventoryModel')
const accountModel = require('./model/accountModel')



const connectDB = () => {
    mongoose.connect(mongourl);
    let db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));
}

app.use(flash())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(session({
    secret: 'mySecret',
    name: 'user',
    saveUninitialized: false,
    resave: true,
    cookie: { maxAge: 6000000 }
}))
app.use(express.static(__dirname + '/public'))

app.set('views', path.join(__dirname, 'views'));

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads')
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now())
    }
})

var upload = multer({ storage: storage })



// index page
app.get('/index', (req, res, next) => {
    if (req.session.user) {
        res.render('index.ejs', { name: req.session.user })
    } else {
        res.redirect('/login')
    }

})

//restful services
app.get('/api/inventory/name/:name', (req, res) => {
    connectDB()
    inventoryModel.find({ "name": req.params.name }, (err, items) => {
        if (err) {
            console.log(err)
        } else {
            res.json(items)
        }
    })

})

app.get('/api/inventory/type/:type', (req, res) => {
    connectDB()
    inventoryModel.find({ "type": req.params.type }, (err, items) => {
        if (err) {
            console.error(err)
        } else {
            res.json(items)
        }
    })
})

//first page
app.get('/', (req, res) => {
    console.log(req.session)
    var user = req.session.user
    if (!user) {
        user = "guest"
    }
    res.send("hello " + user + "<br>" + "<a href='/login'>Login First</a>")
})

//edit page
app.get('/edit', (req, res) => {
    if (!req.session.user) {
        res.send("<script>alert('overtime');location.href = '/login'</script>")
    } else {
        connectDB()
        inventoryModel.find({ "_id": req.query._id }, (err, items) => {
            if (err) {
                console.log(err)
            } else {
                console.log(req.query._id)
                res.render('edit.ejs', { items: items })
            }
        })
    }
})

app.post('/edit', upload.single('filetoupload'), (req, res) => {
    var user = req.session.user;
    var getdata;
    if (!user) {
        user = "demo"
        res.send("<script>alert('overtime');location.href = '/login'</script>")
    } else {
        if (req.file != null) {
            var getdata = {
                name: req.body.name,
                type: req.body.type,
                quantity: req.body.qty,
                img: {
                    data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
                    contentType: req.file.mimetype
                },
                inventory_address: {
                    street: req.body.street,
                    bg: req.body.buliding,
                    country: req.body.country,
                    zipcode: req.body.zipcode,
                    coord: {
                        latitude: req.body.latitude,
                        longitude: req.body.longitude
                    }
                },
                manager: user
            }
        } else {
            var getdata = {
                name: req.body.name,
                type: req.body.type,
                quantity: req.body.qty,
                img: {
                    data: "",
                    contentType: ""
                },
                inventory_address: {
                    street: req.body.street,
                    bg: req.body.buliding,
                    country: req.body.country,
                    zipcode: req.body.zipcode,
                    coord: {
                        latitude: req.body.latitude,
                        longitude: req.body.longitude
                    }
                },
                manager: user
            }
        }
        var getManager = "";
        var check
        connectDB()
        inventoryModel.find({ "_id": req.body._id }, (err, items) => {
            if (err) { console.log('error') };
            getManager = items[0].manager
            if (getManager === req.session.user) {
                check = true
            }
            console.log(req.session.user)
            if (check) {
                inventoryModel.findByIdAndUpdate({ "_id": req.body._id }, getdata, (err, item) => {
                    if (err) { console.log('error') };
                    res.redirect(`/detail?_id=${req.body._id}`)
                })
            } else {
                res.send(`<script>alert("wrong manager"); location.href = "/edit?_id=${req.body._id}"</script>`)
            }
        })
    }
})

//delete intentory
app.get('/delete', (req, res) => {
    var getManager = "";
    var check
    if (!req.session.user) {
        res.send("<script>alert('overtime');location.href = '/login'</script>")
    } else {
        connectDB()
        inventoryModel.find({ "_id": req.query._id }, (err, items) => {
            if (err) { console.log('error') };
            getManager = items[0].manager
            if (getManager === req.session.user) {
                check = true
            }
            console.log(req.session.user)
            if (check) {
                inventoryModel.deleteOne({ _id: req.query._id }, (err, result) => {
                    if (err) console.log(err);
                    res.render('delete.ejs')
                })
            } else {
                res.send(`<script>alert("wrong manager"); location.href = "/detail?_id=${req.query._id}"</script>`)
            }
        })


    }

})

//show map
app.get('/map', ((req, res) => {
    console.log(req.query._id)
    connectDB()
    inventoryModel.find({ _id: req.query._id }, (err, items) => {
        if (err) {
            console.log(err)
        } else {
            res.render('map.ejs', { items: items })
        }
    })
}))

//show inventory detail 
app.get('/detail', (req, res) => {
    if (!req.session.user) {
        res.send("<script>alert('overtime');location.href = '/login'</script>")
    } else {
        connectDB()
        inventoryModel.find({ "_id": req.query._id }, (err, items) => {
            if (err) {
                console.log(err)
            } else {
                console.log(req.query._id)
                res.render('detail.ejs', { items: items })
            }
        })
    }
})


//create inventory 
app.get('/create', (req, res) => {
    if (!req.session.user) {
        res.send("<script>alert('overtime');location.href = '/login'</script>")
    } else {
        res.render('create.ejs')
    }
})

app.post('/create', upload.single('filetoupload'), (req, res, next) => {
    const form = new formidable.IncomingForm();
    var getdata
    var user = req.session.user;
    if (!user) {
        user = "demo"
        res.send("<script>alert('overtime');location.href = '/login'</script>")
    } else {
        if (req.file != null) {
            var getdata = {
                name: req.body.name,
                type: req.body.type,
                quantity: req.body.qty,
                img: {
                    data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
                    contentType: req.file.mimetype
                },
                inventory_address: {
                    street: req.body.street,
                    bg: req.body.buliding,
                    country: req.body.country,
                    zipcode: req.body.zipcode,
                    coord: {
                        latitude: req.body.latitude,
                        longitude: req.body.longitude
                    }
                },
                manager: user
            }
        } else {
            var getdata = {
                name: req.body.name,
                type: req.body.type,
                quantity: req.body.qty,
                img: {
                    data: "",
                    contentType: ""
                },
                inventory_address: {
                    street: req.body.street,
                    bg: req.body.buliding,
                    country: req.body.country,
                    zipcode: req.body.zipcode,
                    coord: {
                        latitude: req.body.latitude,
                        longitude: req.body.longitude
                    }
                },
                manager: user
            }
        }
        console.log(getdata)
        connectDB()

        inventoryModel.create(getdata, (err, items) => {
            if (err) return handleError(err);
            console.log('Inserted')
            res.redirect('/view')
        })

    }


})

//view total inventory and search the inventory by name
app.get('/view', (req, res) => {
    connectDB()
    if (!req.session.user) {
        res.send("<script>alert('overtime');location.href = '/login'</script>")
    } else {
        if (req.query.search) {
            inventoryModel.find({ "name": { $regex: req.query.search, $options: 'i' } }, (err, items) => {
                if (err) {
                    console.log(err)
                } else {
                    res.render('view.ejs', { items: items })
                }
            })
        } else {
            inventoryModel.find({}, (err, items) => {
                if (err) {
                    console.log(err)
                } else {
                    res.render('view.ejs', { items: items })
                }
            })
        }
    }
})

//login authentication
app.get('/login', (req, res) => {
    if (!req.session.user) {
        res.render('login.ejs')
    } else {
        res.redirect('/view')
    }
})

app.post('/login', (req, res) => {
    var user = req.body.user
    var password = req.body.password
    var path

    connectDB()
    accountModel.find({}, (err, items) => {
        if (err) return err;
        items.forEach((item) => {
            if (item.username === user && item.password === password) {
                req.session.user = item.username
                path = true
            }
        })
        if (path) {
            res.redirect('/view')
        } else {
            res.send("<script>alert('username or password is incorrect, please try again');location.href = '/login'</script>")
        }
    })
})


//login authentication
/*app.post('/login', (req, res) => {
    var path;
    const findDocument = (db, callback) => {
        let cursor = db.collection('Account').find({});
        cursor.toArray((err, docs) => {
            assert.equal(err, null);
            console.log(`findDocument: ${docs.length}`);
            callback(docs);
        });
    }

    client.connect((err) => {
        assert.equal(null, err)
        console.log('Connected successfully to server')
        const db = client.db(dbName)
        findDocument(db, (docs) => {
            client.close();
            docs.forEach(data => {
                if (data.username === req.body.username && data.password === req.body.password) {
                    req.session.user = data.username
                    path = true
                }

            })
            if (path) {
                res.redirect('/index')
            } else {
                res.redirect('/login')
            }
        })
    })


})*/

//handle logout(session destroy)
app.get('/logout', (req, res) => {
    req.session.destroy()
    res.redirect('/')
})

//create account 
app.get('/createAccount', (req, res) => {
    res.render('createAccount.ejs')
})

app.post('/createAccount', (req, res) => {
    var userData
    if (req.body.password === "") {
        var userData = {
            username: req.body.user,
            password: ""
        }
    } else {
        var userData = {
            username: req.body.user,
            password: req.body.password
        }
    }
    var path
    connectDB()
    if (req.body.user === "") {
        alert("Please enter")
        res.redirect('/createAccount')
    } else {
        accountModel.find({}, (err, items) => {
            items.forEach((item) => {
                if (err) return err;
                if (item.username === req.body.user) {
                    path = true
                }
            })
            if (path) {
                res.send("<script>alert('the username may inserted');location.href = '/createAccount'</script>")

            } else {
                accountModel.create(userData, (err, result) => {
                    if (err) return err;
                    console.log(result)
                    res.send("<script>alert('create successful');location.href = '/login'</script>")
                })
            }
        })
    }
})




app.listen(process.env.PORT || 8099)