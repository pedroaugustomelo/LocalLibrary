const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const connection = require("./database/database");

const Article = require("./articles/Article");
const Category = require("./categories/category");

const CategoriesController = require("./categories/CategoriesController");
const ArticlesController = require("./articles/ArticlesController");

app.get("/", (req,res)=>{
    res.render("index");
})
//View Engine
app.set('view engine', 'ejs');

//Static
app.use(express.static('public'));

//Body parser
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

//usa controller 
app.use("/", CategoriesController);
app.use("/", ArticlesController);
//Database

connection
.authenticate()
.then(()=> {
    console.log("Conexão OK!")
}).catch((error) => {
 console.log(error);
});


app.listen(8080, ()=>{
    console.log("O servidor está rodando");
});
